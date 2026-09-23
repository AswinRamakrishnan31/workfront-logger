import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function parseExcelDate(val) {
  if (!val || val === 'TBC' || val === 'N/A' || val === '-') return null;
  if (typeof val === 'number') {
    // Excel date epoch offset (25569 days between 1899-12-30 and 1970-01-01)
    const dateMs = Math.round((val - 25569) * 86400 * 1000);
    const date = new Date(dateMs);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function cleanResourceName(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;
  const name = rawName.split('|')[0].trim();
  return name.length > 0 ? name : null;
}

async function importData() {
  console.log('Reading Book112.xlsx...');
  const excelPath = path.resolve(__dirname, '../Book112.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${rows.length} records in ${sheetName}.`);

  let projectsCreated = 0;
  let tasksCreated = 0;
  let assignmentsCreated = 0;
  const resourceMap = new Map();

  // Pre-load existing resources or create unique set
  for (const row of rows) {
    const devName = cleanResourceName(row['Select the team member name'] || row['Email Developer 1\r\nA=Active']);
    const emailQaName = cleanResourceName(row['Email Template QA Person Name\r\nA=Active'] || row['Email QA 1\r\nA=Active']);
    const campaignDevName = cleanResourceName(row['Campaign Person Name\r\nA=Active'] || row['Workflow Developer 1\r\nA=Active'] || row['Select Campaign Builder']);
    const campaignQaName = cleanResourceName(row['Campaign QA Person Name\r\nA=Active'] || row['Workflow QA 1\r\nA=Active'] || row['Select Campaign QA']);

    const rolesMap = [
      { name: devName, role: 'Email Developer', team: 'Email' },
      { name: emailQaName, role: 'Email QA', team: 'Email' },
      { name: campaignDevName, role: 'Campaign Developer', team: 'Campaign' },
      { name: campaignQaName, role: 'Campaign QA', team: 'Campaign' }
    ];

    for (const item of rolesMap) {
      if (item.name && !resourceMap.has(item.name)) {
        // Upsert resource in database
        let resource = await prisma.resource.findFirst({
          where: { name: item.name }
        });

        if (!resource) {
          const email = `${item.name.toLowerCase().replace(/\s+/g, '.')}@comcast.com`;
          resource = await prisma.resource.create({
            data: {
              name: item.name,
              email: email,
              role: item.role,
              team: item.team,
              active: true
            }
          });
        }
        resourceMap.set(item.name, resource);
      }
    }
  }

  console.log(`Resource mapping prepared for ${resourceMap.size} unique team members.`);

  // Import Projects and Tasks
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];

    const ticketName = row['Workfront Ticket'] ? String(row['Workfront Ticket']).trim() : `Project #${idx + 1}`;
    const lob = row['Actual LOB'] || row['Line of Business'] || 'General';
    const priority = row['Priority'] || 'Normal';
    const requestType = row['Type Of Request'] || 'Standard';
    const taskComplexity = row['Task Complexity'] || 'Medium';
    const requesterName = row['Requester Name'] || null;
    const workfrontUrl = row['__EMPTY_5'] || null;

    const status = row['Over All Status'] || row['Status'] || row['Requirement Status'] || 'Completed';

    const expectedStartDate = parseExcelDate(row['Expected Start date'] || row['Planned  Start date']);
    const targetDeploymentDate = parseExcelDate(row['Planned Deployment Date'] || row['Planned  End Date'] || row['Expected End Date \\ Planned Completion date ']);
    const actualDeploymentDate = parseExcelDate(row['Actual Completion Date'] || row['Actual Deployment Date']);

    // Create Project
    const project = await prisma.project.create({
      data: {
        workfrontProjectId: `WF-${1000 + idx}`,
        projectName: ticketName,
        lob: String(lob),
        priority: String(priority),
        requestType: String(requestType),
        taskComplexity: String(taskComplexity),
        requesterName: requesterName ? String(requesterName) : null,
        status: String(status),
        expectedStartDate: expectedStartDate,
        targetDeploymentDate: targetDeploymentDate,
        actualDeploymentDate: actualDeploymentDate,
        remarks: workfrontUrl ? String(workfrontUrl) : null,
        rawWorkfrontJson: row
      }
    });

    projectsCreated++;

    // Create Sub-Tasks & Assignments
    const subTasks = [
      {
        name: 'Email Template Development',
        type: 'Email Dev',
        hours: parseFloat(row['Total Hours']) || 0,
        complexity: row['Complexity'] || taskComplexity,
        status: row['Status'] || status,
        assigneeName: cleanResourceName(row['Select the team member name'] || row['Email Developer 1\r\nA=Active']),
        role: 'Email Developer'
      },
      {
        name: 'Email Template QA',
        type: 'Email QA',
        hours: parseFloat(row['Total Hours_1']) || parseFloat(row['Email QA 1 Hours']) || 0,
        complexity: row['Complexity_1'] || taskComplexity,
        status: row['Status_1'] || status,
        assigneeName: cleanResourceName(row['Email Template QA Person Name\r\nA=Active'] || row['Email QA 1\r\nA=Active']),
        role: 'Email QA'
      },
      {
        name: 'Campaign Workflow Development',
        type: 'Campaign Dev',
        hours: parseFloat(row['Total Hours_2']) || 0,
        complexity: row['Complexity_2'] || taskComplexity,
        status: row['Status_2'] || status,
        assigneeName: cleanResourceName(row['Campaign Person Name\r\nA=Active'] || row['Workflow Developer 1\r\nA=Active'] || row['Select Campaign Builder']),
        role: 'Campaign Developer'
      },
      {
        name: 'Campaign Workflow QA',
        type: 'Campaign QA',
        hours: parseFloat(row['Total Hours_3']) || parseFloat(row['Workflow QA 1 Hours']) || 0,
        complexity: row['Complexity_3'] || taskComplexity,
        status: row['Status_3'] || status,
        assigneeName: cleanResourceName(row['Campaign QA Person Name\r\nA=Active'] || row['Workflow QA 1\r\nA=Active'] || row['Select Campaign QA']),
        role: 'Campaign QA'
      }
    ];

    for (const st of subTasks) {
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          taskName: `${ticketName} - ${st.name}`,
          taskType: st.type,
          plannedHours: st.hours,
          complexity: String(st.complexity),
          status: String(st.status || 'Completed'),
          plannedStartDate: expectedStartDate,
          plannedEndDate: targetDeploymentDate
        }
      });
      tasksCreated++;

      if (st.assigneeName && resourceMap.has(st.assigneeName)) {
        const res = resourceMap.get(st.assigneeName);
        await prisma.taskAssignment.create({
          data: {
            taskId: task.id,
            resourceId: res.id,
            assignedRole: st.role,
            allocatedHours: st.hours,
            allocationStartDate: expectedStartDate,
            allocationEndDate: targetDeploymentDate,
            assignmentStatus: 'Active'
          }
        });
        assignmentsCreated++;
      }
    }
  }

  console.log(`\nImport Completed Successfully!`);
  console.log(`- Projects Created: ${projectsCreated}`);
  console.log(`- Sub-Tasks Created: ${tasksCreated}`);
  console.log(`- Task Assignments Created: ${assignmentsCreated}`);
  console.log(`- Total Unique Team Resources: ${resourceMap.size}`);
}

importData()
  .catch((err) => {
    console.error('Import failed:', err);
  })
  .finally(() => prisma.$disconnect());
