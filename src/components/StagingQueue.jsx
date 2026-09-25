import React, { useState } from 'react';
import { Layers, CheckCircle2, XCircle, Edit3, ArrowRight, Zap, AlertCircle, UserCheck } from 'lucide-react';

export default function StagingQueue({ projects = [], onUpdateProject, onDeleteProjects, onPromoteToMain }) {
  const [selectedStagedIds, setSelectedStagedIds] = useState([]);
  const [editingStagedProject, setEditingStagedProject] = useState(null);

  // Filter projects in Staging Queue
  const stagedProjects = projects.filter(p => 
    p.status === 'Staged' || 
    p.status === 'Pending Approval' || 
    p.status === 'Staged (Auto-Assigned)' || 
    p.isStaged === true
  );

  const toggleSelect = (id) => {
    setSelectedStagedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApproveProject = (project) => {
    const updated = {
      ...project,
      status: 'In-Developement',
      isStaged: false,
      approvedAt: new Date().toISOString(),
      remarks: project.remarks ? `${project.remarks} | Approved & Promoted from Staging Queue` : 'Approved & Promoted from Staging Queue'
    };
    onUpdateProject(updated);
  };

  const handleBulkApprove = () => {
    const targetIds = selectedStagedIds.length > 0 ? selectedStagedIds : stagedProjects.map(p => p.id);
    if (targetIds.length === 0) return;

    targetIds.forEach(id => {
      const p = stagedProjects.find(item => item.id === id);
      if (p) {
        handleApproveProject(p);
      }
    });
    setSelectedStagedIds([]);
    alert(`Successfully approved and moved ${targetIds.length} project(s) to the main Project Module!`);
  };

  const handleRejectProject = (project) => {
    if (window.confirm(`Are you sure you want to reject and remove "${project.projectName}" from Staging?`)) {
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
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        padding: '1.25rem 1.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '0.6rem',
              borderRadius: '10px',
              display: 'flex',
              color: '#fff'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc', fontWeight: 700 }}>
                Project Staging & Review Module
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Review, verify, and approve auto-assigned projects before moving them live into production
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleBulkApprove}
            disabled={stagedProjects.length === 0}
            style={{
              background: stagedProjects.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: stagedProjects.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: stagedProjects.length > 0 ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
            }}
          >
            <CheckCircle2 size={18} />
            Approve All Staged ({stagedProjects.length})
          </button>
        </div>
      </div>

      {/* METRICS DASHBOARD */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Approvals</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a5b4fc', marginTop: '0.25rem' }}>{stagedProjects.length}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auto-Assigned Team</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {stagedProjects.filter(p => p.emailDeveloper || p.campaignBuilder).length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ready to Move</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            {stagedProjects.length}
          </div>
        </div>
      </div>

      {/* STAGED PROJECTS CARDS */}
      {stagedProjects.length === 0 ? (
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
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
            No Projects Currently in Staging Queue
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            All auto-assigned projects have been approved and moved to the main Project Module. When new projects are auto-assigned or staged, they will appear here for your review!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stagedProjects.map((project) => {
            const isSelected = selectedStagedIds.includes(project.id);
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
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(project.id)}
                      style={{ marginTop: '0.3rem', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#c4b5fd',
                          border: '1px solid rgba(139, 92, 246, 0.4)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          STAGED FOR REVIEW
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700 }}>
                          {project.projectName || project.taskName || 'Untitled Staged Project'}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span><strong>LOB:</strong> {project.lineOfBusiness || project.lob || 'General'}</span>
                        <span><strong>Type:</strong> {project.typeOfRequest || project.requestType || 'Standard'}</span>
                        <span><strong>Priority:</strong> <span style={{ color: project.priority === 'High' || project.priority === 'Urgent' ? '#f87171' : '#a5b4fc' }}>{project.priority || 'Normal'}</span></span>
                        <span><strong>Requester:</strong> {project.requesterName || project.requestorName || '—'}</span>
                        <span><strong>Dates:</strong> {project.expectedStartDate || '—'} → {project.expectedEndDate || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApproveProject(project)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={16} /> Approve & Move to Projects <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={() => handleRejectProject(project)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>

                {/* PROPOSED AUTO-ASSIGNMENT RESOURCE SUMMARY */}
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
