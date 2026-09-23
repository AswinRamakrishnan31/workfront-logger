import dbAdminService from '../services/dbAdminService.js';

export const dbAdminController = {
  async getStorageStats(req, res, next) {
    try {
      const stats = await dbAdminService.getStorageStats();
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  },

  async getBackups(req, res, next) {
    try {
      const backups = await dbAdminService.getBackups();
      return res.json({ success: true, data: backups });
    } catch (err) {
      next(err);
    }
  },

  async createBackup(req, res, next) {
    try {
      const { label } = req.body;
      const result = await dbAdminService.createBackup(label || 'manual');
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async restoreBackup(req, res, next) {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ success: false, message: 'fileName is required for database restore' });
      }
      const result = await dbAdminService.restoreBackup(fileName);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getArchives(req, res, next) {
    try {
      const archives = await dbAdminService.getArchives();
      return res.json({ success: true, data: archives });
    } catch (err) {
      next(err);
    }
  },

  async archiveData(req, res, next) {
    try {
      const { periodMonths, customCutoffDate } = req.body;
      const result = await dbAdminService.archiveData({ periodMonths, customCutoffDate });
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default dbAdminController;
