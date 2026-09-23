import dotenv from 'dotenv';
import app from './app.js';
import logger from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Workfront Logger Enterprise API Server running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/health`);
});
