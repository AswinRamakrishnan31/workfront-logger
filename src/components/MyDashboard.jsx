import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, UserCheck, Users, Building, CheckCircle2, Clock, 
  AlertTriangle, Filter, Search, ChevronLeft, ChevronRight, Layers, ArrowRight,
  Flame, Briefcase, Tag, RefreshCw, User, ShieldCheck, CheckSquare, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDropdowns, ROLE_LABELS } from '../context/DropdownContext';
import { TEAM_MEMBERS, ALL_RESOURCES } from '../constants';
import './MyDashboard.css';

export default function MyDashboard({ projects = [], onUpdateProject, leaves = [] }) {
  const { currentUser, login, userRoles } = useAuth();
  const { options } = useDropdowns();

  const teamMembersMap = options?.teamMembers || TEAM_MEMBERS;
  const currentUserName = currentUser?.name || 'System Admin';

  // Compute upcoming planned leaves for currentUser
  const userUpcomingLeaves = useMemo(() => {
    if (!currentUserName) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return (leaves || []).filter(l => {
      if (l.status === 'Cancelled') return false;
      if (l.memberName.toLowerCase() !== currentUserName.toLowerCase()) return false;
      const lEnd = l.endDate || l.startDate;
      return lEnd >= todayStr;
    });
  }, [leaves, currentUserName]);

  // Determine user sub-team / role key
  const userSubRoleKey = useMemo(() => {
    for (const [rKey, list] of Object.entries(teamMembersMap)) {
      if (list.includes(currentUserName)) return rKey;
    }
    return 'emailDeveloper'; // default fallback
  }, [teamMembersMap, currentUserName]);

  const userSubTeamList = teamMembersMap[userSubRoleKey] || [];

  // Hierarchy Scope State: 'myTasks' | 'subTeam' | 'entireTeam'
  const [scope, setScope] = useState(() => {
    if (currentUser?.role === 'Admin' || currentUser?.role === 'SPOC') {
      return 'entireTeam';
    }
    return 'myTasks';
  });

  // Calendar Date State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(null);

  // Calendar View Settings State
  const [showTaskTitles, setShowTaskTitles] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'inProgress' | 'pendingQA' | 'urgent' | 'completed' | 'all'

  // Outstanding Grouping Mode: 'day' | 'lob' | 'resource' | 'priority'
  const [outstandingGroupMode, setOutstandingGroupMode] = useState('day');

  // Filter projects by Hierarchy Scope
  const scopedProjects = useMemo(() => {
    return projects.filter(p => {
      // Exclude archived/staged items from main active dashboard grid
      if (p.status === 'Staged' || p.status === 'Pending Approval' || p.status === 'Staged (Auto-Assigned)' || p.status === 'Staging Archived') {
        return false;
      }

      if (scope === 'entireTeam') return true;

      const assignedNames = [
        p.emailDeveloper,
        p.campaignBuilder,
        p.emailQA,
        p.campaignQA,
        p.audience,
        p.coe
      ].filter(Boolean);

      if (scope === 'myTasks') {
        return assignedNames.some(name => 
          name === currentUserName || 
          name.includes(currentUserName) || 
          currentUserName.includes(name)
        );
      }

      if (scope === 'subTeam') {
        return assignedNames.some(name => userSubTeamList.includes(name));
      }

      return true;
    });
  }, [projects, scope, currentUserName, userSubTeamList]);

  // Filter scoped projects by Search, Status, and Day Selection
  const filteredProjects = useMemo(() => {
    return scopedProjects.filter(p => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.projectName || '').toLowerCase().includes(q);
        const matchesReq = (p.requesterName || p.requestorName || '').toLowerCase().includes(q);
        const matchesLOB = (p.lineOfBusiness || '').toLowerCase().includes(q);
        const matchesTask = (p.taskName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesReq && !matchesLOB && !matchesTask) return false;
      }

      // Selected Day from Calendar
      if (selectedDayDate) {
        const start = p.expectedStartDate;
        const end = p.expectedEndDate;
        const pDate = p.date;
        if (start !== selectedDayDate && end !== selectedDayDate && pDate !== selectedDayDate) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === 'active') {
        return p.status !== 'Completed' && p.status !== 'Cancelled' && p.status !== 'Deferred';
      }
      if (statusFilter === 'inProgress') {
        return p.status === 'In-Developement' || p.status === 'In-QA' || p.status === 'In-UAT' || p.status === 'In-Pre-Depoyment-Checks';
      }
      if (statusFilter === 'pendingQA') {
        return p.status === 'In-QA' || p.status === 'In-UAT';
      }
      if (statusFilter === 'urgent') {
        return p.priority === 'Urgent' || p.priority === 'Critical Business Impact' || p.isRush === true;
      }
      if (statusFilter === 'completed') {
        return p.status === 'Completed';
      }

      return true; // 'all'
    });
  }, [scopedProjects, searchQuery, selectedDayDate, statusFilter]);

  // Key KPI Stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalAssigned = scopedProjects.length;
    let activeCount = 0;
    let overdueCount = 0;
    let urgentCount = 0;
    let completedCount = 0;

    scopedProjects.forEach(p => {
      const isFinished = p.status === 'Completed' || p.status === 'Cancelled' || p.status === 'Deferred';
      if (isFinished) {
        if (p.status === 'Completed') completedCount++;
      } else {
        activeCount++;
        if (p.expectedEndDate && p.expectedEndDate < todayStr) overdueCount++;
        if (p.priority === 'Urgent' || p.priority === 'Critical Business Impact' || p.isRush) urgentCount++;
      }
    });

    return { totalAssigned, activeCount, overdueCount, urgentCount, completedCount };
  }, [scopedProjects]);

  // Outstanding / Unclosed Items Breakdown for PM & SPOCs
  const outstandingBuckets = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    const weekLaterDate = new Date(todayDate);
    weekLaterDate.setDate(weekLaterDate.getDate() + 7);
    const weekLaterStr = weekLaterDate.toISOString().split('T')[0];

    // Filter to unclosed projects only
    const openProjects = projects.filter(p => 
      p.status !== 'Completed' && 
      p.status !== 'Cancelled' && 
      p.status !== 'Deferred' &&
      p.status !== 'Staged' &&
      p.status !== 'Pending Approval' &&
      p.status !== 'Staging Archived'
    );

    const buckets = {};

    if (outstandingGroupMode === 'day') {
      buckets['🔴 Overdue Projects'] = openProjects.filter(p => p.expectedEndDate && p.expectedEndDate < todayStr);
      buckets['🟠 Due Today'] = openProjects.filter(p => p.expectedEndDate === todayStr);
      buckets['🟡 Due Tomorrow'] = openProjects.filter(p => p.expectedEndDate === tomorrowStr);
      buckets['🔵 Due Later This Week'] = openProjects.filter(p => p.expectedEndDate > tomorrowStr && p.expectedEndDate <= weekLaterStr);
      buckets['🟢 Future / On Schedule'] = openProjects.filter(p => !p.expectedEndDate || p.expectedEndDate > weekLaterStr);
    } else if (outstandingGroupMode === 'lob') {
      openProjects.forEach(p => {
        const lob = p.lineOfBusiness || 'Unassigned LOB';
        if (!buckets[lob]) buckets[lob] = [];
        buckets[lob].push(p);
      });
    } else if (outstandingGroupMode === 'resource') {
      openProjects.forEach(p => {
        const assigned = [p.emailDeveloper, p.campaignBuilder, p.emailQA, p.campaignQA, p.audience, p.coe].filter(Boolean);
        if (assigned.length === 0) {
          if (!buckets['Unassigned Projects']) buckets['Unassigned Projects'] = [];
          buckets['Unassigned Projects'].push(p);
        } else {
          assigned.forEach(name => {
            if (!buckets[name]) buckets[name] = [];
            if (!buckets[name].includes(p)) buckets[name].push(p);
          });
        }
      });
    } else if (outstandingGroupMode === 'priority') {
      openProjects.forEach(p => {
        const prio = p.priority || 'Normal';
        if (!buckets[prio]) buckets[prio] = [];
        buckets[prio].push(p);
      });
    }

    return buckets;
  }, [projects, outstandingGroupMode]);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum,
        isCurrentMonth: true
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentCalendarDate]);

  // Map tasks to dates for calendar pills
  const tasksByDateMap = useMemo(() => {
    const map = {};
    scopedProjects.forEach(p => {
      const startDate = p.expectedStartDate || p.date;
      const endDate = p.expectedEndDate || p.expectedStartDate || p.date;

      if (startDate) {
        if (!map[startDate]) map[startDate] = [];
        if (!map[startDate].includes(p)) map[startDate].push(p);
      }
      if (endDate && endDate !== startDate) {
        if (!map[endDate]) map[endDate] = [];
        if (!map[endDate].includes(p)) map[endDate].push(p);
      }
    });
    return map;
  }, [scopedProjects]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentCalendarDate(new Date());
    setSelectedDayDate(new Date().toISOString().split('T')[0]);
  };

  const handleQuickStatusUpdate = (project, newStatus) => {
    if (onUpdateProject) {
      onUpdateProject({ ...project, status: newStatus });
    }
  };

  const monthYearLabel = currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="my-dashboard-container animate-fade-in">
      
      {/* 1. HEADER BANNER & USER LOGIN SWITCHER */}
      <div className="dashboard-header-banner">
        <div className="dashboard-user-greeting">
          <div className="user-avatar-badge">
            {currentUserName.charAt(0)}
          </div>
          <div className="greeting-text">
            <h2>Welcome back, {currentUserName}! 👋</h2>
            <p>
              Sub-Role Pool: <strong style={{ color: '#818cf8' }}>{ROLE_LABELS[userSubRoleKey] || 'Operations'}</strong> • System Access: <strong style={{ color: '#38bdf8' }}>{currentUser?.role || 'Viewer'}</strong>
            </p>
          </div>
        </div>

        {/* HIERARCHY SCOPE TOGGLE BUTTONS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="scope-selector-bar">
            <button
              className={`scope-tab-btn ${scope === 'myTasks' ? 'active' : ''}`}
              onClick={() => { setScope('myTasks'); setSelectedDayDate(null); }}
              title="View tasks directly assigned to me"
            >
              <UserCheck size={16} /> My Assigned Tasks
            </button>
            <button
              className={`scope-tab-btn ${scope === 'subTeam' ? 'active' : ''}`}
              onClick={() => { setScope('subTeam'); setSelectedDayDate(null); }}
              title={`View tasks for my sub-team pool (${ROLE_LABELS[userSubRoleKey]})`}
            >
              <Users size={16} /> Sub-Team ({userSubTeamList.length})
            </button>
            <button
              className={`scope-tab-btn ${scope === 'entireTeam' ? 'active' : ''}`}
              onClick={() => { setScope('entireTeam'); setSelectedDayDate(null); }}
              title="View tasks across the entire organisation"
            >
              <Building size={16} /> Entire Organization
            </button>
          </div>

          {/* QUICK USER / ROLE LOGGING SWITCHER */}
          <div className="user-switch-box" title="Quickly switch logged-in user profile to view personalized dashboard">
            <User size={16} color="#818cf8" />
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Switch User:</span>
            <select
              value={currentUserName}
              onChange={(e) => login(e.target.value)}
              className="user-switch-select"
            >
              <optgroup label="System Roles">
                <option value="System Admin">System Admin (Admin)</option>
                <option value="SPOC Lead">SPOC Lead (SPOC)</option>
              </optgroup>
              <optgroup label="Team Members Directory">
                {ALL_RESOURCES.map(res => (
                  <option key={res} value={res}>{res} ({userRoles[res] || 'Campaign Ops'})</option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* PLANNED LEAVE INTIMATION BANNER */}
      {userUpcomingLeaves.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#e2e8f0',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.15)'
        }}>
          <span style={{ fontSize: '1.4rem' }}>🌴</span>
          <div>
            <strong style={{ color: '#c084fc', fontSize: '0.95rem' }}>Upcoming Planned Leave Intimation:</strong>
            <span style={{ fontSize: '0.88rem', marginLeft: '0.5rem', color: '#cbd5e1' }}>
              You have {userUpcomingLeaves.length} scheduled leave(s) coming up: {userUpcomingLeaves.map(l => `${l.leaveType} (${l.startDate}${l.endDate && l.endDate !== l.startDate ? ' to ' + l.endDate : ''})`).join(', ')}. Auto-assignment will automatically skip assigning new tasks to you during these dates.
            </span>
          </div>
        </div>
      )}

      {/* 2. STAT KPI SUMMARY CARDS */}
      <div className="stats-grid-4">
        <div className="stat-card-mini" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-info">
            <div className="stat-num">{stats.totalAssigned}</div>
            <div className="stat-lbl">Total Scoped Projects</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Briefcase size={22} />
          </div>
        </div>

        <div className="stat-card-mini" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div className="stat-info">
            <div className="stat-num">{stats.activeCount}</div>
            <div className="stat-lbl">Active In-Progress</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-mini" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-info">
            <div className="stat-num">{stats.overdueCount}</div>
            <div className="stat-lbl">Overdue / Delayed</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card-mini" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-info">
            <div className="stat-num">{stats.completedCount}</div>
            <div className="stat-lbl">Completed Projects</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* 3. CALENDAR VIEW OF ASSIGNED TASKS */}
      <div className="dashboard-calendar-card">
        <div className="calendar-header-bar">
          <div className="calendar-header-title">
            <CalendarIcon size={22} color="#818cf8" />
            <h3>Assigned Task Calendar ({scope === 'myTasks' ? 'My Schedule' : scope === 'subTeam' ? 'Sub-Team Schedule' : 'Organization Schedule'})</h3>
          </div>

          <div className="calendar-month-nav">
            <button
              className="btn-secondary"
              onClick={() => setShowTaskTitles(prev => !prev)}
              style={{
                padding: '0.45rem 0.75rem',
                fontSize: '0.78rem',
                background: showTaskTitles ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                borderColor: showTaskTitles ? '#818cf8' : '#334155',
                color: showTaskTitles ? '#ffffff' : '#94a3b8'
              }}
              title="Toggle between displaying full project titles or compact count badges"
            >
              {showTaskTitles ? '🏷️ Titles: Shown' : '🏷️ Titles: Hidden'}
            </button>

            <button className="btn-secondary" onClick={handlePrevMonth} style={{ padding: '0.45rem 0.75rem' }}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="calendar-month-display">{monthYearLabel}</span>
            <button className="btn-secondary" onClick={handleNextMonth} style={{ padding: '0.45rem 0.75rem' }}>
              Next <ChevronRight size={16} />
            </button>
            <button className="btn-secondary" onClick={handleTodayMonth} style={{ padding: '0.45rem 0.75rem', background: 'rgba(129, 140, 248, 0.2)', color: '#c7d2fe', border: '1px solid #6366f1' }}>
              Today
            </button>
            {selectedDayDate && (
              <button className="btn-text-sm" onClick={() => setSelectedDayDate(null)} style={{ color: '#ef4444' }}>
                Clear Day Filter ({selectedDayDate})
              </button>
            )}
          </div>
        </div>

        {/* WEEKDAY HEADERS */}
        <div className="calendar-grid-month" style={{ marginBottom: '6px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-weekday-header">{d}</div>
          ))}
        </div>

        {/* DAY CELLS GRID */}
        <div className="calendar-grid-month">
          {calendarDays.map((cell, idx) => {
            const dayTasks = tasksByDateMap[cell.dateStr] || [];
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDayDate;

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDayDate(cell.dateStr === selectedDayDate ? null : cell.dateStr)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                  <span className="day-number">{cell.dayNum}</span>
                  {dayTasks.length > 0 && (
                    <span style={{ fontSize: '0.7rem', background: '#334155', color: '#f8fafc', padding: '1px 5px', borderRadius: '10px', fontWeight: 700 }}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="day-tasks-container">
                  {showTaskTitles ? (
                    <>
                      {dayTasks.slice(0, 2).map((p, tIdx) => {
                        const isUrgent = p.priority === 'Urgent' || p.priority === 'Critical Business Impact';
                        const isCompleted = p.status === 'Completed';
                        const pillClass = isCompleted 
                          ? 'task-pill-done' 
                          : isUrgent 
                          ? 'task-pill-urgent' 
                          : (p.emailDeveloper === currentUserName ? 'task-pill-dev' : 'task-pill-qa');

                        return (
                          <span
                            key={tIdx}
                            className={`calendar-task-pill ${pillClass}`}
                            title={`Project: ${p.projectName}\nStatus: ${p.status || 'Active'}\nLOB: ${p.lineOfBusiness || 'N/A'}\nRequester: ${p.requesterName || p.requestorName || 'N/A'}`}
                          >
                            {p.projectName}
                          </span>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          +{dayTasks.length - 2} more
                        </span>
                      )}
                    </>
                  ) : (
                    dayTasks.length > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                        ● {dayTasks.length} task(s)
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN SPLIT: ASSIGNED PROJECTS GRID & PM OUTSTANDING PANEL */}
      <div className="dashboard-main-split">
        
        {/* LEFT / TOP: MY ASSIGNED PROJECTS GRID */}
        <div className="tasks-panel-card">
          <div className="tasks-panel-header">
            <div>
              <h3>Assigned Projects Grid ({filteredProjects.length})</h3>
              {selectedDayDate && (
                <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                  Showing tasks scheduled for: <strong>{selectedDayDate}</strong>
                </span>
              )}
            </div>

            {/* SEARCH & STATUS FILTER */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search project, LOB, requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '7px',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    width: '200px'
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '7px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                <option value="active">Active Projects</option>
                <option value="inProgress">In Progress</option>
                <option value="pendingQA">Pending QA</option>
                <option value="urgent">Urgent / Rush</option>
                <option value="completed">Completed</option>
                <option value="all">All Projects</option>
              </select>
            </div>
          </div>

          {/* PROJECT LIST CARDS */}
          {filteredProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', background: '#1e293b', borderRadius: '12px', border: '1px dashed #334155', color: '#94a3b8' }}>
              <CheckSquare size={32} color="#64748b" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No assigned projects found matching current filters.</p>
              <span style={{ fontSize: '0.8rem' }}>Try switching scope or clearing calendar day filter.</span>
            </div>
          ) : (
            <div className="project-cards-stack">
              {filteredProjects.map(p => {
                const isOverdue = p.expectedEndDate && p.expectedEndDate < todayStr && p.status !== 'Completed';
                const isUrgent = p.priority === 'Urgent' || p.priority === 'Critical Business Impact' || p.isRush;

                return (
                  <div key={p.id} className="dash-project-card" style={{ borderLeft: `4px solid ${isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : p.status === 'Completed' ? '#10b981' : '#6366f1'}` }}>
                    <div className="dash-project-card-top">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', background: '#334155', color: '#818cf8', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                            {p.id}
                          </span>
                          <h4 className="dash-project-title">{p.projectName}</h4>
                          {isUrgent && (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)', padding: '1px 6px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Flame size={12} /> Urgent
                            </span>
                          )}
                          {isOverdue && (
                            <span style={{ fontSize: '0.72rem', background: 'rgba(239,68,68,0.25)', color: '#ef4444', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="dash-project-meta" style={{ marginTop: '0.4rem' }}>
                          <span>LOB: <strong style={{ color: '#cbd5e1' }}>{p.lineOfBusiness || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>Campaign: <strong style={{ color: '#cbd5e1' }}>{p.typeOfCampaign || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>Requester: <strong style={{ color: '#cbd5e1' }}>{p.requesterName || p.requestorName || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>Target End: <strong style={{ color: isOverdue ? '#f87171' : '#cbd5e1' }}>{p.expectedEndDate || 'Not Set'}</strong></span>
                        </div>
                      </div>

                      {/* QUICK STATUS ACTIONS */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                        <select
                          value={p.status || 'Yet to Start'}
                          onChange={(e) => handleQuickStatusUpdate(p, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            background: '#0f172a',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            color: p.status === 'Completed' ? '#34d399' : '#818cf8',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Yet to Start">Yet to Start</option>
                          <option value="In-Developement">In-Developement</option>
                          <option value="In-QA">In-QA</option>
                          <option value="In-UAT">In-UAT</option>
                          <option value="Completed">Completed</option>
                          <option value="On-Hold">On-Hold</option>
                        </select>
                      </div>
                    </div>

                    {/* ASSIGNED ROLES ROW */}
                    <div className="dash-role-assigned-row">
                      {p.emailDeveloper && (
                        <span className={`role-tag-pill ${p.emailDeveloper === currentUserName ? 'my-assigned' : ''}`}>
                          Dev: {p.emailDeveloper}
                        </span>
                      )}
                      {p.campaignBuilder && (
                        <span className={`role-tag-pill ${p.campaignBuilder === currentUserName ? 'my-assigned' : ''}`}>
                          Workflow: {p.campaignBuilder}
                        </span>
                      )}
                      {p.emailQA && (
                        <span className={`role-tag-pill ${p.emailQA === currentUserName ? 'my-assigned' : ''}`}>
                          Email QA: {p.emailQA}
                        </span>
                      )}
                      {p.campaignQA && (
                        <span className={`role-tag-pill ${p.campaignQA === currentUserName ? 'my-assigned' : ''}`}>
                          Workflow QA: {p.campaignQA}
                        </span>
                      )}
                      {p.audience && (
                        <span className={`role-tag-pill ${p.audience === currentUserName ? 'my-assigned' : ''}`}>
                          Audience: {p.audience}
                        </span>
                      )}
                      {p.coe && (
                        <span className={`role-tag-pill ${p.coe === currentUserName ? 'my-assigned' : ''}`}>
                          CoE: {p.coe}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT / BOTTOM: PM & SPOC OUTSTANDING & PENDING ITEMS PANEL */}
        <div className="outstanding-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff' }}>Outstanding & Pending Items</h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>PM & SPOC Unclosed Project Control</span>
              </div>
            </div>

            {/* GROUPING SELECTOR */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className={`outstanding-group-btn ${outstandingGroupMode === 'day' ? 'active' : ''}`}
                onClick={() => setOutstandingGroupMode('day')}
              >
                By Day
              </button>
              <button
                className={`outstanding-group-btn ${outstandingGroupMode === 'lob' ? 'active' : ''}`}
                onClick={() => setOutstandingGroupMode('lob')}
              >
                By LOB
              </button>
              <button
                className={`outstanding-group-btn ${outstandingGroupMode === 'resource' ? 'active' : ''}`}
                onClick={() => setOutstandingGroupMode('resource')}
              >
                By Resource
              </button>
              <button
                className={`outstanding-group-btn ${outstandingGroupMode === 'priority' ? 'active' : ''}`}
                onClick={() => setOutstandingGroupMode('priority')}
              >
                By Priority
              </button>
            </div>
          </div>

          {/* BUCKETS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.3rem' }}>
            {Object.keys(outstandingBuckets).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                All tasks closed! No outstanding items.
              </div>
            ) : (
              Object.entries(outstandingBuckets).map(([bucketName, bucketProjects]) => {
                if (bucketProjects.length === 0) return null;

                return (
                  <div key={bucketName} className="outstanding-bucket-card">
                    <div className="bucket-header">
                      <span className="bucket-title">{bucketName}</span>
                      <span className="bucket-count-badge">{bucketProjects.length} Pending</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {bucketProjects.map(proj => (
                        <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: '#f8fafc' }}>{proj.projectName}</span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {proj.lineOfBusiness || 'LOB'} • Target: <strong style={{ color: '#cbd5e1' }}>{proj.expectedEndDate || 'N/A'}</strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.72rem', background: '#334155', color: '#818cf8', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
                              {proj.status || 'Draft'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
