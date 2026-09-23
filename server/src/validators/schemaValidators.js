import { z } from 'zod';

export const projectSchema = z.object({
  id: z.string().optional(),
  workfrontProjectId: z.string().optional().nullable(),
  workfrontReferenceNumber: z.string().optional().nullable(),
  projectName: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  status: z.string().default("Yet to Start"),
  lob: z.string().optional().nullable(),
  priority: z.string().default("Normal"),
  requestType: z.string().optional().nullable(),
  projectType: z.string().optional().nullable(),
  taskComplexity: z.string().optional().nullable(),
  expectedStartDate: z.string().optional().nullable(),
  targetDeploymentDate: z.string().optional().nullable(),
  actualDeploymentDate: z.string().optional().nullable(),
  deploymentChannel: z.string().optional().nullable(),
  audience: z.string().optional().nullable(),
  coe: z.string().optional().nullable(),
  requesterName: z.string().optional().nullable(),
  requesterEmail: z.string().email().optional().nullable().or(z.literal("")),
  remarks: z.string().optional().nullable(),
  emailDeveloper: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  campaignBuilder: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  emailQA: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  campaignQA: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  version: z.number().optional()
});

export const taskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  workfrontTaskId: z.string().optional().nullable(),
  taskName: z.string().min(1, "Task name is required"),
  taskType: z.string().optional().nullable(),
  taskCategory: z.string().optional().nullable(),
  status: z.string().default("Yet to Start"),
  priority: z.string().optional().nullable(),
  complexity: z.string().optional().nullable(),
  plannedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  plannedStartDate: z.string().optional().nullable(),
  plannedEndDate: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

export const assignmentSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  resourceId: z.string().min(1, "Resource ID is required"),
  assignedRole: z.string().min(1, "Assigned role is required"),
  allocatedHours: z.number().positive("Allocated hours must be positive"),
  allocationStartDate: z.string().optional().nullable(),
  allocationEndDate: z.string().optional().nullable(),
  assignmentStatus: z.string().default("Active")
});

export const resourceSchema = z.object({
  employeeId: z.string().optional().nullable(),
  name: z.string().min(1, "Resource name is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  team: z.string().optional().nullable(),
  role: z.string().min(1, "Role is required"),
  primarySkill: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  shift: z.string().optional().nullable(),
  active: z.boolean().default(true),
  standardDailyCapacityHours: z.number().default(7.5)
});
