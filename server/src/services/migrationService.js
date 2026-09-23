import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

export const migrationService = {
  // Safe idempotent migration of legacy browser localStorage items
  async migrateLocalStorage(legacyProjects = []) {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const details = [];

    for (const item of legacyProjects) {
      try {
        if (!item || (!item.projectName && !item.name)) {
          skipped++;
          continue;
        }

        const name = item.projectName || item.name;
        const wfId = item.workfrontProjectId || item.wfId || item.id || null;

        let existing = null;
        if (wfId) {
          existing = await prisma.project.findUnique({
            where: { workfrontProjectId: String(wfId) }
          });
        }

        const projectData = {
          workfrontProjectId: wfId ? String(wfId) : null,
          projectName: name,
          status: item.status || 'Yet to Start',
          lob: item.lob || null,
          priority: item.priority || 'Normal',
          requestType: item.requestType || item.typeOfRequest || null,
          taskComplexity: item.taskComplexity || item.complexity || null,
          expectedStartDate: item.expectedStartDate ? new Date(item.expectedStartDate) : null,
          targetDeploymentDate: item.targetDeploymentDate ? new Date(item.targetDeploymentDate) : null,
          deploymentChannel: item.deploymentChannel || null,
          requesterName: item.requesterName || null,
          remarks: item.remarks || null,
          rawWorkfrontJson: item
        };

        if (existing) {
          await prisma.project.update({
            where: { id: existing.id },
            data: projectData
          });
          updated++;
          details.push({ wfId, name, action: 'UPDATED' });
        } else {
          await prisma.project.create({
            data: projectData
          });
          imported++;
          details.push({ wfId, name, action: 'IMPORTED' });
        }
      } catch (err) {
        logger.error(`Migration error on item:`, err);
        failed++;
        details.push({ item, error: err.message, action: 'FAILED' });
      }
    }

    return {
      imported,
      updated,
      skipped,
      failed,
      details
    };
  }
};

export default migrationService;
