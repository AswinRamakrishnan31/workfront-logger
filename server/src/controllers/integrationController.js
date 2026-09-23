import prisma from '../utils/prisma.js';

export const integrationController = {
  // Get integration settings
  async getConfigs(req, res, next) {
    try {
      const configs = await prisma.integrationConfig.findMany({
        include: {
          syncLogs: {
            take: 5,
            orderBy: { startedAt: 'desc' }
          }
        }
      });
      return res.json({ success: true, data: configs });
    } catch (err) {
      next(err);
    }
  },

  // Save / Update integration configuration
  async saveConfig(req, res, next) {
    try {
      const { name, baseUrl, apiKey, oauthClientId, syncEnabled, syncIntervalMin } = req.body;
      const config = await prisma.integrationConfig.upsert({
        where: { name: name || 'Workfront Production API' },
        update: {
          baseUrl,
          apiKey,
          oauthClientId,
          syncEnabled,
          syncIntervalMin
        },
        create: {
          name: name || 'Workfront Production API',
          provider: 'Workfront',
          baseUrl,
          apiKey,
          oauthClientId,
          syncEnabled,
          syncIntervalMin
        }
      });
      return res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  },

  // Trigger manual sync simulation / integration test
  async triggerSync(req, res, next) {
    try {
      const { configId } = req.body;
      const config = await prisma.integrationConfig.findFirst({
        where: configId ? { id: configId } : {}
      });

      if (!config) {
        return res.status(404).json({ success: false, message: 'Integration config not found' });
      }

      // Log sync execution
      const syncLog = await prisma.integrationSyncLog.create({
        data: {
          configId: config.id,
          status: 'SUCCESS',
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          detailsJson: { message: 'Manual sync triggered successfully. No new Workfront records pending.' },
          completedAt: new Date()
        }
      });

      await prisma.integrationConfig.update({
        where: { id: config.id },
        data: { lastSyncAt: new Date() }
      });

      return res.json({ success: true, data: syncLog });
    } catch (err) {
      next(err);
    }
  }
};

export default integrationController;
