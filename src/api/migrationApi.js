import request from './apiClient';

export const migrationApi = {
  async migrateLocalStorage(projects = []) {
    return request('/migration/local-storage', {
      method: 'POST',
      body: { projects }
    });
  }
};

export default migrationApi;
