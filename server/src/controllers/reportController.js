import prisma from '../utils/prisma.js';

export const reportController = {
  // Get aggregated dashboard & SLA performance metrics
  async getSummary(req, res, next) {
    try {
      const [totalProjects, activeProjects, deployedProjects, statusDistribution, lobDistribution] = await Promise.all([
        prisma.project.count({ where: { isDeleted: false } }),
        prisma.project.count({
          where: {
            isDeleted: false,
            status: { in: ['In-Developement', 'In-QA', 'In-UAT', 'In-Pre-Depoyment-Checks', 'Scheduled'] }
          }
        }),
        prisma.project.count({
          where: { isDeleted: false, status: 'Deployed' }
        }),
        prisma.project.groupBy({
          by: ['status'],
          where: { isDeleted: false },
          _count: { status: true }
        }),
        prisma.project.groupBy({
          by: ['lob'],
          where: { isDeleted: false },
          _count: { lob: true }
        })
      ]);

      return res.json({
        success: true,
        data: {
          totalProjects,
          activeProjects,
          deployedProjects,
          statusDistribution,
          lobDistribution
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default reportController;
