import prisma from '../utils/prisma.js';

export const userController = {
  // Get all registered app users
  async getUsers(req, res, next) {
    try {
      const users = await prisma.appUser.findMany({
        orderBy: { name: 'asc' },
        include: { resource: true }
      });
      return res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  },

  // Create or invite new user
  async createUser(req, res, next) {
    try {
      const { name, email, role, department, employeeId } = req.body;
      const user = await prisma.appUser.create({
        data: {
          name,
          email,
          role: role || 'Viewer',
          department,
          employeeId,
          ssoProvider: 'AzureAD'
        }
      });
      return res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  // Update user role or permissions
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { role, active, permissionsJson, department } = req.body;
      const updated = await prisma.appUser.update({
        where: { id },
        data: {
          role,
          active,
          permissionsJson,
          department
        }
      });
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  // Get project and task audit history logs
  async getAuditLogs(req, res, next) {
    try {
      const [projectLogs, taskLogs] = await Promise.all([
        prisma.projectHistory.findMany({
          take: 100,
          orderBy: { changedAt: 'desc' },
          include: { project: { select: { projectName: true, workfrontProjectId: true } } }
        }),
        prisma.taskHistory.findMany({
          take: 100,
          orderBy: { changedAt: 'desc' },
          include: { task: { select: { taskName: true } } }
        })
      ]);

      return res.json({
        success: true,
        data: { projectLogs, taskLogs }
      });
    } catch (err) {
      next(err);
    }
  }
};

export default userController;
