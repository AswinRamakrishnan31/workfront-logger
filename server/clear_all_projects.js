import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllProjects() {
  console.log('Deleting all projects, tasks, task assignments, and project history...');

  const deletedAssignments = await prisma.taskAssignment.deleteMany();
  const deletedTasks = await prisma.task.deleteMany();
  const deletedProjectHistory = await prisma.projectHistory.deleteMany();
  const deletedProjects = await prisma.project.deleteMany();

  console.log('✅ ALL PROJECTS DELETED SUCCESSFULLY!');
  console.log(`- Task Assignments Removed: ${deletedAssignments.count}`);
  console.log(`- Sub-Tasks Removed: ${deletedTasks.count}`);
  console.log(`- Project History Records Removed: ${deletedProjectHistory.count}`);
  console.log(`- Projects Removed: ${deletedProjects.count}`);

  const remainingProjects = await prisma.project.count();
  console.log(`Current Projects in Database: ${remainingProjects}`);
}

clearAllProjects()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
