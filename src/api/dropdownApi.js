import request from './apiClient';

export const dropdownApi = {
  async getDropdowns() {
    return request('/dropdowns');
  },

  async updateCategoryOptions(category, options) {
    return request(`/dropdowns/${category}`, {
      method: 'POST',
      body: { options }
    });
  }
};

export default dropdownApi;
