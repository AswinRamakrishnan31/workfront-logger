import request from './apiClient';

export const dbAdminApi = {
  async getStorageStats() {
    return request('/db-admin/storage-stats');
  },

  async getBackups() {
    return request('/db-admin/backups');
  },

  async createBackup(label = 'manual') {
    return request('/db-admin/backups', {
      method: 'POST',
      body: { label }
    });
  },

  async restoreBackup(fileName) {
    return request('/db-admin/restore', {
      method: 'POST',
      body: { fileName }
    });
  },

  async getArchives() {
    return request('/db-admin/archives');
  },

  async archiveData(payload) {
    return request('/db-admin/archive', {
      method: 'POST',
      body: payload
    });
  }
};

export default dbAdminApi;
