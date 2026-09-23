import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Team Resources matching constants.js
const teamResources = [
  // Email Developers
  { name: 'Subhasri', role: 'Email Developer', team: 'Email Dev', email: 'subhasri@comcast.com' },
  { name: 'Samrajkumar', role: 'Email Developer', team: 'Email Dev', email: 'samrajkumar@comcast.com' },
  { name: 'Sudharsanan', role: 'Email Developer', team: 'Email Dev', email: 'sudharsanan@comcast.com' },
  { name: 'Mohanapriya', role: 'Email Developer', team: 'Email Dev', email: 'mohanapriya@comcast.com' },

  // Email QA Engineers
  { name: 'Jagadesh', role: 'Email QA', team: 'Email QA', email: 'jagadesh@comcast.com' },
  { name: 'Niranjana', role: 'Email QA', team: 'Email QA', email: 'niranjana@comcast.com' },

  // Campaign Developers
  { name: 'Shankar', role: 'Campaign Developer', team: 'Campaign Dev', email: 'shankar@comcast.com' },
  { name: 'Dharshan', role: 'Campaign Developer', team: 'Campaign Dev', email: 'dharshan@comcast.com' },
  { name: 'Sivashankar', role: 'Campaign Developer', team: 'Campaign Dev', email: 'sivashankar@comcast.com' },
  { name: 'Indrajit', role: 'Campaign Developer', team: 'Campaign Dev', email: 'indrajit@comcast.com' },

  // Campaign QA Engineers
  { name: 'Thiyagaraj', role: 'Campaign QA', team: 'Campaign QA', email: 'thiyagaraj@comcast.com' },
  { name: 'Suwetha', role: 'Campaign QA', team: 'Campaign QA', email: 'suwetha@comcast.com' },

  // Audience & COE
  { name: 'Nandha', role: 'Audience Specialist', team: 'Audience', email: 'nandha@comcast.com' },
  { name: 'Preeth', role: 'Audience Specialist', team: 'Audience', email: 'preeth@comcast.com' },
  { name: 'Sathya', role: 'COE Specialist', team: 'CoE', email: 'sathya@comcast.com' },
  { name: 'Preetha', role: 'COE Specialist', team: 'CoE', email: 'preetha@comcast.com' }
];

const testScenarios = [
  {
    code: 'TC01',
    projectName: 'WF_TC01 - Urgent Hotfix: Password Reset Email Body Cutoff',
    lob: 'Service Comms',
    priority: 'Urgent',
    requestType: 'Emergency Hotfix',
    complexity: 'Simple - Updates',
    status: 'Completed',
    audience: 'Nandha',
    coe: 'Sathya',
    requester: 'Alexis Johnson',
    startOffset: -5,
    endOffset: 2,
    emailDev: 'Subhasri',
    emailQa: 'Niranjana',
    campDev: 'Shankar',
    campQa: 'Suwetha',
    remarks: 'CRITICAL HOTFIX: Fixed mobile viewport CSS truncation issue.'
  },
  {
    code: 'TC02',
    projectName: 'WF_TC02 - Overdue: Fall Acquisition Gigabit Speed Booster Promo',
    lob: 'Acquisition',
    priority: 'High',
    requestType: 'Delivery + Workflow',
    complexity: 'Complex - New Build',
    status: 'In-Developement',
    audience: 'Preeth',
    coe: 'Preetha',
    requester: 'Patrick Sullivan',
    startOffset: -12,
    endOffset: -2,
    emailDev: 'Samrajkumar',
    emailQa: 'Jagadesh',
    campDev: 'Dharshan',
    campQa: 'Thiyagaraj',
    remarks: 'OVERDUE SCENARIO: Target deployment date passed. Waiting on legal team approval.'
  },
  {
    code: 'TC03',
    projectName: 'WF_TC03 - Active Build: Xfinity Mobile Port-In $200 Card Journey',
    lob: 'Mobile Services',
    priority: 'Normal',
    requestType: 'Delivery + Workflow',
    complexity: 'Medium - Updates',
    status: 'In-Developement',
    audience: 'Nandha',
    coe: 'Sathya',
    requester: 'Dominic Sculti',
    startOffset: -2,
    endOffset: 5,
    emailDev: 'Sudharsanan',
    emailQa: 'Niranjana',
    campDev: 'Sivashankar',
    campQa: 'Suwetha',
    remarks: 'ACTIVE BUILD: Active development sprint phase.'
  },
  {
    code: 'TC04',
    projectName: 'WF_TC04 - QA Phase: Cart Abandonment Nudge Journey 2.0',
    lob: 'Retention',
    priority: 'High',
    requestType: 'Custom Journey',
    complexity: 'Complex - New Build',
    status: 'In-QA',
    audience: 'Preeth',
    coe: 'Preetha',
    requester: 'Kate Tilghman',
    startOffset: -7,
    endOffset: 3,
    emailDev: 'Mohanapriya',
    emailQa: 'Jagadesh',
    campDev: 'Indrajit',
    campQa: 'Thiyagaraj',
    remarks: 'UNDER QA TEST CASE: Dev completed. Currently under end-to-end QA validation.'
  },
  {
    code: 'TC05',
    projectName: 'WF_TC05 - Blocked / On Hold: WiFi 6 Pod Hardware Exchange',
    lob: 'Service Comms',
    priority: 'Normal',
    requestType: 'Transaction Messages',
    complexity: 'Services - Updates',
    status: 'On-Hold',
    audience: 'Nandha',
    coe: 'Sathya',
    requester: 'Jillian Sharp',
    startOffset: -4,
    endOffset: 8,
    emailDev: 'Subhasri',
    emailQa: 'Niranjana',
    campDev: 'Shankar',
    campQa: 'Suwetha',
    remarks: 'ON HOLD TEST CASE: Paused due to supply chain hardware availability delay.'
  },
  {
    code: 'TC06',
    projectName: 'WF_TC06 - Low Priority: Annual Terms of Service Update Notice',
    lob: 'Legal & Regulatory',
    priority: 'Low',
    requestType: 'Email Template Only',
    complexity: 'Simple - Updates',
    status: 'Completed',
    audience: 'Preeth',
    coe: 'Preetha',
    requester: 'Sarah Miller',
    startOffset: -15,
    endOffset: -5,
    emailDev: 'Samrajkumar',
    emailQa: 'Jagadesh',
    campDev: 'Dharshan',
    campQa: 'Thiyagaraj',
    remarks: 'LOW PRIORITY TEST CASE: Annual batch compliance mailing completed.'
  },
  {
    code: 'TC07',
    projectName: 'WF_TC07 - High-Hour Custom: Multi-Language Hispanic Heritage Promo',
    lob: 'Marketing',
    priority: 'High',
    requestType: 'Delivery + Workflow',
    complexity: 'Custom',
    status: 'In-Developement',
    audience: 'Nandha',
    coe: 'Sathya',
    requester: 'Emily Chen',
    startOffset: -1,
    endOffset: 12,
    emailDev: 'Sudharsanan',
    emailQa: 'Niranjana',
    campDev: 'Sivashankar',
    campQa: 'Suwetha',
    remarks: 'CUSTOM HOURS TEST CASE: 25.5 hours allocated for English/Spanish dual templates.'
  },
  {
    code: 'TC08',
    projectName: 'WF_TC08 - Multi-Dev: Business Enterprise Fiber Upgrade Drive',
    lob: 'Business Enterprise',
    priority: 'Normal',
    requestType: 'Delivery + Workflow',
    complexity: 'Medium - Updates',
    status: 'In-QA',
    audience: 'Preeth',
    coe: 'Preetha',
    requester: 'David Ross',
    startOffset: -3,
    endOffset: 6,
    emailDev: 'Mohanapriya',
    emailQa: 'Jagadesh',
    campDev: 'Indrajit',
    campQa: 'Thiyagaraj',
    remarks: 'MULTI DEV TEST CASE: Enterprise fiber campaign with multi-system Integration.'
  },
  {
    code: 'TC09',
    projectName: 'WF_TC09 - Deploying Today: Streaming Bundle $10 Discount Journey',
    lob: 'Upgrade Comms',
    priority: 'Urgent',
    requestType: 'Delivery + Workflow',
    complexity: 'Medium - Updates',
    status: 'In-QA',
    audience: 'Nandha',
    coe: 'Sathya',
    requester: 'Patrick Sullivan',
    startOffset: -5,
    endOffset: 0, // Deploying today
    emailDev: 'Subhasri',
    emailQa: 'Niranjana',
    campDev: 'Shankar',
    campQa: 'Suwetha',
    remarks: 'DEPLOYING TODAY TEST CASE: Final signoff in progress for release tonight.'
  },
  {
    code: 'TC10',
    projectName: 'WF_TC10 - Upcoming: 2027 Winter Olympics Special Streaming Offer',
    lob: 'Marketing',
    priority: 'Normal',
    requestType: 'Delivery + Workflow',
    complexity: 'Complex - New Build',
    status: 'Yet to Start',
    audience: 'Preeth',
    coe: 'Preetha',
    requester: 'Alexis Johnson',
    startOffset: 2,
    endOffset: 18,
    emailDev: 'Samrajkumar',
    emailQa: 'Jagadesh',
    campDev: 'Dharshan',
    campQa: 'Thiyagaraj',
    remarks: 'FUTURE PLANNING TEST CASE: Upcoming campaign starting next week.'
  }
];

async function seedTestScenarios() {
  console.log('Clearing old database records...');
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectHistory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.resource.deleteMany();
  console.log('Database cleared!');

  console.log('Creating team resources...');
  const createdResourcesMap = new Map();
  for (const tr of teamResources) {
    const res = await prisma.resource.create({
      data: {
        name: tr.name,
        email: tr.email,
        role: tr.role,
        team: tr.team,
        active: true,
        standardDailyCapacityHours: 7.5
      }
    });
    createdResourcesMap.set(tr.name, res);
  }

  console.log('Creating 10 rich test projects with resource capacity & utilization...');
  const now = new Date();

  for (let idx = 0; idx < testScenarios.length; idx++) {
    const sc = testScenarios[idx];

    const expectedStart = new Date(now.getTime() + sc.startOffset * 86400000);
    const targetDeploy = new Date(now.getTime() + sc.endOffset * 86400000);
    const actualDeploy = sc.status === 'Completed' ? targetDeploy : null;

    const rawWorkfrontJson = {
      emailDeveloper: sc.emailDev,
      emailQA: sc.emailQa,
      campaignBuilder: sc.campDev,
      campaignQA: sc.campQa
    };

    const project = await prisma.project.create({
      data: {
        workfrontProjectId: `WF-TEST-${100 + idx + 1}`,
        workfrontReferenceNumber: `REF-CASE-${sc.code}`,
        projectName: sc.projectName,
        description: `Test Scenario ${sc.code}: Covers ${sc.status} status with ${sc.priority} priority and ${sc.complexity} complexity.`,
        status: sc.status,
        lob: sc.lob,
        priority: sc.priority,
        requestType: sc.requestType,
        taskComplexity: sc.complexity,
        audience: sc.audience,
        coe: sc.coe,
        requesterName: sc.requester,
        requesterEmail: `${sc.requester.toLowerCase().replace(/\s+/g, '.')}@comcast.com`,
        expectedStartDate: expectedStart,
        targetDeploymentDate: targetDeploy,
        actualDeploymentDate: actualDeploy,
        remarks: sc.remarks,
        rawWorkfrontJson: rawWorkfrontJson
      }
    });

    // Create sub-tasks and assignments
    const taskTypes = [
      { name: 'Email Template Build', type: 'Email Dev', assignee: sc.emailDev, role: 'Email Developer', hours: sc.complexity.includes('Complex') ? 12.0 : 4.0 },
      { name: 'Email Quality Assurance', type: 'Email QA', assignee: sc.emailQa, role: 'Email QA', hours: sc.complexity.includes('Complex') ? 3.5 : 1.5 },
      { name: 'Campaign Workflow Journey', type: 'Campaign Dev', assignee: sc.campDev, role: 'Campaign Developer', hours: sc.complexity.includes('Complex') ? 14.0 : 6.0 },
      { name: 'Campaign End-to-End QA', type: 'Campaign QA', assignee: sc.campQa, role: 'Campaign QA', hours: sc.complexity.includes('Complex') ? 4.0 : 2.0 }
    ];

    for (const tt of taskTypes) {
      if (sc.requestType.includes('Email') && tt.type.includes('Campaign')) continue;
      if (sc.requestType.includes('Workflow Only') && tt.type.includes('Email')) continue;

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          taskName: `${sc.projectName} - ${tt.name}`,
          taskType: tt.type,
          plannedHours: tt.hours,
          actualHours: sc.status === 'Completed' ? tt.hours : parseFloat((tt.hours * 0.6).toFixed(2)),
          complexity: sc.complexity,
          status: sc.status,
          plannedStartDate: expectedStart,
          plannedEndDate: targetDeploy
        }
      });

      if (tt.assignee && createdResourcesMap.has(tt.assignee)) {
        const res = createdResourcesMap.get(tt.assignee);
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            resourceId: res.id,
            assignedRole: tt.role,
            allocatedHours: tt.hours,
            allocationStartDate: expectedStart,
            allocationEndDate: targetDeploy,
            assignmentStatus: 'Active'
          }
        });
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ ALL TEST SCENARIOS WITH UTILIZATION & CAPACITY SEEDED!');
  console.log('======================================================');
  console.log(`- Projects Created: ${await prisma.project.count()}`);
  console.log(`- Tasks Created: ${await prisma.task.count()}`);
  console.log(`- Task Assignments Created: ${await prisma.taskAssignment.count()}`);
  console.log(`- Active Resources: ${await prisma.resource.count()}`);
}

seedTestScenarios()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
