import React, { useState, useEffect } from 'react';
import { ALL_RESOURCES, CAMPAIGN_OPS_RESOURCES, AUDIENCE_RESOURCES, COE_RESOURCES } from '../constants';
import { useDropdowns } from '../context/DropdownContext';
import './ScrumDashboard.css';

export default function ScrumDashboard({ projects = [] }) {
  const [selectedStructure, setSelectedStructure] = useState('All');
  const [selectedResource, setSelectedResource] = useState('All');
  const [slaChannels, setSlaChannels] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('wf_sla_channels');
    if (saved) {
      setSlaChannels(JSON.parse(saved));
    }
  }, []);

  const { allResources, campaignOpsResources, audienceResources, coeResources } = useDropdowns();

  // Determine which resources to show in the dropdown
  let resourceOptions = allResources?.length ? allResources : ALL_RESOURCES;
  if (selectedStructure === 'Audience') resourceOptions = audienceResources?.length ? audienceResources : AUDIENCE_RESOURCES;
  else if (selectedStructure === 'Campaign Ops') resourceOptions = campaignOpsResources?.length ? campaignOpsResources : CAMPAIGN_OPS_RESOURCES;
  else if (selectedStructure === 'CoE') resourceOptions = coeResources?.length ? coeResources : COE_RESOURCES;

  resourceOptions = ['All', ...resourceOptions];

  // Ensure selectedResource is valid for the new list
  useEffect(() => {
    if (!resourceOptions.includes(selectedResource)) {
      setSelectedResource('All');
    }
  }, [selectedStructure, resourceOptions, selectedResource]);

  // Get current and next month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonth = nextMonthDate.getMonth();
  const nextYear = nextMonthDate.getFullYear();

  const getDaysArray = (year, month) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // JS getDay(): 0 = Sun, 1 = Mon. Let's make Monday = 0 for standard European/business calendars
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

    const days = [];
    // Add empty slots for offset
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= numDays; i++) {
      // Format as YYYY-MM-DD
      const m = String(month + 1).padStart(2, '0');
      const d = String(i).padStart(2, '0');
      days.push(`${year}-${m}-${d}`);
    }
    return days;
  };

  const currentMonthDays = getDaysArray(currentYear, currentMonth);
  const nextMonthDays = getDaysArray(nextYear, nextMonth);

  const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const getDayStats = (dateStr) => {
    if (!dateStr || !selectedResource) return null;

    let D = 0, DE = 0, DW = 0;
    let A = 0, E = 0, W = 0;
    let totalHours = 0;

    const isAssignedToResource = (p) => {
      if (selectedResource === 'All') {
        if (selectedStructure === 'All') return true;
        const structureResources = resourceOptions.slice(1);
        return structureResources.some(res => 
          (p.emailDeveloper && p.emailDeveloper.includes(res)) ||
          (p.campaignBuilder && p.campaignBuilder.includes(res)) ||
          (p.emailQA && p.emailQA.includes(res)) ||
          (p.campaignQA && p.campaignQA.includes(res)) ||
          (p.audience && p.audience.includes(res)) ||
          (p.coe && p.coe.includes(res))
        );
      }
      return (
        (p.emailDeveloper && p.emailDeveloper.includes(selectedResource)) ||
        (p.campaignBuilder && p.campaignBuilder.includes(selectedResource)) ||
        (p.emailQA && p.emailQA.includes(selectedResource)) ||
        (p.campaignQA && p.campaignQA.includes(selectedResource)) ||
        (p.audience && p.audience.includes(selectedResource)) ||
        (p.coe && p.coe.includes(selectedResource))
      );
    };

    const dailyProjects = projects.filter(isAssignedToResource);
    if (dailyProjects.length === 0) return null;

    dailyProjects.forEach(p => {
      const emailCnt = (parseInt(p.emailCount) || 0) + (parseInt(p.numEmails) || 0);
      const workflowCnt = (parseInt(p.workflowCount) || 0) + (parseInt(p.numWorkflows) || 0) + (parseInt(p.numSms) || 0) + (parseInt(p.numInapp) || 0) + (parseInt(p.smsCount) || 0) + (parseInt(p.inAppCount) || 0);
      
      const expectedEnd = p.expectedEndDate || '';
      const expectedStart = p.expectedStartDate || '';
      const actualEnd = p.actualCompletionDate || '';

      // Deployment logic: ends on this day
      const isDeploymentDay = (expectedEnd === dateStr) || (actualEnd === dateStr);
      if (isDeploymentDay) {
        D += 1;
        DE += emailCnt;
        DW += workflowCnt;
      }

      // Active logic: dateStr is between start and end
      let isActiveDay = false;
      const status = p.status || '';
      const isStatusActive = !['Completed', 'Deferred', 'On-Hold', 'Cancelled'].includes(status);
      
      if (expectedStart && expectedEnd) {
        if (dateStr >= expectedStart && dateStr <= expectedEnd && isStatusActive) {
          isActiveDay = true;
        }
      } else if (expectedStart && dateStr === expectedStart && isStatusActive) {
        isActiveDay = true;
      }

      if (isActiveDay) {
        A += 1;
        E += emailCnt;
        W += workflowCnt;

        // Estimate hours for utilization
        let roleHours = 0;
        
        if (p.taskComplexity === 'Custom' && p.customHours) {
          roleHours = parseFloat(p.customHours) || 0;
        } else {
          let channel = null;
          const isCampaign = ['SMS', 'Push notification', 'Inapp notification'].includes(p.typeOfRequest) || p.typeOfCampaign === 'Service';
          if (isCampaign) {
            channel = slaChannels.find(ch => ch.name.toLowerCase().includes('campaign'));
          } else {
            channel = slaChannels.find(ch => ch.name.toLowerCase().includes('email'));
          }
          if (!channel && slaChannels.length > 0) channel = slaChannels[0];

          if (channel) {
            const row = channel.data.find(r => r.row === p.taskComplexity);
            if (row) {
              let assignedDevHours = parseFloat(row['Dev']) || 0;
              let assignedQaHours = parseFloat(row['QA']) || 0;
              
              if (selectedResource === 'All') {
                 const peopleToCheck = resourceOptions.slice(1);
                 peopleToCheck.forEach(res => {
                   if (p.emailDeveloper && p.emailDeveloper.includes(res)) roleHours += assignedDevHours;
                   if (p.campaignBuilder && p.campaignBuilder.includes(res)) roleHours += assignedDevHours; 
                   if (p.emailQA && p.emailQA.includes(res)) roleHours += assignedQaHours;
                   if (p.campaignQA && p.campaignQA.includes(res)) roleHours += assignedQaHours;
                 });
                 if (roleHours === 0 && (p.audience || p.coe)) roleHours += 1;
              } else {
                 if (p.emailDeveloper && p.emailDeveloper.includes(selectedResource)) roleHours += assignedDevHours;
                 if (p.campaignBuilder && p.campaignBuilder.includes(selectedResource)) roleHours += assignedDevHours; 
                 if (p.emailQA && p.emailQA.includes(selectedResource)) roleHours += assignedQaHours;
                 if (p.campaignQA && p.campaignQA.includes(selectedResource)) roleHours += assignedQaHours;
                 if (roleHours === 0) roleHours = 1;
              }
            } else {
              roleHours += 2;
            }
          } else {
            roleHours += 2;
          }
        }
        
        if (p.isCR && p.crCustomHours) {
          roleHours += (parseFloat(p.crCustomHours) || 0);
        }

        totalHours += roleHours;
      }
    });

    if (D === 0 && A === 0) return null; // No activity or deployments today

    const numPeople = selectedResource === 'All' ? (resourceOptions.length - 1) : 1;
    let colorClass = 'normal'; // green
    if (totalHours > 0) {
      if (totalHours < (5.4 * numPeople)) colorClass = 'low'; // yellow (< 80%)
      else if (totalHours <= (6.8 * numPeople)) colorClass = 'normal'; // green (80-100%)
      else if (totalHours <= (7.48 * numPeople)) colorClass = 'amber'; // amber (100-110%)
      else colorClass = 'high'; // red (>110%)
    }

    return { D, DE, DW, A, E, W, colorClass };
  };

  // Get active tasks for the selected resource
  const activeTasks = projects.filter(p => {
    let isAssigned = false;
    if (selectedResource === 'All') {
      if (selectedStructure === 'All') {
        isAssigned = true;
      } else {
        const structureResources = resourceOptions.slice(1);
        isAssigned = structureResources.some(res => 
          (p.emailDeveloper && p.emailDeveloper.includes(res)) ||
          (p.campaignBuilder && p.campaignBuilder.includes(res)) ||
          (p.emailQA && p.emailQA.includes(res)) ||
          (p.campaignQA && p.campaignQA.includes(res)) ||
          (p.audience && p.audience.includes(res)) ||
          (p.coe && p.coe.includes(res))
        );
      }
    } else {
      isAssigned = (
        (p.emailDeveloper && p.emailDeveloper.includes(selectedResource)) ||
        (p.campaignBuilder && p.campaignBuilder.includes(selectedResource)) ||
        (p.emailQA && p.emailQA.includes(selectedResource)) ||
        (p.campaignQA && p.campaignQA.includes(selectedResource)) ||
        (p.audience && p.audience.includes(selectedResource)) ||
        (p.coe && p.coe.includes(selectedResource))
      );
    }
    
    if (!isAssigned) return false;
    const completedStatuses = ['Completed', 'Deferred'];
    return !completedStatuses.includes(p.status);
  });

  const renderCalendar = (daysArray, monthName, year) => {
    return (
      <div className="calendar-wrapper glass-panel">
        <div className="calendar-header">
          {monthName} {year}
        </div>
        <div className="calendar-grid">
          <div className="weekday">Mon</div>
          <div className="weekday">Tue</div>
          <div className="weekday">Wed</div>
          <div className="weekday">Thu</div>
          <div className="weekday">Fri</div>
          <div className="weekday weekend">Sat</div>
          <div className="weekday weekend">Sun</div>
          
          {daysArray.map((dateStr, index) => {
            if (!dateStr) return <div key={`empty-${index}`} className="calendar-cell empty"></div>;
            
            const dayNum = parseInt(dateStr.split('-')[2], 10);
            const stats = getDayStats(dateStr);
            const isToday = dateStr === today.toISOString().split('T')[0];

            let cellClass = `calendar-cell ${isToday ? 'today-gold' : ''}`;
            if (stats) {
              cellClass += ` has-load util-${stats.colorClass}`;
            }

            return (
              <div key={dateStr} className={cellClass}>
                <div className="day-num">{dayNum}</div>
                {stats && (
                  <div className="day-stats" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    D {stats.D} | DE {stats.DE} | DW {stats.DW} | A {stats.A} | E {stats.E} | W {stats.W}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="scrum-dashboard animate-fade-in">
      
      <div className="scrum-title-area">
        <h2>PMO Scrum Call Dashboard</h2>
        <p className="scrum-subtitle">Select a resource to review active work while using the current-month calendar for deployment context.</p>
      </div>

      <div className="scrum-header glass-panel">
        <div className="filters-left">
          <div className="resource-filter">
            <label>STRUCTURE</label>
            <select 
              value={selectedStructure} 
              onChange={(e) => setSelectedStructure(e.target.value)}
              style={{ background: '#1e293b' }}
            >
              <option value="All">All</option>
              <option value="Audience">Audience</option>
              <option value="Campaign Ops">Campaign Ops</option>
              <option value="CoE">CoE</option>
            </select>
          </div>
          <div className="resource-filter">
            <label>RESOURCE</label>
            <select 
              value={selectedResource} 
              onChange={(e) => setSelectedResource(e.target.value)}
              style={{ background: '#1e293b' }}
            >
              {resourceOptions.map(res => (
                <option key={res} value={res}>{res}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="today-legend">
          TODAY = GOLD
        </div>
      </div>

      <div className="scrum-layout">
        
        <div className="scrum-calendars">
          {renderCalendar(currentMonthDays, monthNames[currentMonth], currentYear)}
          {renderCalendar(nextMonthDays, monthNames[nextMonth], nextYear)}
        </div>

        <div className="scrum-tasks glass-panel">
          <div className="tasks-header">
            <h3>ACTIVE TASKS FOR SELECTED RESOURCE</h3>
            <span className="task-count">{activeTasks.length}</span>
          </div>
          <div className="table-responsive">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Priority</th>
                  <th>Complexity</th>
                  <th>Expected End</th>
                  <th>Emails / Workflows</th>
                  <th>Current Status</th>
                  <th>Assigned People</th>
                  <th>WF Link</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active tasks for this resource.
                    </td>
                  </tr>
                ) : (
                  activeTasks.map(task => (
                    <tr key={task.id}>
                      <td className="task-name">{task.projectName} - {task.taskName}</td>
                      <td>{task.priority}</td>
                      <td>{task.taskComplexity}</td>
                      <td>{task.expectedStartDate}</td>
                      <td>{task.numEmails || 0} / {(parseInt(task.numWorkflows)||0) + (parseInt(task.numSms)||0) + (parseInt(task.numInapp)||0)}</td>
                      <td>{task.status}</td>
                      <td className="assigned-people">
                        {task.emailDeveloper && `Dev: ${task.emailDeveloper.split(' |')[0]}`} <br/>
                        {task.emailQA && `QA: ${task.emailQA.split(' |')[0]}`} <br/>
                        {task.campaignBuilder && `Camp: ${task.campaignBuilder.split(' |')[0]}`}
                      </td>
                      <td>
                        {task.wfUrl ? (
                          <a href={task.wfUrl} target="_blank" rel="noopener noreferrer" className="wf-link">Link</a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
