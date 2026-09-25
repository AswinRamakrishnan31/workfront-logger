import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ALL_RESOURCES } from '../constants';
import './LeaveManagement.css';

export const DEFAULT_PUBLIC_HOLIDAYS = [
  { id: 'ph-1', title: 'New Year\'s Day', date: '2026-01-01', day: 'Thursday', type: 'Public' },
  { id: 'ph-2', title: 'Republic Day', date: '2026-01-26', day: 'Monday', type: 'Public' },
  { id: 'ph-3', title: 'May Day / Labor Day', date: '2026-05-01', day: 'Friday', type: 'Public' },
  { id: 'ph-4', title: 'Independence Day', date: '2026-08-15', day: 'Saturday', type: 'Public' },
  { id: 'ph-5', title: 'Gandhi Jayanti', date: '2026-10-02', day: 'Friday', type: 'Public' },
  { id: 'ph-6', title: 'Diwali / Deepavali', date: '2026-11-08', day: 'Sunday', type: 'Public' },
  { id: 'ph-7', title: 'Christmas Day', date: '2026-12-25', day: 'Friday', type: 'Public' }
];

export const DEFAULT_OPTIONAL_HOLIDAYS = [
  { id: 'oh-1', title: 'Pongal / Makar Sankranti', date: '2026-01-14', day: 'Wednesday', type: 'Optional' },
  { id: 'oh-2', title: 'Good Friday', date: '2026-04-03', day: 'Friday', type: 'Optional' },
  { id: 'oh-3', title: 'Ugadi / Gudi Padwa', date: '2026-03-19', day: 'Thursday', type: 'Optional' },
  { id: 'oh-4', title: 'Eid-ul-Fitr', date: '2026-03-20', day: 'Friday', type: 'Optional' },
  { id: 'oh-5', title: 'Onam', date: '2026-08-26', day: 'Wednesday', type: 'Optional' },
  { id: 'oh-6', title: 'Dussehra / Vijayadashami', date: '2026-10-20', day: 'Tuesday', type: 'Optional' }
];

export const DEFAULT_LEAVE_RECORDS = [
  {
    id: 'lv-1',
    memberName: 'Subhasri',
    leaveType: 'Casual Leave',
    startDate: '2026-09-28',
    endDate: '2026-09-29',
    reason: 'Personal family event',
    status: 'Approved',
    appliedBy: 'Subhasri'
  },
  {
    id: 'lv-2',
    memberName: 'Indrajit',
    leaveType: 'Earned Leave',
    startDate: '2026-10-05',
    endDate: '2026-10-09',
    reason: 'Planned vacation',
    status: 'Approved',
    appliedBy: 'Indrajit'
  },
  {
    id: 'lv-3',
    memberName: 'Jagadesh',
    leaveType: 'Optional Holiday',
    startDate: '2026-10-20',
    endDate: '2026-10-20',
    reason: 'Dussehra Festival',
    status: 'Approved',
    appliedBy: 'Jagadesh'
  }
];

export default function LeaveManagement({
  leaves = DEFAULT_LEAVE_RECORDS,
  setLeaves,
  holidays = [...DEFAULT_PUBLIC_HOLIDAYS, ...DEFAULT_OPTIONAL_HOLIDAYS],
  setHolidays,
  projects = [],
  setProjects
}) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('conflicts'); // 'conflicts', 'leaves', 'publicHolidays', 'optionalHolidays'

  // Modal / Form state for adding leave
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    memberName: currentUser?.name || ALL_RESOURCES[0],
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Modal state for adding holiday
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState({
    title: '',
    date: '',
    type: 'Public'
  });

  // Modal state for reassigning task conflict
  const [reassignModalState, setReassignModalState] = useState({
    isOpen: false,
    project: null,
    roleKey: '',
    roleTitle: '',
    currentMember: '',
    newMember: ''
  });

  const isManagerOrAdmin = ['Admin', 'SPOC', 'Super Admin', 'Lead', 'PM'].includes(currentUser?.role || '') || currentUser?.name === 'Subhasri' || currentUser?.name === 'Indrajit' || currentUser?.name === 'Jagadesh';

  // Compute conflicts between active leaves and active projects
  const computeConflicts = () => {
    const conflicts = [];
    const activeProjects = (projects || []).filter(p => p.status !== 'Completed' && p.status !== 'Cancelled' && p.status !== 'Deferred');

    const roleKeys = [
      { key: 'emailDeveloper', title: 'Email Developer' },
      { key: 'campaignBuilder', title: 'Campaign Builder' },
      { key: 'emailQA', title: 'Email QA' },
      { key: 'campaignQA', title: 'Campaign QA' },
      { key: 'audience', title: 'Audience' },
      { key: 'coe', title: 'CoE' }
    ];

    (leaves || []).forEach(l => {
      if (l.status === 'Cancelled') return;
      const leaveStart = new Date(l.startDate);
      const leaveEnd = new Date(l.endDate || l.startDate);

      activeProjects.forEach(p => {
        // Project execution window: default to creation date/today up to targetDate/dueDate
        const pStartStr = p.startDate || p.requestDate || p.creationDate || new Date().toISOString().split('T')[0];
        const pEndStr = p.targetDate || p.dueDate || pStartStr;

        const projStart = new Date(pStartStr);
        const projEnd = new Date(pEndStr);

        // Date overlap check: (LeaveStart <= ProjEnd) && (LeaveEnd >= ProjStart)
        const isOverlapping = (leaveStart <= projEnd) && (leaveEnd >= projStart);

        if (isOverlapping) {
          roleKeys.forEach(({ key, title }) => {
            const assignedVal = p[key];
            if (!assignedVal) return;

            const assignedList = Array.isArray(assignedVal)
              ? assignedVal
              : typeof assignedVal === 'string'
              ? assignedVal.split(/[,|]/).map(s => s.trim())
              : [];

            if (assignedList.some(name => name.toLowerCase() === l.memberName.toLowerCase())) {
              conflicts.push({
                id: `conflict-${l.id}-${p.id}-${key}`,
                leave: l,
                project: p,
                roleKey: key,
                roleTitle: title,
                memberName: l.memberName,
                projStart: pStartStr,
                projEnd: pEndStr,
                leaveStart: l.startDate,
                leaveEnd: l.endDate || l.startDate
              });
            }
          });
        }
      });
    });

    return conflicts;
  };

  const conflictsList = computeConflicts();

  // Handlers for Leave Logging
  const handleSaveLeave = (e) => {
    e.preventDefault();
    if (!leaveFormData.startDate) {
      alert('Please select a start date.');
      return;
    }
    const newLeave = {
      id: `lv-${Date.now()}`,
      ...leaveFormData,
      endDate: leaveFormData.endDate || leaveFormData.startDate,
      status: 'Approved',
      appliedBy: currentUser?.name || 'Self'
    };

    setLeaves(prev => [newLeave, ...prev]);
    setShowAddLeaveModal(false);
    setLeaveFormData({
      memberName: currentUser?.name || ALL_RESOURCES[0],
      leaveType: 'Casual Leave',
      startDate: '',
      endDate: '',
      reason: ''
    });
    alert('Leave record submitted successfully!');
  };

  const handleCancelLeave = (id) => {
    if (window.confirm('Are you sure you want to cancel this leave record?')) {
      setLeaves(prev => prev.filter(l => l.id !== id));
    }
  };

  // Handlers for Holiday Management
  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (!holidayFormData.title || !holidayFormData.date) {
      alert('Please provide holiday name and date.');
      return;
    }
    const dateObj = new Date(holidayFormData.date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dateObj.getDay()];

    const newHoliday = {
      id: `hol-${Date.now()}`,
      title: holidayFormData.title,
      date: holidayFormData.date,
      day: dayName,
      type: holidayFormData.type
    };

    setHolidays(prev => [...prev, newHoliday]);
    setShowAddHolidayModal(false);
    setHolidayFormData({ title: '', date: '', type: 'Public' });
  };

  const handleDeleteHoliday = (id) => {
    if (window.confirm('Remove this holiday entry?')) {
      setHolidays(prev => prev.filter(h => h.id !== id));
    }
  };

  // Handlers for Reassignment Modal
  const openReassignModal = (conflict) => {
    setReassignModalState({
      isOpen: true,
      project: conflict.project,
      roleKey: conflict.roleKey,
      roleTitle: conflict.roleTitle,
      currentMember: conflict.memberName,
      newMember: ALL_RESOURCES.find(r => r !== conflict.memberName) || ''
    });
  };

  const handleExecuteReassignment = (e) => {
    e.preventDefault();
    const { project, roleKey, newMember, currentMember, roleTitle } = reassignModalState;
    if (!newMember) {
      alert('Please select a team member to reassign this role to.');
      return;
    }

    if (!setProjects) {
      alert('Project list updater is not configured.');
      return;
    }

    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (p.id === project.id) {
          return {
            ...p,
            [roleKey]: newMember,
            history: [
              ...(p.history || []),
              {
                date: new Date().toISOString(),
                user: currentUser?.name || 'Manager',
                action: `Reassigned ${roleTitle} from ${currentMember} to ${newMember} due to Leave Conflict.`
              }
            ]
          };
        }
        return p;
      });
    });

    setReassignModalState({ isOpen: false, project: null, roleKey: '', roleTitle: '', currentMember: '', newMember: '' });
    alert(`Successfully reassigned ${roleTitle} role to ${newMember}!`);
  };

  const publicHolidaysList = (holidays || []).filter(h => h.type === 'Public');
  const optionalHolidaysList = (holidays || []).filter(h => h.type === 'Optional');

  return (
    <div className="leave-container">
      {/* Banner & Tab Navigation */}
      <div className="leave-header-banner">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🌴</span> Team Leave Management & Off-Time Dispatcher
          </h2>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            Track public/optional holidays, log team leaves, detect project-leave overlaps, and manually reassign tasks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="action-btn primary" 
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
            onClick={() => {
              setLeaveFormData({
                memberName: currentUser?.name || ALL_RESOURCES[0],
                leaveType: 'Casual Leave',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                reason: ''
              });
              setShowAddLeaveModal(true);
            }}
          >
            ➕ Apply / Log Leave
          </button>

          {isManagerOrAdmin && (
            <button 
              className="action-btn secondary" 
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
              onClick={() => setShowAddHolidayModal(true)}
            >
              📅 Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="leave-tab-bar">
        <button
          className={`leave-tab-btn ${activeTab === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveTab('conflicts')}
        >
          <span>⚠️ Leave-Task Overlaps & Reassign</span>
          <span style={{
            background: conflictsList.length > 0 ? '#ef4444' : '#334155',
            color: '#fff',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '0.75rem'
          }}>
            {conflictsList.length}
          </span>
        </button>

        <button
          className={`leave-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <span>📝 Team Leave Log</span>
          <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>
            {leaves.length}
          </span>
        </button>

        <button
          className={`leave-tab-btn ${activeTab === 'publicHolidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('publicHolidays')}
        >
          <span>🏛️ Public Holidays</span>
          <span style={{ background: '#10b981', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>
            {publicHolidaysList.length}
          </span>
        </button>

        <button
          className={`leave-tab-btn ${activeTab === 'optionalHolidays' ? 'active' : ''}`}
          onClick={() => setActiveTab('optionalHolidays')}
        >
          <span>🌟 Optional Holidays</span>
          <span style={{ background: '#f59e0b', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>
            {optionalHolidaysList.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Leave-Task Overlaps & Reassignment */}
      {activeTab === 'conflicts' && (
        <div>
          {conflictsList.length === 0 ? (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '2.5rem',
              textAlign: 'center',
              color: '#10b981'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>🎉 All Clear! No Leave & Project Overlap Conflicts Detected</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                All assigned project execution dates are free from team member planned leaves.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>
                  <strong>Attention Managers & Leads:</strong> {conflictsList.length} project task assignment(s) overlap with team member leave dates. Please review and reassign these roles to available members.
                </span>
              </div>

              {conflictsList.map(conf => (
                <div key={conf.id} className="conflict-card-alert">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        LEAVE CONFLICT
                      </span>
                      <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>
                        {conf.memberName}
                      </strong>
                      <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                        ({conf.roleTitle})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                      <div>
                        📌 <strong>Project:</strong> [{conf.project.projectId || conf.project.id}] {conf.project.projectName}
                      </div>
                      <div>
                        📅 <strong>Project Target Execution:</strong> {conf.projStart} to {conf.projEnd}
                      </div>
                      <div>
                        🌴 <strong>Member Leave Period:</strong> <span style={{ color: '#fca5a5', fontWeight: 600 }}>{conf.leaveStart} to {conf.leaveEnd}</span> ({conf.leave.leaveType})
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      className="action-btn primary"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                      }}
                      onClick={() => openReassignModal(conf)}
                    >
                      🔄 Reassign Task Role
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Team Leave Records Log */}
      {activeTab === 'leaves' && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
              📝 Team Leave Records Directory
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Showing {leaves.length} logged leave(s)
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Team Member</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Leave Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Start Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>End Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l, idx) => (
                  <tr key={l.id || idx} style={{ borderBottom: '1px solid #334155', color: '#e2e8f0' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{l.memberName}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c084fc',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem'
                      }}>
                        {l.leaveType}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{l.startDate}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{l.endDate || l.startDate}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{l.reason || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {l.status || 'Approved'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {(isManagerOrAdmin || l.memberName === currentUser?.name) && (
                        <button
                          style={{
                            background: 'transparent',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleCancelLeave(l.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Public Holidays */}
      {activeTab === 'publicHolidays' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {publicHolidaysList.map(h => (
            <div key={h.id} className="holiday-card">
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                  {h.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#34d399', marginTop: '0.25rem' }}>
                  📅 {h.date} ({h.day})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Mandatory Off
                </span>
                {isManagerOrAdmin && (
                  <button
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                    onClick={() => handleDeleteHoliday(h.id)}
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Optional Holidays */}
      {activeTab === 'optionalHolidays' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {optionalHolidaysList.map(h => (
            <div key={h.id} className="holiday-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                  {h.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                  📅 {h.date} ({h.day})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Optional Off
                </span>
                {isManagerOrAdmin && (
                  <button
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                    onClick={() => handleDeleteHoliday(h.id)}
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Apply / Log Leave */}
      {showAddLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>📝 Log / Request Leave</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowAddLeaveModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Team Member Name *</label>
                <select
                  className="form-control"
                  value={leaveFormData.memberName}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, memberName: e.target.value }))}
                  disabled={!isManagerOrAdmin}
                >
                  {ALL_RESOURCES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select
                  className="form-control"
                  value={leaveFormData.leaveType}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Optional Holiday">Optional Holiday (OH)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={leaveFormData.startDate}
                    onChange={e => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={leaveFormData.endDate}
                    onChange={e => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={leaveFormData.reason}
                  onChange={e => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for leave application..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setShowAddLeaveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn primary"
                >
                  Submit Leave Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Public / Optional Holiday */}
      {showAddHolidayModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>📅 Add Company Holiday</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setShowAddHolidayModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Holiday Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Diwali, Good Friday"
                  value={holidayFormData.title}
                  onChange={e => setHolidayFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={holidayFormData.date}
                  onChange={e => setHolidayFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Holiday Type *</label>
                <select
                  className="form-control"
                  value={holidayFormData.type}
                  onChange={e => setHolidayFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="Public">Public (Mandatory All-Team Off)</option>
                  <option value="Optional">Optional (Elective Holiday)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setShowAddHolidayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn primary"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reassign Task Overlap */}
      {reassignModalState.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>🔄 Reassign Project Role</h3>
              <button
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => setReassignModalState({ isOpen: false, project: null, roleKey: '', roleTitle: '', currentMember: '', newMember: '' })}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReassignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#0f172a', padding: '0.85rem', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <div><strong>Project:</strong> [{reassignModalState.project?.projectId || reassignModalState.project?.id}] {reassignModalState.project?.projectName}</div>
                <div style={{ marginTop: '0.25rem' }}><strong>Role to Reassign:</strong> {reassignModalState.roleTitle}</div>
                <div style={{ marginTop: '0.25rem', color: '#f87171' }}><strong>Currently Assigned (On Leave):</strong> {reassignModalState.currentMember}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Replacement Team Member *</label>
                <select
                  className="form-control"
                  value={reassignModalState.newMember}
                  onChange={e => setReassignModalState(prev => ({ ...prev, newMember: e.target.value }))}
                  required
                >
                  <option value="">-- Choose Available Member --</option>
                  {ALL_RESOURCES.filter(r => r !== reassignModalState.currentMember).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setReassignModalState({ isOpen: false, project: null, roleKey: '', roleTitle: '', currentMember: '', newMember: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn primary"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
