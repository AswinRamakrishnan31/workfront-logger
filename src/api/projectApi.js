import request from './apiClient';

export const projectApi = {
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/projects?${query}` : '/projects';
    return request(endpoint);
  },

  async getProjectById(id) {
    return request(`/projects/${id}`);
  },

  async createProject(projectData) {
    return request('/projects', {
      method: 'POST',
      body: projectData
    });
  },

  async updateProject(id, projectData) {
    return request(`/projects/${id}`, {
      method: 'PUT',
      body: projectData
    });
  },

  async deleteProject(id) {
    return request(`/projects/${id}`, {
      method: 'DELETE'
    });
  }
};

export default projectApi;
