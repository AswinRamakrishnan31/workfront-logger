import projectService from '../services/projectService.js';

export const projectController = {
  async getProjects(req, res, next) {
    try {
      const result = await projectService.getProjects(req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Project not found' });
      }
      return res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  async createProject(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.user?.email);
      return res.status(201).json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  async updateProject(req, res, next) {
    try {
      const updated = await projectService.updateProject(req.params.id, req.body, req.user?.email);
      return res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteProject(req, res, next) {
    try {
      await projectService.deleteProject(req.params.id, req.user?.email);
      return res.json({ success: true, message: 'Project archived successfully' });
    } catch (err) {
      next(err);
    }
  }
};

export default projectController;
