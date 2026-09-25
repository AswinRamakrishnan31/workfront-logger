import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TEAM_MEMBERS } from '../constants';
import { useDropdowns } from '../context/DropdownContext';
import './CampaignOpsDashboard.css';

const formatDateToYYYYMMDD = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function CampaignOpsDashboard({ projects = [] }) {
  const today = formatDateToYYYYMMDD(new Date());
  
  const [period, setPeriod] = useState('This Month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getFilterDates = () => {
    let start = '';
    let end = '';
    const date = new Date();
    
    if (period === 'This Month') {
      start = formatDateToYYYYMMDD(new Date(date.getFullYear(), date.getMonth(), 1));
      end = formatDateToYYYYMMDD(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    } else if (period === 'Last Month') {
      start = formatDateToYYYYMMDD(new Date(date.getFullYear(), date.getMonth() - 1, 1));
      end = formatDateToYYYYMMDD(new Date(date.getFullYear(), date.getMonth(), 0));
    } else if (period === 'This Week') {
      const currentDay = date.getDay();
      const first = date.getDate() - currentDay;
      const dStart = new Date(date.getFullYear(), date.getMonth(), first);
      const dEnd = new Date(date.getFullYear(), date.getMonth(), first + 6);
      start = formatDateToYYYYMMDD(dStart);
      end = formatDateToYYYYMMDD(dEnd);
    } else if (period === 'Custom') {
      start = customStartDate;
      end = customEndDate;
    }
    
    return { start, end };
  };

  const { start: filterStart, end: filterEnd } = getFilterDates();

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (!filterStart || !filterEnd) return true;
      const launch = p.expectedLaunchDate;
      if (!launch) return false;
      return launch >= filterStart && launch <= filterEnd;
    });
  }, [projects, filterStart, filterEnd]);

  // --- New KPI Calculations ---
  const tasksInPeriod = filteredProjects.length;
  const deployingInPeriod = filteredProjects.filter(p => p.status !== 'Cancelled').length;
  const completedProjects = filteredProjects.filter(p => p.status === 'Completed').length;
  const pendingActual = filteredProjects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const inProgress = filteredProjects.filter(p => ['In Progress', 'In-Developement', 'In-QA', 'Active'].includes(p.status)).length;
  const pendingOnHold = filteredProjects.filter(p => ['Pending Approval', 'On-Hold', 'Pending from Requester'].includes(p.status)).length;
  const lateActuals = filteredProjects.filter(p => p.expectedLaunchDate < today && p.status !== 'Completed' && p.status !== 'Cancelled').length;

  let deployingNextDay = 0;
  if (filterEnd) {
    const nextDay = new Date(filterEnd);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    deployingNextDay = projects.filter(p => p.expectedLaunchDate === nextDayStr).length;
  }

  // --- Status Summary Table Data ---
  const statusesList = [
    'Yet to be assigned', 'Yet to Start', 'Pending from Requester', 'Pending Approval', 
    'On-Hold', 'In-Developement', 'In-QA', 'In-UAT', 'In-Pre-Depoyment-Checks', 
    'Scheduled', 'Completed', 'Differed', 'In Progress'
  ];

  const statusSummary = statusesList.map(status => {
    let row = { status, Req: 0, EDev: 0, CDev: 0, EQA: 0, UAT: 0, CQA: 0, Overall: 0 };
    filteredProjects.forEach(p => {
      if (p.status === status) {
        row.Overall += 1;
        row.Req += 1; 
        row.UAT += 1; 
        if (p.emailDeveloper && p.emailDeveloper.length > 0) row.EDev += 1;
        if (p.campaignBuilder && p.campaignBuilder.length > 0) row.CDev += 1;
        if (p.emailQA && p.emailQA.length > 0) row.EQA += 1;
        if (p.campaignQA && p.campaignQA.length > 0) row.CQA += 1;
      }
    });
    return row;
  });

  // --- Chart Data ---
  // Group by Type of Request
  const chartDataMap = {};
  filteredProjects.forEach(p => {
    const type = p.typeOfRequest || 'Uncategorized';
    if (!chartDataMap[type]) {
      chartDataMap[type] = { name: type, Active: 0, Completed: 0 };
    }
    if (p.status === 'Completed') {
      chartDataMap[type].Completed += 1;
    } else if (p.status !== 'Cancelled') {
      chartDataMap[type].Active += 1;
    }
  });
  const volumeChartData = Object.values(chartDataMap);

  // --- Resource Stats ---
  const getResourceStats = (teamArray, roleKey) => {
    return teamArray.map(name => {
      let active = 0;
      let completed = 0;
      
      filteredProjects.forEach(p => {
        const assigned = p[roleKey] || [];
        if (assigned.includes(name)) {
          if (p.status === 'Completed') completed += 1;
          else if (p.status !== 'Cancelled') active += 1;
        }
      });
      return { name, active, completed };
    });
  };

  const { options } = useDropdowns();
  const teamMembers = options?.teamMembers || TEAM_MEMBERS;

  const emailDevStats = getResourceStats(teamMembers.emailDeveloper || [], 'emailDeveloper');
  const campBuilderStats = getResourceStats(teamMembers.campaignBuilder || [], 'campaignBuilder');
  const emailQAStats = getResourceStats(teamMembers.emailQA || [], 'emailQA');
  const campQAStats = getResourceStats(teamMembers.campaignQA || [], 'campaignQA');

  const ResourceTable = ({ title, stats }) => (
    <div className="resource-table-card">
      <h3>{title}</h3>
      <table className="ops-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Active</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.active}</td>
              <td>{s.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="campaign-ops-dashboard animate-fade-in">
      {/* Date Filter Control Row */}
      <div className="date-filter-row">
        <div className="filter-group">
          <label>Dashboard Date</label>
          <div className="value-display">{today}</div>
        </div>
        <div className="filter-group">
          <label>PERIOD / CUSTOM</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Week">This Week</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Start Date</label>
          {period === 'Custom' ? (
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
          ) : (
            <div className="value-display">{filterStart}</div>
          )}
        </div>
        <div className="filter-group">
          <label>End Date</label>
          {period === 'Custom' ? (
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
          ) : (
            <div className="value-display">{filterEnd}</div>
          )}
        </div>
      </div>

      {/* KPI Row exactly like screenshot */}
      <div className="ops-kpi-row">
        <div className="ops-kpi-item">
          <label>Tasks in Period</label>
          <span>{tasksInPeriod}</span>
        </div>
        <div className="ops-kpi-item">
          <label>Deploying in Period</label>
          <span>{deployingInPeriod}</span>
        </div>
        <div className="ops-kpi-item">
          <label>Deploying Next Day</label>
          <span>{deployingNextDay}</span>
        </div>
        <div className="ops-kpi-item">
          <label>Pending Actual</label>
          <span>{pendingActual}</span>
        </div>
        <div className="ops-kpi-item">
          <label>Completed</label>
          <span>{completedProjects}</span>
        </div>
        <div className="ops-kpi-item">
          <label>In Progress / Active</label>
          <span>{inProgress}</span>
        </div>
        <div className="ops-kpi-item">
          <label>Pending / On-Hold</label>
          <span>{pendingOnHold}</span>
        </div>
        <div className="ops-kpi-item highlight-red">
          <label>Late Actuals</label>
          <span>{lateActuals}</span>
        </div>
      </div>

      {/* Status Summary Table */}
      <div className="status-summary-card">
        <h3>Status Summary by Stage</h3>
        <table className="ops-table summary-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Requirement</th>
              <th>Email Dev</th>
              <th>Campaign Dev</th>
              <th>Email QA</th>
              <th>UAT</th>
              <th>Campaign QA</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {statusSummary.map(row => (
              <tr key={row.status}>
                <td style={{fontWeight: 600}}>{row.status}</td>
                <td>{row.Req}</td>
                <td>{row.EDev}</td>
                <td>{row.CDev}</td>
                <td>{row.EQA}</td>
                <td>{row.UAT}</td>
                <td>{row.CQA}</td>
                <td style={{fontWeight: 'bold', color: '#60a5fa'}}>{row.Overall}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ops-layout">
        <div className="ops-main">
          
          <div className="chart-container">
            <h3>Campaigns by Request Type</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="Active" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="detailed-list-card">
            <h3>Detailed Campaign List</h3>
            <div className="table-wrapper">
              <table className="detailed-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Project Name</th>
                    <th>Type</th>
                    <th>Complexity</th>
                    <th>Start Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Assigned Resources</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p, idx) => {
                    const isCompleted = p.status === 'Completed';
                    const isCancelled = p.status === 'Cancelled';
                    
                    let rowClass = '';
                    if (isCompleted) {
                      rowClass = 'row-completed';
                    } else if (!isCancelled && p.expectedLaunchDate) {
                      if (p.expectedLaunchDate < today) {
                        rowClass = 'row-overdue';
                      } else if (p.expectedLaunchDate === today) {
                        rowClass = 'row-due-today';
                      }
                    }

                    let statusClass = 'active';
                    if (isCompleted) statusClass = 'completed';
                    if (isCancelled) statusClass = 'cancelled';
                    if (p.status === 'Scheduled') statusClass = 'scheduled';

                    // Aggregate all assigned resources into a string
                    const allResources = [
                      p.emailDeveloper,
                      p.campaignBuilder,
                      p.emailQA,
                      p.campaignQA,
                      p.audience,
                      p.coe
                    ].filter(Boolean).map(res => res.split(' |')[0]).join(', ');

                    return (
                      <tr key={p.id || idx} className={rowClass}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: '600' }}>{p.projectName}</td>
                        <td>{p.typeOfRequest}</td>
                        <td>{p.taskComplexity || '-'}</td>
                        <td>{p.expectedStartDate}</td>
                        <td>{p.expectedLaunchDate || 'TBD'}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {allResources || 'Unassigned'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        No projects logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div className="ops-sidebar">
          <ResourceTable title="Email Developers" stats={emailDevStats} />
          <ResourceTable title="Campaign Builders" stats={campBuilderStats} />
          <ResourceTable title="Email QA" stats={emailQAStats} />
          <ResourceTable title="Campaign QA" stats={campQAStats} />
        </div>
      </div>
    </div>
  );
}
