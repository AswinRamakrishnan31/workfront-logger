import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Table, Lock } from 'lucide-react';
import SLATable from './SLATable';

const DEFAULT_ROWS = [
  'Simple Updates',
  'Simple Creation',
  'Services Updates',
  'Medium Updates',
  'Medium Creation',
  'Complex Updates',
  'Complex Creation'
];

const DEFAULT_EMAIL_DATA = {
  id: 'email-sla',
  name: 'Email SLA',
  columns: ['Dev', 'QA', 'UAT', 'Pre-Deployment', 'Post-Deployments', 'CR', 'Communication', 'PM'],
  data: [
    { row: 'Simple Updates', Dev: 1.5, QA: 0.45, UAT: 0.15, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 0, Communication: 0.15, PM: 0.15 },
    { row: 'Simple Creation', Dev: 2, QA: 0.6, UAT: 0.2, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 0, Communication: 0.2, PM: 0.2 },
    { row: 'Services Updates', Dev: 1, QA: 0.5, UAT: 0.1, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 0, Communication: 0.1, PM: 0.1 },
    { row: 'Medium Updates', Dev: 3.5, QA: 1.05, UAT: 0.35, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 0.5, Communication: 0.35, PM: 0.35 },
    { row: 'Medium Creation', Dev: 5, QA: 1.5, UAT: 0.5, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 0.5, Communication: 0.5, PM: 0.5 },
    { row: 'Complex Updates', Dev: 12, QA: 3.6, UAT: 1.2, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 1, Communication: 1.2, PM: 1.2 },
    { row: 'Complex Creation', Dev: 16, QA: 4.8, UAT: 1.6, 'Pre-Deployment': 0.25, 'Post-Deployments': 0.25, CR: 1, Communication: 1.6, PM: 1.6 }
  ]
};

const DEFAULT_CAMPAIGN_DATA = {
  id: 'campaign-sla',
  name: 'Campaign',
  columns: ['Dev', 'Config', 'QA', 'UAT', 'Pre-Deployment', 'Deployments', 'CR', 'Communication', 'PM'],
  data: [
    { row: 'Simple Updates', Dev: 1.5, Config: 0.1, QA: 0.48, UAT: 0.15, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 0, Communication: 0.15, PM: 0.15 },
    { row: 'Simple Creation', Dev: 2, Config: 0.1, QA: 0.63, UAT: 0.2, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 0, Communication: 0.2, PM: 0.2 },
    { row: 'Services Updates', Dev: 1, Config: 0.1, QA: 0.33, UAT: 0.1, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 0, Communication: 0.1, PM: 0.1 },
    { row: 'Medium Updates', Dev: 3.5, Config: 0.2, QA: 1.11, UAT: 0.35, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 0.5, Communication: 0.35, PM: 0.35 },
    { row: 'Medium Creation', Dev: 6, Config: 0.2, QA: 1.86, UAT: 0.6, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 0.5, Communication: 0.6, PM: 0.6 },
    { row: 'Complex Updates', Dev: 8, Config: 0.2, QA: 2.46, UAT: 0.8, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 1, Communication: 0.8, PM: 0.8 },
    { row: 'Complex Creation', Dev: 12, Config: 0.2, QA: 3.66, UAT: 1.2, 'Pre-Deployment': 0.25, Deployments: 0.3, CR: 1, Communication: 1.2, PM: 1.2 }
  ]
};

function SLAMasterModule({ readOnly = false }) {
  const [channels, setChannels] = useState(() => {
    const saved = localStorage.getItem('wf_sla_channels');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [DEFAULT_EMAIL_DATA, DEFAULT_CAMPAIGN_DATA];
  });

  const [expandedId, setExpandedId] = useState('email-sla');
  const [isAdding, setIsAdding] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    localStorage.setItem('wf_sla_channels', JSON.stringify(channels));
  }, [channels]);

  const handleAddChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const newChannel = {
      id: Date.now().toString(),
      name: newChannelName,
      columns: ['Dev', 'QA', 'UAT', 'Pre-Deployment', 'Deployments', 'CR', 'Communication', 'PM'],
      data: DEFAULT_ROWS.map(r => ({
        row: r, Dev: 0, QA: 0, UAT: 0, 'Pre-Deployment': 0, Deployments: 0, CR: 0, Communication: 0, PM: 0
      }))
    };

    setChannels([...channels, newChannel]);
    setExpandedId(newChannel.id);
    setNewChannelName('');
    setIsAdding(false);
  };

  const handleDeleteChannel = (id) => {
    if (window.confirm('Are you sure you want to delete this SLA matrix channel?')) {
      setChannels(channels.filter(c => c.id !== id));
    }
  };

  const handleUpdateChannel = (updatedChannel) => {
    if (readOnly) return;
    setChannels(channels.map(c => c.id === updatedChannel.id ? updatedChannel : c));
  };

  return (
    <div className="sla-module animate-fade-in" style={{ padding: '2rem' }}>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>SLA Master Matrix</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {readOnly ? 'View SLA benchmarks and stage durations across channels' : 'Configure benchmark SLAs and stage durations across channels'}
          </p>
        </div>
        {!readOnly && (
          <button className="btn-primary" onClick={() => setIsAdding(!isAdding)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Channel
          </button>
        )}
        {readOnly && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.85rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <Lock size={15} color="#818cf8" /> Read-Only Mode
          </div>
        )}
      </div>

      {isAdding && !readOnly && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Create New Channel SLA Matrix</h3>
          <form onSubmit={handleAddChannel} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
            <div>
              <input 
                type="text" 
                placeholder="Channel Name (e.g., Push Notification SLA)" 
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }}
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Channel</button>
            </div>
          </form>
        </div>
      )}

      <div className="channels-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {channels.map(channel => (
          <div key={channel.id} className="glass-panel" style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
            <div 
              className="channel-header" 
              style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedId === channel.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              onClick={() => setExpandedId(expandedId === channel.id ? null : channel.id)}
            >
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                {expandedId === channel.id ? <ChevronUp size={20} color="#818cf8"/> : <ChevronDown size={20} color="#818cf8"/>}
                {channel.name}
              </h3>
              {!readOnly && (
                <button 
                  className="btn-icon" 
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChannel(channel.id);
                  }}
                  title="Delete Channel"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            
            {expandedId === channel.id && (
              <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowX: 'auto' }}>
                <SLATable 
                  channel={channel} 
                  onUpdate={handleUpdateChannel} 
                  readOnly={readOnly}
                />
              </div>
            )}
          </div>
        ))}
        {channels.length === 0 && (
          <div className="empty-state glass-panel" style={{ borderRadius: '12px', border: '1px solid var(--surface-border)', padding: '2rem', textAlign: 'center' }}>
            <Table size={48} />
            <h3 style={{ marginTop: '1rem' }}>No Channels configured</h3>
            <p>Click "Add Channel" to create your first SLA matrix.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SLAMasterModule;
