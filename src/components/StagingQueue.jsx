import React, { useState } from 'react';
import { Layers, CheckCircle2, XCircle, Edit3, ArrowRight, Zap, AlertCircle, Clock, Archive, RefreshCw, ShieldAlert } from 'lucide-react';

export default function StagingQueue({ projects = [], onUpdateProject, onDeleteProjects }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archive'
  const [selectedStagedIds, setSelectedStagedIds] = useState([]);
  const [editingStagedProject, setEditingStagedProject] = useState(null);

  const RETENTION_DAYS = 7;
  const nowMs = Date.now();

  // Helper to compute days in staging
  const getStagingMetrics = (project) => {
    const stagedTime = project.stagedAt || project.createdAt || project.date;
    const stagedDate = new Date(stagedTime);
    const validDate = isNaN(stagedDate.getTime()) ? new Date() : stagedDate;
    const diffMs = Math.max(0, nowMs - validDate.getTime());
    const daysInStaging = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, RETENTION_DAYS - daysInStaging);
    const isExpired = daysInStaging >= RETENTION_DAYS;

    return { stagedDate: validDate, daysInStaging, daysRemaining, isExpired };
  };

  // Filter Active Staged vs Archived Staged
  const allStagedProjects = projects.filter(p => 
    p.status === 'Staged' || 
    p.status === 'Pending Approval' || 
    p.status === 'Staged (Auto-Assigned)' || 
    p.status === 'Staging Archived' || 
    p.isStaged === true
  );

  const activeStagedProjects = allStagedProjects.filter(p => {
    if (p.status === 'Staging Archived') return false;
    const { isExpired } = getStagingMetrics(p);
    return !isExpired;
  });

  const archivedStagedProjects = allStagedProjects.filter(p => {
    if (p.status === 'Staging Archived') return true;
    const { isExpired } = getStagingMetrics(p);
    return isExpired;
  });

  const currentList = activeTab === 'active' ? activeStagedProjects : archivedStagedProjects;

  const toggleSelect = (id) => {
    setSelectedStagedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApproveProject = (project) => {
    const stgId = project.stagingId || `STG-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const prodWfId = project.workfrontProjectId || `WF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const updated = {
      ...project,
      stagingId: stgId,
      workfrontProjectId: prodWfId,
      status: 'In-Developement',
      isStaged: false,
      approvedAt: new Date().toISOString(),
      remarks: project.remarks 
        ? `${project.remarks} | Promoted from Staging (${stgId})`
        : `Promoted from Staging Queue (${stgId}) to Production (${prodWfId})`
    };
    onUpdateProject(updated);
  };

  const handleBulkApprove = () => {
    const targetIds = selectedStagedIds.length > 0 ? selectedStagedIds : activeStagedProjects.map(p => p.id);
    if (targetIds.length === 0) return;

    targetIds.forEach(id => {
      const p = projects.find(item => item.id === id);
      if (p) {
        handleApproveProject(p);
      }
    });
    setSelectedStagedIds([]);
    alert(`Successfully approved and promoted ${targetIds.length} staged project(s) to the main Project Module!`);
  };

  const handleAutoArchiveExpired = () => {
    let count = 0;
    allStagedProjects.forEach(p => {
      const { isExpired } = getStagingMetrics(p);
      if (isExpired && p.status !== 'Staging Archived') {
        const updated = {
          ...p,
          status: 'Staging Archived',
          isStaged: false,
          archivedAt: new Date().toISOString(),
          remarks: p.remarks ? `${p.remarks} | Auto-archived after 7 days in staging` : 'Auto-archived after 7 days in staging'
        };
        onUpdateProject(updated);
        count++;
      }
    });

    if (count > 0) {
      alert(`Auto-archived ${count} staged project(s) older than 7 days retention limit.`);
    } else {
      alert('No expired staged projects found to archive.');
    }
  };

  const handleRejectProject = (project) => {
    if (window.confirm(`Are you sure you want to reject "${project.projectName}"?`)) {
      if (onDeleteProjects && project.id) {
        onDeleteProjects([project.id]);
      } else {
        const updated = { ...project, status: 'Cancelled', isStaged: false };
        onUpdateProject(updated);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem 0' }}>
      {/* HEADER BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.35)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '0.65rem',
              borderRadius: '10px',
              display: 'flex',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <Layers size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc', fontWeight: 800 }}>
                Project Staging & Review Queue
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Dedicated Staging IDs • 7-Day Auto-Retention Policy • Approval Workflow
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleAutoArchiveExpired}
            className="btn-secondary"
            style={{
              background: 'rgba(100, 116, 139, 0.15)',
              color: '#94a3b8',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            title="Auto-archive unapproved staged items older than 7 days"
          >
            <Archive size={16} /> Auto-Archive Expired (&gt; 7 Days)
          </button>

          <button
            onClick={handleBulkApprove}
            disabled={activeStagedProjects.length === 0}
            style={{
              background: activeStagedProjects.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: activeStagedProjects.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: activeStagedProjects.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
            }}
          >
            <CheckCircle2 size={18} />
            Approve & Promote Selected ({selectedStagedIds.length || activeStagedProjects.length})
          </button>
        </div>
      </div>

      {/* METRICS & TAB SWITCHER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              background: activeTab === 'active' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'active' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Clock size={16} /> Active Staged Queue ({activeStagedProjects.length})
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            style={{
              background: activeTab === 'archive' ? '#475569' : 'transparent',
              color: activeTab === 'archive' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Archive size={16} /> Staging Archive ({archivedStagedProjects.length})
          </button>
        </div>

        {/* POLICY INFO BADGE */}
        <div style={{
          fontSize: '0.8rem',
          color: '#a5b4fc',
          background: 'rgba(99, 102, 241, 0.1)',
          padding: '0.4rem 0.9rem',
          borderRadius: '20px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <Clock size={14} /> 7-Day Auto-Retention Policy Active (Unapproved items archive after 7 days)
        </div>
      </div>

      {/* STAGED PROJECTS CARDS */}
      {currentList.length === 0 ? (
        <div className="glass-panel" style={{
          textAlign: 'center',
          padding: '3.5rem 2rem',
          borderRadius: '12px',
          border: '1px dashed var(--surface-border)'
        }}>
          <div style={{
            background: 'rgba(99,102,241,0.1)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: '#8b5cf6'
          }}>
            {activeTab === 'active' ? <CheckCircle2 size={32} /> : <Archive size={32} />}
          </div>
          <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
            {activeTab === 'active' ? 'No Projects Currently Pending in Staging' : 'No Archived Staged Projects'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
            {activeTab === 'active' 
              ? 'All auto-assigned projects have been reviewed, approved, and promoted to production. New auto-assigned items will appear here with dedicated Staging IDs (STG-xxxx).' 
              : 'Staged projects that exceed the 7-day retention limit or get archived will be listed here for historical reference.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentList.map((project) => {
            const isSelected = selectedStagedIds.includes(project.id);
            const { daysInStaging, daysRemaining, isExpired } = getStagingMetrics(project);
            const stgId = project.stagingId || `STG-${new Date().getFullYear()}-${String(project.id).slice(-4)}`;

            return (
              <div
                key={project.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #8b5cf6' : '1px solid var(--surface-border)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'var(--surface-bg)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {activeTab === 'active' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(project.id)}
                        style={{ marginTop: '0.35rem', width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {/* DEDICATED STAGING ID BADGE */}
                        <span style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          color: '#ffffff',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                        }}>
                          🆔 {stgId}
                        </span>

                        {/* RETENTION STATUS BADGE */}
                        <span style={{
                          background: isExpired ? 'rgba(239, 68, 68, 0.15)' : daysRemaining <= 2 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isExpired ? '#f87171' : daysRemaining <= 2 ? '#fbbf24' : '#34d399',
                          border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : daysRemaining <= 2 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Clock size={12} />
                          {isExpired ? `Expired (${daysInStaging}d in staging)` : `Staged ${daysInStaging}d ago (${daysRemaining}d left in retention)`}
                        </span>

                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                          {project.projectName || project.taskName || 'Untitled Staged Project'}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span><strong>LOB:</strong> {project.lineOfBusiness || project.lob || 'General'}</span>
                        <span><strong>Type:</strong> {project.typeOfRequest || project.requestType || 'Standard'}</span>
                        <span><strong>Priority:</strong> <span style={{ color: project.priority === 'High' || project.priority === 'Urgent' ? '#f87171' : '#a5b4fc' }}>{project.priority || 'Normal'}</span></span>
                        <span><strong>Requester:</strong> {project.requesterName || project.requestorName || '—'}</span>
                        <span><strong>Expected Dates:</strong> {project.expectedStartDate || '—'} → {project.expectedEndDate || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {activeTab === 'active' && (
                      <button
                        onClick={() => handleApproveProject(project)}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem 1.1rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Approve & Promote to Production <ArrowRight size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => handleRejectProject(project)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.8rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <XCircle size={16} /> {activeTab === 'active' ? 'Reject' : 'Delete Record'}
                    </button>
                  </div>
                </div>

                {/* PROPOSED AUTO-ASSIGNED RESOURCE MATRIX */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1.1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Proposed Email Dev</span>
                    <span style={{ fontSize: '0.9rem', color: project.emailDeveloper ? '#38bdf8' : '#64748b', fontWeight: 600 }}>
                      {project.emailDeveloper || 'Not Assigned'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Proposed Email QA</span>
                    <span style={{ fontSize: '0.9rem', color: project.emailQA ? '#38bdf8' : '#64748b', fontWeight: 600 }}>
                      {project.emailQA || 'Not Assigned'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Proposed Campaign Builder</span>
                    <span style={{ fontSize: '0.9rem', color: project.campaignBuilder ? '#a5b4fc' : '#64748b', fontWeight: 600 }}>
                      {project.campaignBuilder || 'Not Assigned'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Proposed Campaign QA</span>
                    <span style={{ fontSize: '0.9rem', color: project.campaignQA ? '#a5b4fc' : '#64748b', fontWeight: 600 }}>
                      {project.campaignQA || 'Not Assigned'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Audience / CoE</span>
                    <span style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 600 }}>
                      {project.audience || '—'} / {project.coe || '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
