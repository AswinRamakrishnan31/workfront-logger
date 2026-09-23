import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.count();
  const resources = await prisma.resource.count();
  const tasks = await prisma.task.count();
  console.log(`Current DB State: Projects=${projects}, Resources=${resources}, Tasks=${tasks}`);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
