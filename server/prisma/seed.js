import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with default configuration and initial resources...');

  // 1. Seed Dropdown Categories and Default Options
  const dropdownData = [
    {
      code: 'lob',
      name: 'Line of Business (LOB)',
      options: [
        'Acquisition', 'Early Life Comms', 'Engagement', 'Onboarding',
        'Retention', 'Service Comms - Account Management',
        'Service Comms - Loyalty & Retention', 'Service Comms - Product',
        'Service Comms - Reliability', 'Upgrade Comms'
      ]
    },
    {
      code: 'priority',
      name: 'Priority',
      options: ['None', 'Low', 'Normal', 'High', 'Urgent', 'Critical Business Impact']
    },
    {
      code: 'typeOfCampaign',
      name: 'Type of Campaign',
      options: ['Service', 'Marketing', 'Issue fixes']
    },
    {
      code: 'typeOfRequest',
      name: 'Type of Request',
      options: [
        'Delivery', 'Delivery + Campaign', 'Transaction message',
        'CMP Templates', 'SMS', 'Push notification', 'Inapp notification',
        'Workflow', 'Audience'
      ]
    },
    {
      code: 'taskComplexity',
      name: 'Task Complexity',
      options: [
        'Simple Updates', 'Simple Creation', 'Services Updates',
        'Medium Updates', 'Medium Creation', 'Complex Updates',
        'Complex Creation', 'Custom'
      ]
    },
    {
      code: 'status',
      name: 'Status',
      options: [
        'Yet to be assigned', 'Yet to Start', 'In-Developement', 'In-QA',
        'In-UAT', 'In-Pre-Depoyment-Checks', 'Scheduled', 'Deployed',
        'Pending from Requester', 'Pending for Approval', 'On-Hold', 'Cancelled'
      ]
    }
  ];

  for (const category of dropdownData) {
    const cat = await prisma.dropdownCategory.upsert({
      where: { code: category.code },
      update: { name: category.name },
      create: { code: category.code, name: category.name }
    });

    for (let i = 0; i < category.options.length; i++) {
      const opt = category.options[i];
      await prisma.dropdownOption.create({
        data: {
          categoryId: cat.id,
          label: opt,
          value: opt,
          displayOrder: i + 1,
          active: true
        }
      });
    }
  }

  // 2. Seed Initial Resources
  const teamMembers = [
    { name: 'Subhasri', role: 'Email Developer', team: 'Campaign' },
    { name: 'Mohanapriya', role: 'Email Developer', team: 'Campaign' },
    { name: 'Sudharsanan', role: 'Email Developer', team: 'Campaign' },
    { name: 'Jerrald', role: 'Email Developer', team: 'Campaign' },
    { name: 'Meshak', role: 'Email Developer', team: 'Campaign' },
    { name: 'Samrajkumar', role: 'Email Developer', team: 'Campaign' },
    { name: 'Indrajit', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Ambarish', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Shankar', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Gowsalya', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Dharshan', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Sivashankar', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Sathyaleka', role: 'Campaign Developer', team: 'Campaign' },
    { name: 'Jagadesh', role: 'Email QA', team: 'QA' },
    { name: 'Niranjana', role: 'Email QA', team: 'QA' },
    { name: 'Thiyagaraj', role: 'Campaign QA', team: 'QA' },
    { name: 'Suwetha', role: 'Campaign QA', team: 'QA' },
    { name: 'Nandha', role: 'Audience Specialist', team: 'Audience' },
    { name: 'Preeth', role: 'Audience Specialist', team: 'Audience' },
    { name: 'Sathya', role: 'COE Specialist', team: 'COE' },
    { name: 'Preetha', role: 'COE Specialist', team: 'COE' }
  ];

  for (const member of teamMembers) {
    const email = `${member.name.toLowerCase()}@company.com`;
    await prisma.resource.upsert({
      where: { email },
      update: { role: member.role, team: member.team },
      create: {
        name: member.name,
        email,
        role: member.role,
        team: member.team,
        standardDailyCapacityHours: 7.5
      }
    });
  }

  // 3. Seed Default Admin User
  await prisma.appUser.upsert({
    where: { email: 'admin@company.com' },
    update: { role: 'Admin' },
    create: {
      name: 'System Admin',
      email: 'admin@company.com',
      role: 'Admin',
      ssoProvider: 'AzureAD',
      department: 'MarTech Operations'
    }
  });

  // 4. Seed Default SLA Channels & Rules
  const channel = await prisma.slaChannel.upsert({
    where: { channelName: 'Email Delivery' },
    update: {},
    create: { channelName: 'Email Delivery' }
  });

  await prisma.slaRule.create({
    data: {
      channelId: channel.id,
      requestType: 'Delivery',
      complexity: 'Simple Updates',
      emailDevHours: 4,
      campaignDevHours: 2,
      emailQaHours: 2,
      campaignQaHours: 1,
      totalSlaHours: 9
    }
  });

  // 5. Seed Default Workfront Integration Config
  await prisma.integrationConfig.upsert({
    where: { name: 'Workfront Production API' },
    update: {},
    create: {
      name: 'Workfront Production API',
      provider: 'Workfront',
      baseUrl: 'https://company.my.workfront.com/attask/api/v15.0',
      syncEnabled: false,
      syncIntervalMin: 60
    }
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
