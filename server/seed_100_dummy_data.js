import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lobs = ['Acquisition', 'Retention', 'Service Comms', 'Marketing', 'Loyalty', 'Upgrade Comms', 'Mobile Services'];
const priorities = ['Normal', 'High', 'Urgent', 'Low'];
const requestTypes = ['Delivery + Workflow', 'Email Template Only', 'Workflow Only', 'Transaction Messages', 'Custom Journey'];
const complexities = ['Simple - Updates', 'Medium - Updates', 'Complex - New Build', 'Services - Updates', 'Custom'];
const statuses = ['Completed', 'In Progress', 'Yet to Start', 'Under QA', 'Under Review'];
const audiences = ['HSD Broadband Audience', 'Non-HSD Audience', 'Xfinity Mobile Subscribers', 'Gigabit Upgrade Target', 'Video & TV Customers', 'Enterprise Business Accounts'];
const coes = ['COE East Region', 'COE West Region', 'Central Digital COE', 'Global Communications COE', 'Customer Experience COE'];
const requesters = ['Patrick Sullivan', 'Alexis Johnson', 'Dominic Sculti', 'Kate Tilghman', 'Jillian Sharp', 'Sarah Miller', 'David Ross', 'Emily Chen'];

const teamMembers = [
  // Email Developers
  { name: 'Subhasri M', role: 'Email Developer', team: 'Email Dev', email: 'subhasri.m@comcast.com' },
  { name: 'Samrajkumar K', role: 'Email Developer', team: 'Email Dev', email: 'samrajkumar.k@comcast.com' },
  { name: 'Jagadesh R', role: 'Email Developer', team: 'Email Dev', email: 'jagadesh.r@comcast.com' },
  { name: 'Aravind S', role: 'Email Developer', team: 'Email Dev', email: 'aravind.s@comcast.com' },

  // Email QA
  { name: 'Niranjana P', role: 'Email QA', team: 'Email QA', email: 'niranjana.p@comcast.com' },
  { name: 'Thiyagaraj V', role: 'Email QA', team: 'Email QA', email: 'thiyagaraj.v@comcast.com' },
  { name: 'Karthik N', role: 'Email QA', team: 'Email QA', email: 'karthik.n@comcast.com' },

  // Campaign Developers
  { name: 'Shankar G', role: 'Campaign Developer', team: 'Campaign Dev', email: 'shankar.g@comcast.com' },
  { name: 'Dharshan B', role: 'Campaign Developer', team: 'Campaign Dev', email: 'dharshan.b@comcast.com' },
  { name: 'Sivashankar T', role: 'Campaign Developer', team: 'Campaign Dev', email: 'sivashankar.t@comcast.com' },
  { name: 'Vignesh K', role: 'Campaign Developer', team: 'Campaign Dev', email: 'vignesh.k@comcast.com' },

  // Campaign QA
  { name: 'Suwetha M', role: 'Campaign QA', team: 'Campaign QA', email: 'suwetha.m@comcast.com' },
  { name: 'Ganesh R', role: 'Campaign QA', team: 'Campaign QA', email: 'ganesh.r@comcast.com' },
  { name: 'Pavithra S', role: 'Campaign QA', team: 'Campaign QA', email: 'pavithra.s@comcast.com' }
];

const projectTitles = [
  'Fall Acquisition Push Notification Journey',
  'Gigabit Speed Upgrade Email Campaign',
  'Xfinity Mobile Port-in Promo Push',
  'Cart Abandonment Recovery Flow v3',
  'Loyalty Shield Annual Renewal Notice',
  'Service Outage Notification Template Update',
  'Cybersecurity Shield Add-on Promo',
  'HSD Speed Tier Expansion Announcement',
  'Paperless Billing Incentive Campaign',
  'Student Broadband Discount Drive',
  'Seasonal Sports Package Upgrade',
  'Auto-Pay Discount Confirmation Email',
  'Streaming Bundle Promotional Journey',
  'Welcome Series for New HSD Subscribers',
  'Equipment Return Shipping Label Email',
  'Wi-Fi 6 Router Upgrade Offer',
  'Family Plan Discount Notification',
  'Self-Install Kit Tracking Update',
  'Customer Satisfaction Survey Follow-up',
  'Account Security Verification Alert'
];

async function generate100Projects() {
  console.log('Clearing old database records...');
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectHistory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.resource.deleteMany();
  console.log('Database cleared!');

  console.log('Creating team resources...');
  const resourcesCreated = [];
  for (const tm of teamMembers) {
    const res = await prisma.resource.create({
      data: {
        name: tm.name,
        email: tm.email,
        role: tm.role,
        team: tm.team,
        active: true,
        standardDailyCapacityHours: 7.5
      }
    });
    resourcesCreated.push(res);
  }

  const emailDevs = resourcesCreated.filter(r => r.role === 'Email Developer');
  const emailQAs = resourcesCreated.filter(r => r.role === 'Email QA');
  const campaignDevs = resourcesCreated.filter(r => r.role === 'Campaign Developer');
  const campaignQAs = resourcesCreated.filter(r => r.role === 'Campaign QA');

  console.log(`Resources created: ${resourcesCreated.length}`);
  console.log('Generating 100 projects with tasks & assignments...');

  const startDateBase = new Date('2026-08-01');

  for (let i = 1; i <= 100; i++) {
    const baseTitle = projectTitles[(i - 1) % projectTitles.length];
    const projectName = `WF_${String(i).padStart(3, '0')} - ${baseTitle} (Batch ${Math.ceil(i / 20)})`;
    const lob = lobs[i % lobs.length];
    const priority = priorities[i % priorities.length];
    const requestType = requestTypes[i % requestTypes.length];
    const taskComplexity = complexities[i % complexities.length];
    const status = statuses[i % statuses.length];
    const audience = audiences[i % audiences.length];
    const coe = coes[i % coes.length];
    const requester = requesters[i % requesters.length];

    // Dates
    const startDayOffset = (i * 2) % 45;
    const expectedStart = new Date(startDateBase.getTime() + startDayOffset * 86400000);
    const targetDeploy = new Date(expectedStart.getTime() + (5 + (i % 7)) * 86400000);
    const actualDeploy = status === 'Completed' ? new Date(targetDeploy.getTime() - (i % 2) * 86400000) : null;

    const project = await prisma.project.create({
      data: {
        workfrontProjectId: `WF-2026-${1000 + i}`,
        workfrontReferenceNumber: `REF-${20000 + i}`,
        projectName: projectName,
        description: `Automated campaign workflow for ${lob} targeting ${audience}.`,
        status: status,
        lob: lob,
        priority: priority,
        requestType: requestType,
        taskComplexity: taskComplexity,
        audience: audience,
        coe: coe,
        requesterName: requester,
        requesterEmail: `${requester.toLowerCase().replace(/\s+/g, '.')}@comcast.com`,
        expectedStartDate: expectedStart,
        targetDeploymentDate: targetDeploy,
        actualDeploymentDate: actualDeploy,
        remarks: `Workfront Project ID #${1000 + i} - Assigned to ${coe}`
      }
    });

    // Sub-tasks for each project
    const assignedEmailDev = emailDevs[i % emailDevs.length];
    const assignedEmailQA = emailQAs[i % emailQAs.length];
    const assignedCampDev = campaignDevs[i % campaignDevs.length];
    const assignedCampQA = campaignQAs[i % campaignQAs.length];

    const tasksData = [
      {
        name: 'Email Template Development',
        type: 'Email Dev',
        hours: parseFloat((2.5 + (i % 8) * 1.5).toFixed(2)),
        complexity: taskComplexity,
        status: status === 'Yet to Start' ? 'Yet to Start' : 'Completed',
        assignee: assignedEmailDev,
        role: 'Email Developer'
      },
      {
        name: 'Email Template Quality Assurance',
        type: 'Email QA',
        hours: parseFloat((1.0 + (i % 4) * 0.75).toFixed(2)),
        complexity: taskComplexity,
        status: status === 'Yet to Start' || status === 'In Progress' ? 'In Progress' : 'Completed',
        assignee: assignedEmailQA,
        role: 'Email QA'
      },
      {
        name: 'Campaign Journey Workflow Build',
        type: 'Campaign Dev',
        hours: parseFloat((3.0 + (i % 10) * 1.25).toFixed(2)),
        complexity: taskComplexity,
        status: status,
        assignee: assignedCampDev,
        role: 'Campaign Developer'
      },
      {
        name: 'Campaign End-to-End QA',
        type: 'Campaign QA',
        hours: parseFloat((1.5 + (i % 5) * 0.8).toFixed(2)),
        complexity: taskComplexity,
        status: status,
        assignee: assignedCampQA,
        role: 'Campaign QA'
      }
    ];

    for (const t of tasksData) {
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          taskName: `${projectName} - ${t.name}`,
          taskType: t.type,
          plannedHours: t.hours,
          actualHours: t.status === 'Completed' ? t.hours : parseFloat((t.hours * 0.7).toFixed(2)),
          complexity: t.complexity,
          status: t.status,
          plannedStartDate: expectedStart,
          plannedEndDate: targetDeploy
        }
      });

      if (t.assignee) {
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            resourceId: t.assignee.id,
            assignedRole: t.role,
            allocatedHours: t.hours,
            allocationStartDate: expectedStart,
            allocationEndDate: targetDeploy,
            assignmentStatus: 'Active'
          }
        });
      }
    }
  }

  console.log('\n========================================');
  console.log('✅ 100 DUMMY PROJECTS GENERATED SUCCESSFULLY!');
  console.log('========================================');
  const projectCount = await prisma.project.count();
  const taskCount = await prisma.task.count();
  const assignmentCount = await prisma.taskAssignment.count();
  const resourceCount = await prisma.resource.count();

  console.log(`Total Projects: ${projectCount}`);
  console.log(`Total Sub-tasks: ${taskCount}`);
  console.log(`Total Task Assignments: ${assignmentCount}`);
  console.log(`Total Team Resources: ${resourceCount}`);
}

generate100Projects()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
