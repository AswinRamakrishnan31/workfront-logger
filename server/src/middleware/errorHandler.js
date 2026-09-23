import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`API Error on ${req.method} ${req.url}:`, err);

  // Prisma connection error (e.g. database server unreachable or schema pending migration)
  if (err.code === 'P1001' || err.code === 'P1002' || err.message?.includes('Can\'t reach database server')) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'Database server offline or pending PostgreSQL URL configuration. App is running in Local Storage fallback mode.',
      isFallback: true
    });
  }

  // Zod validation error handling
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data payload',
      details: err.errors
    });
  }

  // Optimistic concurrency conflict error (version mismatch)
  if (err.code === 'P2025' || err.name === 'ConflictError') {
    return res.status(409).json({
      success: false,
      code: 'CONFLICT_ERROR',
      message: 'This record has been updated by another user. Please refresh before saving.'
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred'
  });
};

export default errorHandler;
