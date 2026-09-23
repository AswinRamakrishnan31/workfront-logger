import React, { useState, useMemo } from 'react';
import './DeploymentCalendar.css';
import { PRIORITY_OPTIONS, LOB_OPTIONS, TASK_COMPLEXITY_OPTIONS, TYPE_OF_CAMPAIGN_OPTIONS } from './ProjectForm';
import { ALL_RESOURCES } from '../constants';
import { useDropdowns } from '../context/DropdownContext';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper to format date like "18-Aug-2026"
const formatDateString = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day}-${monthNames[month]}-${year}`;
};

const DeploymentCalendar = ({ projects }) => {
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterLOB, setFilterLOB] = useState('All');
  const [filterActualLOB, setFilterActualLOB] = useState('All');
  const [filterComplexity, setFilterComplexity] = useState('All');
  const [filterRequester, setFilterRequester] = useState('All');

  const today = new Date();
  
  // Default: 3 past months, 1 current, 2 future
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0);

  const [dateRangeStart, setDateRangeStart] = useState(defaultStart.toISOString().split('T')[0]);
  const [dateRangeEnd, setDateRangeEnd] = useState(defaultEnd.toISOString().split('T')[0]);

  // Active or valid projects that have an end date
  const validProjects = useMemo(() => {
    // Only require expectedEndDate (ignore status so all deployments show)
    return projects.filter(p => p.expectedEndDate);
  }, [projects]);

  const { options, allResources } = useDropdowns();

  // Use the master options for filters instead of unique values from data
  const priorities = ['All', ...(options?.priorityOptions || PRIORITY_OPTIONS)];
  const lobs = ['All', ...(options?.campaignTypeOptions || TYPE_OF_CAMPAIGN_OPTIONS)]; // mapped to type of campaign per user request
  const actualLobs = ['All', ...(options?.lobOptions || LOB_OPTIONS)];
  const complexities = ['All', ...(options?.taskComplexityOptions || TASK_COMPLEXITY_OPTIONS)];
  const requesters = ['All', ...(allResources?.length ? allResources : ALL_RESOURCES)];

  // Filter projects
  const filteredProjects = useMemo(() => {
    return validProjects.filter(p => {
      if (filterPriority !== 'All' && p.priority !== filterPriority) return false;
      if (filterLOB !== 'All' && p.typeOfCampaign !== filterLOB) return false;
      if (filterActualLOB !== 'All' && p.lob !== filterActualLOB) return false; 
      if (filterComplexity !== 'All' && p.taskComplexity !== filterComplexity) return false;
      if (filterRequester !== 'All' && p.requesterName !== filterRequester) return false;
      
      // Date Range Filter
      if (dateRangeStart && p.expectedEndDate < dateRangeStart) return false;
      if (dateRangeEnd && p.expectedEndDate > dateRangeEnd) return false;
      
      return true;
    });
  }, [validProjects, filterPriority, filterLOB, filterActualLOB, filterComplexity, filterRequester, dateRangeStart, dateRangeEnd]);

  // Calculate Date Range and generate months
  const dateInfo = useMemo(() => {
    if (filteredProjects.length === 0) {
      const today = new Date();
      return {
        minStr: '', maxStr: '',
        months: [{ year: today.getFullYear(), month: today.getMonth() }]
      };
    }

    let min = null;
    let max = null;
    
    filteredProjects.forEach(p => {
      const dateStr = p.expectedEndDate;
      if (dateStr) {
        if (!min || dateStr < min) min = dateStr;
        if (!max || dateStr > max) max = dateStr;
      }
    });

    if (!min || !max) {
      const today = new Date();
      return {
        minStr: '', maxStr: '',
        months: [{ year: today.getFullYear(), month: today.getMonth() }]
      };
    }

    const minDate = new Date(min);
    const maxDate = new Date(max);
    
    // Generate array of {year, month} for all months between min and max
    const months = [];
    let curYear = minDate.getFullYear();
    let curMonth = minDate.getMonth();
    const endYear = maxDate.getFullYear();
    const endMonth = maxDate.getMonth();

    while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
      months.push({ year: curYear, month: curMonth });
      curMonth++;
      if (curMonth > 11) {
        curMonth = 0;
        curYear++;
      }
    }

    return { minStr: min, maxStr: max, months };
  }, [filteredProjects]);

  // Calculate day stats
  // Cache to prevent re-looping all projects per cell
  const dayStatsCache = useMemo(() => {
    const cache = {};
    filteredProjects.forEach(p => {
      const dateStr = p.expectedEndDate;
      if (!dateStr) return;
      if (!cache[dateStr]) {
        cache[dateStr] = { D: 0, E: 0, W: 0 };
      }
      cache[dateStr].D += 1;
      cache[dateStr].E += (parseInt(p.emailCount) || 0) + (parseInt(p.numEmails) || 0);
      cache[dateStr].W += (parseInt(p.workflowCount) || 0) + (parseInt(p.numWorkflows) || 0) + (parseInt(p.numSms) || 0) + (parseInt(p.numInapp) || 0) + (parseInt(p.smsCount) || 0) + (parseInt(p.inAppCount) || 0);
    });
    return cache;
  }, [filteredProjects]);

  // Peak Day
  const peakDay = useMemo(() => {
    let maxD = 0;
    let maxDate = '';
    Object.keys(dayStatsCache).forEach(date => {
      if (dayStatsCache[date].D > maxD) {
        maxD = dayStatsCache[date].D;
        maxDate = date;
      }
    });
    return maxD > 0 ? `${formatDateString(maxDate)} • ${maxD}` : 'None';
  }, [dayStatsCache]);

  const renderMonth = (year, monthIndex) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    // 0 is Sunday, 1 is Monday ... 6 is Saturday
    let startDayOfWeek = firstDay.getDay(); 
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Convert to Mon=1 ... Sun=7

    const cells = [];
    // Empty cells before start day
    for (let i = 1; i < startDayOfWeek; i++) {
      cells.push({ type: 'empty', key: `empty-start-${i}` });
    }
    
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const stats = dayStatsCache[dateStr] || { D: 0, E: 0, W: 0 };
      cells.push({ type: 'day', dayNum: d, dateStr, stats, key: dateStr });
    }

    // Determine color class for capacity
    const getCapClass = (D) => {
      if (D === 0) return '';
      if (D <= 5) return 'cap-green';
      if (D <= 7) return 'cap-orange';
      return 'cap-red';
    };

    const isWeekend = (idx) => {
      // 5 = Saturday, 6 = Sunday in 0-indexed grid week
      const mod = idx % 7;
      return mod === 5 || mod === 6;
    };

    return (
      <div className="dc-month-container" key={`${year}-${monthIndex}`}>
        <div className="dc-month-header">
          {monthNames[monthIndex]}-{String(year).substring(2)}
        </div>
        <div className="dc-days-header">
          <div className="dc-day-name">Mon</div>
          <div className="dc-day-name">Tue</div>
          <div className="dc-day-name">Wed</div>
          <div className="dc-day-name">Thu</div>
          <div className="dc-day-name">Fri</div>
          <div className="dc-day-name weekend">Sat</div>
          <div className="dc-day-name weekend">Sun</div>
        </div>
        <div className="dc-days-grid">
          {cells.map((cell, idx) => {
            if (cell.type === 'empty') return <div key={cell.key} className="dc-day-cell empty"></div>;
            
            const weekendClass = isWeekend(idx) ? 'weekend' : '';
            const capClass = getCapClass(cell.stats.D);

            return (
              <div key={cell.key} className={`dc-day-cell ${capClass}`}>
                <div className={`dc-day-number ${weekendClass}`}>{cell.dayNum}</div>
                {cell.stats.D > 0 && (
                  <div className="dc-day-stats">
                    D{cell.stats.D} | E{cell.stats.E} | W{cell.stats.W}
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
    <div className="deployment-calendar-module animate-fade-in">
      <h2>Deployment Calendar</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
        Daily deployment counts from WIP Sheet • live calendar view
      </p>

      {/* Top Stats Banner */}
      <div className="dc-header-stats">
        <div className="dc-stat-box" style={{ flex: 0.5 }}>
          <div className="dc-stat-header gold">TODAY = GOLD</div>
        </div>
        <div className="dc-stat-box">
          <div className="dc-stat-header">TOTAL SCHEDULED</div>
          <div className="dc-stat-value">{filteredProjects.length}</div>
        </div>
        <div className="dc-stat-box">
          <div className="dc-stat-header">PEAK DAY</div>
          <div className="dc-stat-value">{peakDay}</div>
        </div>
        <div className="dc-stat-box" style={{ flex: 1.5 }}>
          <div className="dc-stat-header">CAPACITY RULE</div>
          <div className="dc-stat-value" style={{ fontSize: '0.9rem' }}>
            ≤5 <span style={{color: '#10b981'}}>Green</span> | 6-7 <span style={{color: '#f59e0b'}}>Orange</span> | &gt;7 <span style={{color: '#ef4444'}}>Red</span>
          </div>
        </div>
        <div className="dc-stat-box" style={{ flex: 1.5 }}>
          <div className="dc-stat-header">DATE RANGE</div>
          <div className="dc-stat-value" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
            <input type="date" value={dateRangeStart} onChange={e => setDateRangeStart(e.target.value)} style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.2rem', borderRadius: '4px', fontSize: '0.8rem' }} />
            <span>to</span>
            <input type="date" value={dateRangeEnd} onChange={e => setDateRangeEnd(e.target.value)} style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.2rem', borderRadius: '4px', fontSize: '0.8rem' }} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="dc-filter-bar">
        <div className="dc-filter-group">
          <div className="dc-filter-label">PRIORITY</div>
          <select className="dc-filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="dc-filter-group">
          <div className="dc-filter-label">LINE OF BUSINESS</div>
          <select className="dc-filter-select" value={filterLOB} onChange={e => setFilterLOB(e.target.value)}>
            {lobs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="dc-filter-group">
          <div className="dc-filter-label">ACTUAL LOB</div>
          <select className="dc-filter-select" value={filterActualLOB} onChange={e => setFilterActualLOB(e.target.value)}>
            {actualLobs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="dc-filter-group">
          <div className="dc-filter-label">TASK COMPLEXITY</div>
          <select className="dc-filter-select" value={filterComplexity} onChange={e => setFilterComplexity(e.target.value)}>
            {complexities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="dc-filter-group">
          <div className="dc-filter-label">REQUESTER NAME</div>
          <select className="dc-filter-select" value={filterRequester} onChange={e => setFilterRequester(e.target.value)}>
            {requesters.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Multi-month grid */}
      <div className="dc-calendars-grid">
        {dateInfo.months.map(m => renderMonth(m.year, m.month))}
      </div>

    </div>
  );
};

export default DeploymentCalendar;
