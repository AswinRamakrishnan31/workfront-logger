import dropdownService from '../services/dropdownService.js';

export const dropdownController = {
  async getDropdowns(req, res, next) {
    try {
      const data = await dropdownService.getDropdowns();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateCategoryOptions(req, res, next) {
    try {
      const { category } = req.params;
      const { options } = req.body; // array of string options
      const result = await dropdownService.updateCategoryOptions(category, options);
      return res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
};

export default dropdownController;
