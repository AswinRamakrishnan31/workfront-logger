import request from './apiClient';

export const capacityApi = {
  async getMonthlyCapacity(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/capacity/monthly?${query}` : '/capacity/monthly';
    return request(endpoint);
  }
};

export default capacityApi;
