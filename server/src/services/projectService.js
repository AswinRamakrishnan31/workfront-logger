import prisma from '../utils/prisma.js';
import logger from '../utils/logger.js';

function formatProjectForFrontend(p) {
  let emailDev = p.rawWorkfrontJson?.emailDeveloper || '';
  let emailQa = p.rawWorkfrontJson?.emailQA || '';
  let campDev = p.rawWorkfrontJson?.campaignBuilder || '';
  let campQa = p.rawWorkfrontJson?.campaignQA || '';

  if (p.tasks && Array.isArray(p.tasks)) {
    for (const task of p.tasks) {
      if (task.assignments && Array.isArray(task.assignments)) {
        for (const assign of task.assignments) {
          const name = assign.resource?.name;
          const role = assign.assignedRole;
          if (name) {
            if (role === 'Email Developer' || task.taskType === 'Email Dev') emailDev = name;
            else if (role === 'Email QA' || task.taskType === 'Email QA') emailQa = name;
            else if (role === 'Campaign Developer' || task.taskType === 'Campaign Dev') campDev = name;
            else if (role === 'Campaign QA' || task.taskType === 'Campaign QA') campQa = name;
          }
        }
      }
    }
  }

  const expStart = p.expectedStartDate ? new Date(p.expectedStartDate).toISOString().split('T')[0] : '';
  const expEnd = p.targetDeploymentDate
    ? new Date(p.targetDeploymentDate).toISOString().split('T')[0]
    : p.actualDeploymentDate
      ? new Date(p.actualDeploymentDate).toISOString().split('T')[0]
      : expStart;

  return {
    ...p,
    id: p.id,
    projectName: p.projectName,
    taskName: p.projectName,
    date: expStart || new Date().toISOString().split('T')[0],
    expectedStartDate: expStart,
    expectedEndDate: expEnd,
    status: p.status || 'Not Started',
    priority: p.priority || 'Normal',
    lob: p.lob || 'General',
    lineOfBusiness: p.lob || 'General',
    typeOfRequest: p.requestType || 'Delivery + Workflow',
    typeOfCampaign: p.requestType || 'Standard',
    campaignType: p.requestType || 'Standard',
    taskComplexity: p.taskComplexity || 'Medium - Updates',
    requesterName: p.requesterName || 'Patrick Sullivan',
    requestorName: p.requesterName || 'Patrick Sullivan',
    audience: p.audience || 'HSD Broadband Audience',
    coe: p.coe || 'Central Digital COE',
    wfUrl: p.remarks || '',
    emailDeveloper: emailDev,
    emailQA: emailQa,
    campaignBuilder: campDev,
    campaignQA: campQa,
    numEmails: 1,
    numWorkflows: 1,
    numSms: 0,
    numInapp: 0,
    emailCount: 1,
    workflowCount: 1,
    smsCount: 0,
    inAppCount: 0,
    isCR: false
  };
}

export const projectService = {
  // Get paginated and filtered projects
  async getProjects({ page = 1, pageSize = 50, status, lob, priority, search, month }) {
    const pageNum = parseInt(page, 10);
    const limit = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * limit;

    const where = { isDeleted: false };

    if (status) where.status = status;
    if (lob) where.lob = lob;
    if (priority) where.priority = priority;

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { workfrontProjectId: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (month) {
      // Filter by YYYY-MM
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      where.expectedStartDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const [totalRecords, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tasks: {
            include: {
              assignments: {
                include: { resource: true }
              }
            }
          }
        }
      })
    ]);

    const formattedProjects = projects.map(formatProjectForFrontend);

    return {
      data: formattedProjects,
      page: pageNum,
      pageSize: limit,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit)
    };
  },

  // Get single project by ID
  async getProjectById(id) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            assignments: {
              include: { resource: true }
            }
          }
        },
        history: {
          orderBy: { changedAt: 'desc' }
        }
      }
    });
  },

  // Create new project with audit trail
  async createProject(data, userEmail = 'system') {
    const { emailDeveloper, campaignBuilder, emailQA, campaignQA, audience, coe, ...projectFields } = data;

    // Standardize developer/builder fields into remarks/rawJson if complex or array
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          ...projectFields,
          audience: Array.isArray(audience) ? audience.join(', ') : audience,
          coe: Array.isArray(coe) ? coe.join(', ') : coe,
          createdBy: userEmail,
          rawWorkfrontJson: {
            emailDeveloper,
            campaignBuilder,
            emailQA,
            campaignQA
          }
        }
      });

      await tx.projectHistory.create({
        data: {
          projectId: created.id,
          fieldName: 'ALL',
          action: 'CREATE',
          newValue: created.projectName,
          changedBy: userEmail
        }
      });

      return created;
    });

    return result;
  },

  // Update existing project with optimistic concurrency control
  async updateProject(id, data, userEmail = 'system') {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new Error('Project not found');

    // Concurrency version check
    if (data.version !== undefined && existing.version !== data.version) {
      const conflictError = new Error('Record has been updated by another user');
      conflictError.name = 'ConflictError';
      throw conflictError;
    }

    const { emailDeveloper, campaignBuilder, emailQA, campaignQA, audience, coe, ...projectFields } = data;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: {
          ...projectFields,
          audience: Array.isArray(audience) ? audience.join(', ') : audience,
          coe: Array.isArray(coe) ? coe.join(', ') : coe,
          version: { increment: 1 },
          updatedBy: userEmail,
          rawWorkfrontJson: {
            emailDeveloper,
            campaignBuilder,
            emailQA,
            campaignQA
          }
        }
      });

      // Audit status or key field changes
      if (existing.status !== updated.status) {
        await tx.projectHistory.create({
          data: {
            projectId: id,
            fieldName: 'status',
            oldValue: existing.status,
            newValue: updated.status,
            action: 'STATUS_CHANGE',
            changedBy: userEmail
          }
        });
      }

      return updated;
    });
  },

  // Soft delete project
  async deleteProject(id, userEmail = 'system') {
    return prisma.project.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userEmail
      }
    });
  }
};

export default projectService;
