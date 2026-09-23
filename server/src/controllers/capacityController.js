import capacityService from '../services/capacityService.js';

export const capacityController = {
  async getMonthlyCapacity(req, res, next) {
    try {
      const data = await capacityService.getMonthlyCapacity(req.query);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
};

export default capacityController;
