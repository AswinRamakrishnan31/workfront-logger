import prisma from '../utils/prisma.js';

export const dropdownService = {
  // Get all categories and options
  async getDropdowns() {
    const categories = await prisma.dropdownCategory.findMany({
      where: { active: true },
      include: {
        options: {
          where: { active: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    // Format as key-value object for easy frontend consumption
    const dropdownMap = {};
    categories.forEach(cat => {
      dropdownMap[cat.code] = cat.options.map(opt => opt.label);
    });

    return dropdownMap;
  },

  // Save/Update dropdown options for a category
  async updateCategoryOptions(code, labelList = []) {
    let category = await prisma.dropdownCategory.findUnique({ where: { code } });
    if (!category) {
      category = await prisma.dropdownCategory.create({
        data: {
          name: code,
          code
        }
      });
    }

    return prisma.$transaction(async (tx) => {
      // Soft-deactivate old options
      await tx.dropdownOption.updateMany({
        where: { categoryId: category.id },
        data: { active: false }
      });

      // Upsert new options
      for (let i = 0; i < labelList.length; i++) {
        const label = labelList[i];
        await tx.dropdownOption.create({
          data: {
            categoryId: category.id,
            label,
            value: label,
            displayOrder: i + 1,
            active: true
          }
        });
      }

      return { success: true, category: code, count: labelList.length };
    });
  }
};

export default dropdownService;
