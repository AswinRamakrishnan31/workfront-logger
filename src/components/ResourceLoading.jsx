import React, { useState, useMemo } from 'react';
import { Users, ChevronDown, ChevronRight, Activity, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { TEAM_MEMBERS } from '../constants';
import { useDropdowns } from '../context/DropdownContext';
import './ResourceLoading.css';

// ─── Standard hours by complexity ─────────────────────────────────────────────
const COMPLEXITY_HOURS = {
  'Simple Updates':    2,
  'Simple - Updates':  2,
  'Simple Creation':   4,
  'Simple - Creation': 4,
  'Services Updates':  3,
  'Services - Updates':3,
  'Medium Updates':    6,
  'Medium - Updates':  6,
  'Medium Creation':   8,
  'Complex Updates':   12,
  'Complex - Updates': 12,
  'Complex Creation':  16,
  'Complex - New Build': 16,
  'Custom':            0, // handled separately
};

// Roles mapping: field key → display label
const ROLES = [
  { key: 'emailDeveloper',  label: 'Email Dev',     team: 'Email Dev' },
  { key: 'emailQA',         label: 'Email QA',       team: 'Email QA' },
  { key: 'campaignBuilder', label: 'Campaign Dev',   team: 'Campaign Dev' },
  { key: 'campaignQA',      label: 'Campaign QA',    team: 'Campaign QA' },
  { key: 'audience',        label: 'Audience',        team: 'Audience' },
  { key: 'coe',             label: 'CoE',             team: 'CoE' },
];

const EXCLUDED_STATUSES = ['Deferred', 'Cancelled'];

const STATUS_COLORS = {
  'Completed':                 { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'In-Developement':           { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
  'In-QA':                     { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  'In-UAT':                    { bg: 'rgba(139,92,246,0.15)', color: '#c4b5fd' },
  'In-Pre-Depoyment-Checks':   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Scheduled':                 { bg: 'rgba(20,184,166,0.15)', color: '#2dd4bf' },
  'Yet to Start':              { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  'Yet to be assigned':        { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  'On-Hold':                   { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
};

// ─── Hour computation helpers ──────────────────────────────────────────────────
function countAssignedRoles(project) {
  return ROLES.filter(r => {
    const val = project[r.key];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'string' && val.trim().length > 0;
  }).length || 1;
}

function getHoursForResource(project, resourceName, roleKey, assignedCount = 1) {
  const complexity = project.taskComplexity || '';
  const assignedRole = ROLES.find(r => r.key === roleKey) || ROLES.find(r => {
    const val = project[r.key] || '';
    if (Array.isArray(val)) return val.includes(resourceName);
    return typeof val === 'string' && val.includes(resourceName);
  });
  if (!assignedRole) return 0;

  const splitCount = Math.max(assignedCount, 1);

  if (complexity === 'Custom') {
    const teamHours = project.customTeamHours || {};
    if (teamHours[assignedRole.key] !== undefined && teamHours[assignedRole.key] !== '' && teamHours[assignedRole.key] !== null) {
      const roleHrs = parseFloat(teamHours[assignedRole.key]) || 0;
      return roleHrs / splitCount;
    }
    const total = parseFloat(project.customHours) || 8;
    return (total / countAssignedRoles(project)) / splitCount;
  }

  const normComp = (complexity || '').replace(/\s*-\s*/g, ' ').trim();
  const total = COMPLEXITY_HOURS[complexity] || COMPLEXITY_HOURS[normComp] || 4;
  return (total / countAssignedRoles(project)) / splitCount;
}

// Working days between two dates (Mon–Fri)
function workingDaysBetween(start, end) {
  let count = 0;
  const cur = new Date(start);
  const fin = new Date(end);
  while (cur <= fin) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(count, 1);
}

// Get ISO week string "YYYY-Www"
function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Generate list of week keys in a date range
function weeksInRange(startDate, endDate) {
  const weeks = [];
  const cur = new Date(startDate);
  // Go to Monday
  const day = cur.getDay();
  cur.setDate(cur.getDate() - (day === 0 ? 6 : day - 1));
  while (cur <= endDate) {
    weeks.push(getWeekKey(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return weeks;
}

// Distribute hours across weeks between project start/end
function distributeHoursToWeeks(hours, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return {};
  const totalDays = workingDaysBetween(start, end);
  const hrsPerDay = hours / totalDays;
  const weekMap = {};
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      const wk = getWeekKey(cur);
      weekMap[wk] = (weekMap[wk] || 0) + hrsPerDay;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return weekMap;
}

// ─── Build resource data matrix ────────────────────────────────────────────────
function buildResourceData(projects, rangeStart, rangeEnd, teamMembersMap = TEAM_MEMBERS) {
  const members = teamMembersMap || TEAM_MEMBERS;
  const allNames = Array.from(new Set(ROLES.flatMap(r =>
    members[r.key] || []
  ))).sort();

  const data = {};

  allNames.forEach(name => {
    const role = ROLES.find(r => (members[r.key] || []).includes(name));
    data[name] = {
      name,
      role: role ? role.label : '—',
      team: role ? role.team : '—',
      projects: [],
      totalAllocated: 0,
      totalCompleted: 0,
      weeklyHours: {},
      totalEmails: 0,
      totalWorkflows: 0,
      totalSms: 0,
      totalInApp: 0,
    };
  });

  projects.forEach(p => {
    if (EXCLUDED_STATUSES.includes(p.status)) return;

    const startStr = p.expectedStartDate || p.date || '';
    const endStr   = p.expectedEndDate   || p.expectedStartDate || p.date || '';
    if (!startStr) return;

    const pStart = new Date(startStr);
    const pEnd   = new Date(endStr);
    if (isNaN(pStart)) return;
    if (isNaN(pEnd) || pEnd < pStart) pEnd.setTime(pStart.getTime());

    // Filter to range
    if (rangeEnd && pStart > rangeEnd) return;
    if (rangeStart && pEnd < rangeStart) return;

    ROLES.forEach(roleInfo => {
      const val = p[roleInfo.key] || '';
      if (!val) return;

      // Extract all assigned resource names for this role (handles comma/pipe separated string or array)
      const rawNames = Array.isArray(val)
        ? val
        : typeof val === 'string'
        ? val.split(/[,|]/).map(s => s.trim().split(' |')[0]).filter(Boolean)
        : [];

      // Find all matching team members
      const assignedNames = Array.from(new Set(rawNames));

      assignedNames.forEach(matchedName => {
        if (!data[matchedName]) {
          data[matchedName] = {
            name: matchedName,
            role: roleInfo.label,
            team: roleInfo.team,
            projects: [],
            totalAllocated: 0,
            totalCompleted: 0,
            weeklyHours: {},
            totalEmails: 0,
            totalWorkflows: 0,
            totalSms: 0,
            totalInApp: 0,
          };
        }

        const hrs = getHoursForResource(p, matchedName, roleInfo.key, assignedNames.length);
        if (hrs <= 0) return;

        // Distribute to weeks
        const clampedStart = rangeStart && pStart < rangeStart ? rangeStart : pStart;
        const clampedEnd   = rangeEnd   && pEnd   > rangeEnd   ? rangeEnd   : pEnd;
        const weekMap = distributeHoursToWeeks(hrs, clampedStart, clampedEnd);

        Object.entries(weekMap).forEach(([wk, wkHrs]) => {
          data[matchedName].weeklyHours[wk] = (data[matchedName].weeklyHours[wk] || 0) + wkHrs;
        });

        data[matchedName].totalAllocated += hrs;
        if (p.status === 'Completed') {
          data[matchedName].totalCompleted += hrs;
        }

        // Accumulate asset counts — support both camelCase variants from form vs import
        const emails    = parseInt(p.numEmails    ?? p.emailCount    ?? 0, 10) || 0;
        const workflows = parseInt(p.numWorkflows ?? p.workflowCount ?? 0, 10) || 0;
        const sms       = parseInt(p.numSms       ?? p.smsCount      ?? 0, 10) || 0;
        const inApp     = parseInt(p.numInapp     ?? p.inAppCount    ?? 0, 10) || 0;
        data[matchedName].totalEmails    += emails;
        data[matchedName].totalWorkflows += workflows;
        data[matchedName].totalSms       += sms;
        data[matchedName].totalInApp     += inApp;

        data[matchedName].projects.push({
          id: p.id,
          name: p.projectName || '—',
          status: p.status || '—',
          complexity: p.taskComplexity || '—',
          hours: hrs,
          startDate: startStr,
          endDate: endStr,
          role: roleInfo.label,
          emails, workflows, sms, inApp,
        });
      });
    });
  });

  return data;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function ResourceLoading({ projects = [] }) {
  const { options } = useDropdowns();
  const currentTeamMembers = options?.teamMembers || TEAM_MEMBERS;

  const now = new Date();

  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const defaultEnd   = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const [rangeStart, setRangeStart] = useState(defaultStart.toISOString().split('T')[0]);
  const [rangeEnd,   setRangeEnd]   = useState(defaultEnd.toISOString().split('T')[0]);
  const [filterTeam, setFilterTeam] = useState('All');
  const [view, setView]             = useState('resource'); // 'resource' | 'week'
  const [expanded, setExpanded]     = useState({});
  const [weeklyView, setWeeklyView] = useState('week'); // 'week' | 'month'

  const rStart = rangeStart ? new Date(rangeStart) : null;
  const rEnd   = rangeEnd   ? new Date(rangeEnd)   : null;

  const resourceData = useMemo(() =>
    buildResourceData(projects, rStart, rEnd, currentTeamMembers),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [projects, rangeStart, rangeEnd, currentTeamMembers]);

  const allResources = useMemo(() => {
    let list = Object.values(resourceData);
    if (filterTeam !== 'All') {
      list = list.filter(r => r.team === filterTeam);
    }
    return list.sort((a, b) => b.totalAllocated - a.totalAllocated);
  }, [resourceData, filterTeam]);

  // Weeks list for heat-map
  const weeks = useMemo(() => {
    if (!rStart || !rEnd) return [];
    return weeksInRange(rStart, rEnd);
  }, [rangeStart, rangeEnd]);

  // KPI calculations
  const kpis = useMemo(() => {
    const loaded = allResources.filter(r => r.totalAllocated > 0);
    // 100% utilisation = 85% of 40h/week = 34h productive capacity
    const PRODUCTIVE_CAPACITY = 34;
    const overExpectation = loaded.filter(r => {
      const maxWeek = Math.max(...Object.values(r.weeklyHours), 0);
      return (maxWeek / PRODUCTIVE_CAPACITY) * 100 > 130;
    }).length;
    const managedMax = loaded.filter(r => {
      const maxWeek = Math.max(...Object.values(r.weeklyHours), 0);
      const pct = (maxWeek / PRODUCTIVE_CAPACITY) * 100;
      return pct > 100 && pct <= 130;
    }).length;
    const avgUtil = loaded.length
      ? Math.round(loaded.reduce((s, r) => {
          const maxWeek = Math.max(...Object.values(r.weeklyHours), 0);
          return s + (maxWeek / PRODUCTIVE_CAPACITY) * 100;
        }, 0) / loaded.length)
      : 0;
    const mostLoaded = loaded.length
      ? loaded.reduce((a, b) => a.totalAllocated > b.totalAllocated ? a : b, loaded[0])
      : null;
    return { loaded: loaded.length, overExpectation, managedMax, avgUtil, mostLoaded };
  }, [allResources, weeks]);

  // ── Helpers ──
  // Productive capacity = 85% of 40h week = 34h. That is the 100% benchmark.
  const PRODUCTIVE_CAPACITY = 34; // hours

  const utilBand = (pct) => {
    if (pct <= 50)              return { key: 'low',     label: 'Low',              color: '#64748b' };
    if (pct <= 79)              return { key: 'moderate', label: 'Moderate',         color: '#38bdf8' };
    if (pct <= 100)             return { key: 'ideal',    label: 'Ideal',            color: '#10b981' };
    if (pct <= 130)             return { key: 'managed',  label: 'Managed Max',      color: '#f59e0b' };
    /* pct > 130 */             return { key: 'over',     label: 'Over Expectation', color: '#ef4444' };
  };

  // Asset visibility rules per team
  // Email Dev & Email QA  → emails only
  // Campaign Dev & QA     → workflows only
  // Audience, CoE, others → all assets
  const getVisibleAssets = (team) => {
    if (team === 'Email Dev' || team === 'Email QA') {
      return { emails: true, workflows: false, sms: false, inApp: false };
    }
    if (team === 'Campaign Dev' || team === 'Campaign QA') {
      return { emails: false, workflows: true, sms: false, inApp: false };
    }
    // Audience, CoE, unknown → show all
    return { emails: true, workflows: true, sms: true, inApp: true };
  };

  const toggleExpand = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const formatWeekLabel = (wk) => {
    // wk = "2026-W39"
    const [year, week] = wk.split('-W');
    // Get the Monday of that ISO week
    const jan4 = new Date(+year, 0, 4);
    const startOfWeek = new Date(jan4.getTime() + ((parseInt(week, 10) - 1) * 7 - (jan4.getDay() || 7) + 1) * 86400000);
    return `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;
  };

  const statusStyle = (status) => STATUS_COLORS[status] || { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' };

  const teams = ['All', 'Email Dev', 'Email QA', 'Campaign Dev', 'Campaign QA', 'Audience', 'CoE'];

  return (
    <div className="glass-panel grid-panel animate-fade-in rl-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Resource Loading Sheet</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Hour-based utilisation by team member · {projects.length} projects loaded
          </p>
        </div>
        <div className="rl-view-toggle">
          <button className={`rl-toggle-btn ${view === 'resource' ? 'active' : ''}`} onClick={() => setView('resource')}>
            By Resource
          </button>
          <button className={`rl-toggle-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>
            Heat-map
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="rl-kpi-row">
        <div className="rl-kpi-card">
          <span className="rl-kpi-label">Resources Loaded</span>
          <span className="rl-kpi-value">{kpis.loaded}</span>
          <span className="rl-kpi-sub">out of {allResources.length} total</span>
        </div>
        <div className="rl-kpi-card">
          <span className="rl-kpi-label">Over Expectation (&gt;130%)</span>
          <span className="rl-kpi-value" style={{ color: kpis.overExpectation > 0 ? '#ef4444' : '#10b981' }}>{kpis.overExpectation}</span>
          <span className="rl-kpi-sub">peak week &gt; 44h (34h × 130%)</span>
        </div>
        <div className="rl-kpi-card">
          <span className="rl-kpi-label">Managed Max (101–130%)</span>
          <span className="rl-kpi-value" style={{ color: kpis.managedMax > 0 ? '#f59e0b' : '#10b981' }}>{kpis.managedMax}</span>
          <span className="rl-kpi-sub">peak week 35–44h</span>
        </div>
        <div className="rl-kpi-card">
          <span className="rl-kpi-label">Avg Peak Util.</span>
          <span className="rl-kpi-value" style={{ color: utilBand(kpis.avgUtil).color }}>{kpis.avgUtil}%</span>
          <span className="rl-kpi-sub">vs 34h productive capacity</span>
        </div>
        <div className="rl-kpi-card">
          <span className="rl-kpi-label">Most Loaded</span>
          <span className="rl-kpi-value" style={{ fontSize: '1.1rem', lineHeight: 1.4 }}>{kpis.mostLoaded ? kpis.mostLoaded.name : '—'}</span>
          <span className="rl-kpi-sub">{kpis.mostLoaded ? `${Math.round(kpis.mostLoaded.totalAllocated)} hrs allocated` : 'no data'}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rl-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 700, marginRight: '0.5rem' }}>
          <Activity size={18} /> Filters
        </div>
        <div className="rl-filter-group">
          <span className="rl-filter-label">Date Range Start</span>
          <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
        </div>
        <div className="rl-filter-group">
          <span className="rl-filter-label">Date Range End</span>
          <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
        </div>
        <div className="rl-filter-group">
          <span className="rl-filter-label">Team</span>
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="rl-legend">
            <div className="rl-legend-item"><div className="rl-legend-dot" style={{ background: '#64748b' }} /> Low ≤50%</div>
            <div className="rl-legend-item"><div className="rl-legend-dot" style={{ background: '#38bdf8' }} /> Moderate 51–79%</div>
            <div className="rl-legend-item"><div className="rl-legend-dot" style={{ background: '#10b981' }} /> Ideal 80–100%</div>
            <div className="rl-legend-item"><div className="rl-legend-dot" style={{ background: '#f59e0b' }} /> Managed Max 101–130%</div>
            <div className="rl-legend-item"><div className="rl-legend-dot" style={{ background: '#ef4444' }} /> Over Exp. &gt;130%</div>
          </div>
        </div>
      </div>

      {/* ── BY RESOURCE VIEW ── */}
      {view === 'resource' && (
        <div className="rl-table-wrapper">
          <table className="rl-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Resource</th>
                <th>Team / Role</th>
                <th>Projects</th>
                <th>Assets <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(✉ WF SMS 📱)</span></th>
                <th>Allocated Hrs</th>
                <th>Completed Hrs</th>
                <th>Peak Week Util. <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(vs 34h cap)</span></th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {allResources.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', color: '#475569', padding: '2rem' }}>
                    No resource data. Import projects to see loading.
                  </td>
                </tr>
              ) : allResources.map(r => {
                const peakWeekHrs = r.weeklyHours && Object.values(r.weeklyHours).length
                  ? Math.max(...Object.values(r.weeklyHours))
                  : 0;
                const pct = PRODUCTIVE_CAPACITY > 0 ? Math.round((peakWeekHrs / PRODUCTIVE_CAPACITY) * 100) : 0;
                const band = utilBand(pct);
                const isOpen = expanded[r.name];

                return (
                  <React.Fragment key={r.name}>
                    <tr className="rl-resource-row" onClick={() => toggleExpand(r.name)}>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {r.projects.length > 0
                          ? (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
                          : null}
                      </td>
                      <td>
                        <div className="rl-resource-name">
                          {r.name}
                        </div>
                      </td>
                      <td><span className="rl-role-badge">{r.role}</span></td>
                      <td>{r.projects.length}</td>
                      <td>
                        {(() => {
                          const vis = getVisibleAssets(r.team);
                          const hasAny = (vis.emails && r.totalEmails > 0) || (vis.workflows && r.totalWorkflows > 0) || (vis.sms && r.totalSms > 0) || (vis.inApp && r.totalInApp > 0);
                          return (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              {vis.emails && r.totalEmails > 0 && (
                                <span title="Emails" style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontWeight: 700 }}>
                                  ✉️ {r.totalEmails}
                                </span>
                              )}
                              {vis.workflows && r.totalWorkflows > 0 && (
                                <span title="Workflows" style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(20,184,166,0.15)', color: '#2dd4bf', fontWeight: 700 }}>
                                  ↻ {r.totalWorkflows}
                                </span>
                              )}
                              {vis.sms && r.totalSms > 0 && (
                                <span title="SMS" style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 700 }}>
                                  SMS {r.totalSms}
                                </span>
                              )}
                              {vis.inApp && r.totalInApp > 0 && (
                                <span title="In-App" style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', color: '#f87171', fontWeight: 700 }}>
                                  📱 {r.totalInApp}
                                </span>
                              )}
                              {!hasAny && <span style={{ color: '#475569', fontSize: '0.8rem' }}>—</span>}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ fontWeight: 700 }}>{Math.round(r.totalAllocated)} h</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{Math.round(r.totalCompleted)} h</td>
                      <td>
                        {r.totalAllocated > 0 ? (
                          <div className="rl-util-bar-wrap">
                            <div className="rl-util-bar">
                              <div
                                className="rl-util-fill"
                                style={{ width: `${Math.min(pct, 100)}%`, background: band.color }}
                              />
                            </div>
                            <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'right', color: band.color }}>{pct}%</span>
                          </div>
                        ) : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                      <td>
                        {r.totalAllocated > 0
                          ? <span className="rl-status-chip" style={{ background: `${band.color}22`, color: band.color }}>{band.label}</span>
                          : <span style={{ color: '#475569' }}>—</span>}
                      </td>
                    </tr>
                    {isOpen && r.projects.length > 0 && (
                      <tr className="rl-detail-row">
                        <td colSpan={9}>
                          <div className="rl-detail-inner">
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0 0.75rem', marginBottom: '0.25rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              <span>Project</span><span>Role</span><span>Hours</span><span>Assets</span><span>Date Range</span><span>Status</span>
                            </div>
                            {r.projects.map((p, i) => {
                              const sc = statusStyle(p.status);
                              const vis = getVisibleAssets(r.team);
                              const hasDetailAssets = (vis.emails && p.emails > 0) || (vis.workflows && p.workflows > 0) || (vis.sms && p.sms > 0) || (vis.inApp && p.inApp > 0);
                              return (
                                <div key={i} className="rl-project-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                                  <span className="rl-project-name" title={p.name}>{p.name}</span>
                                  <span style={{ color: '#a5b4fc', fontSize: '0.78rem' }}>{p.role}</span>
                                  <span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.hours.toFixed(1)} h</span>
                                  <span style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                    {vis.emails && p.emails > 0 && <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>✉️{p.emails}</span>}
                                    {vis.workflows && p.workflows > 0 && <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '8px', background: 'rgba(20,184,166,0.15)', color: '#2dd4bf' }}>↻{p.workflows}</span>}
                                    {vis.sms && p.sms > 0 && <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>S{p.sms}</span>}
                                    {vis.inApp && p.inApp > 0 && <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '8px', background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>📱{p.inApp}</span>}
                                    {!hasDetailAssets && <span style={{ color: '#475569' }}>—</span>}
                                  </span>
                                  <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                    {p.startDate ? p.startDate.slice(0, 10) : '—'} → {p.endDate ? p.endDate.slice(0, 10) : '—'}
                                  </span>
                                  <span className="rl-status-chip" style={{ background: sc.bg, color: sc.color }}>{p.status}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── HEAT-MAP VIEW ── */}
      {view === 'week' && (
        <div className="rl-heatmap-wrapper">
          <table className="rl-heatmap">
            <thead>
              <tr>
                <th className="resource-col">Resource / Team</th>
                {weeks.map(wk => (
                  <th key={wk} title={wk}>
                    W{wk.split('-W')[1]}<br />
                    <span style={{ fontWeight: 400, fontSize: '0.65rem', opacity: 0.7 }}>{formatWeekLabel(wk)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResources.length === 0 ? (
                <tr>
                  <td colSpan={weeks.length + 1} style={{ textAlign: 'center', color: '#475569', padding: '2rem' }}>
                    No data. Import projects to see heat-map.
                  </td>
                </tr>
              ) : allResources.map(r => (
                <tr key={r.name}>
                  <td className="resource-cell">
                    {r.name}
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>{r.role}</div>
                  </td>
                  {weeks.map(wk => {
                    const hrs = r.weeklyHours[wk] || 0;
                    const pct = PRODUCTIVE_CAPACITY > 0 ? Math.round((hrs / PRODUCTIVE_CAPACITY) * 100) : 0;
                    const band = hrs === 0 ? null : utilBand(pct);
                    const cellClass = band ? band.key : 'empty';
                    return (
                      <td key={wk}>
                        <div
                          className={`rl-heat-cell ${cellClass}`}
                          style={band ? { background: `${band.color}22`, color: band.color } : {}}
                          title={`${r.name} · ${wk} · ${hrs.toFixed(1)}h · ${pct}% (${band ? band.label : 'Empty'})`}
                        >
                          {hrs > 0 ? (
                            <>
                              <span className="hrs">{hrs.toFixed(1)}h</span>
                              <span className="pct">{pct}%</span>
                            </>
                          ) : <span style={{ fontSize: '0.75rem', opacity: 0.3 }}>—</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
