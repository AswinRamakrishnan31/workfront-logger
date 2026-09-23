import migrationService from '../services/migrationService.js';

export const migrationController = {
  async migrateLocalStorage(req, res, next) {
    try {
      const { projects } = req.body; // Array of legacy project objects
      if (!Array.isArray(projects)) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Payload must contain a projects array'
        });
      }

      const result = await migrationService.migrateLocalStorage(projects);
      return res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }
};

export default migrationController;
