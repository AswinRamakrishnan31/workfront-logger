import prisma from '../utils/prisma.js';

export const capacityService = {
  // Get monthly capacity calculation & summary across resources
  async getMonthlyCapacity({ year = new Date().getFullYear(), month = new Date().getMonth() + 1, team, role }) {
    const yr = parseInt(year, 10);
    const mth = parseInt(month, 10);

    const resourceWhere = { active: true };
    if (team) resourceWhere.team = team;
    if (role) resourceWhere.role = role;

    const resources = await prisma.resource.findMany({
      where: resourceWhere,
      include: {
        assignments: {
          include: { task: true }
        },
        capacities: {
          where: { year: yr, month: mth }
        }
      }
    });

    // Calculate working days in month (approx 21 default)
    const totalDaysInMonth = new Date(yr, mth, 0).getDate();
    let workingDays = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayOfWeek = new Date(yr, mth - 1, day).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++; // Mon-Fri
    }

    const report = resources.map(resource => {
      const capRecord = resource.capacities[0];
      const standardHoursPerDay = resource.standardDailyCapacityHours || 7.5;
      const grossAvailableHours = capRecord ? capRecord.availableHours : (workingDays * standardHoursPerDay);

      const leaveHours = capRecord ? capRecord.leaveHours : 0;
      const holidayHours = capRecord ? capRecord.holidayHours : 0;
      const nonProjectHours = capRecord ? (capRecord.trainingHours + capRecord.otherNonProjectHours) : 0;

      const netAvailableHours = capRecord ? capRecord.netAvailableHours : Math.max(0, grossAvailableHours - leaveHours - holidayHours - nonProjectHours);

      // Sum allocated hours from task assignments active in this month
      let allocatedHours = 0;
      resource.assignments.forEach(assign => {
        if (assign.assignmentStatus === 'Active') {
          allocatedHours += (assign.allocatedHours || 0);
        }
      });

      const remainingHours = Math.max(0, netAvailableHours - allocatedHours);
      const utilizationPct = netAvailableHours > 0 ? parseFloat(((allocatedHours / netAvailableHours) * 100).toFixed(2)) : 0;

      let status = 'Normal'; // 0-80%
      if (utilizationPct > 100) status = 'Overallocated';
      else if (utilizationPct >= 96) status = 'Near Capacity';
      else if (utilizationPct >= 81) status = 'High';

      return {
        resourceId: resource.id,
        employeeId: resource.employeeId,
        name: resource.name,
        email: resource.email,
        team: resource.team,
        role: resource.role,
        workingDays,
        grossAvailableHours,
        netAvailableHours,
        allocatedHours,
        remainingHours,
        utilizationPct,
        status,
        projectCount: new Set(resource.assignments.map(a => a.task.projectId)).size,
        taskCount: resource.assignments.length
      };
    });

    return report;
  }
};

export default capacityService;
