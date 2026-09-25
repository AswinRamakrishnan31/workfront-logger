import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutGrid, Table, Briefcase, BarChart2, Users, Sliders, LogIn, User, Layers, LayoutDashboard } from 'lucide-react';
import MyDashboard from './components/MyDashboard';
import ProjectForm from './components/ProjectForm';
import ProjectGrid from './components/ProjectGrid';
import SLAMasterModule from './components/SLAMasterModule';
import ScrumDashboard from './components/ScrumDashboard';
import CampaignOpsDashboard from './components/CampaignOpsDashboard';
import DeploymentCalendar from './components/DeploymentCalendar';
import ResourceLoading from './components/ResourceLoading';
import StagingQueue from './components/StagingQueue';
import AdminPanel from './components/AdminPanel';
import LoginModal from './components/LoginModal';
import LoginScreen from './components/LoginScreen';
import LeaveManagement, { DEFAULT_LEAVE_RECORDS, DEFAULT_PUBLIC_HOLIDAYS, DEFAULT_OPTIONAL_HOLIDAYS } from './components/LeaveManagement';
import { DropdownProvider } from './context/DropdownContext';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import projectApi from './api/projectApi';
import migrationApi from './api/migrationApi';
import './App.css';

function MainApp() {
  const [view, setView] = useState('myDashboard');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Leave & Holiday State Management
  const [leaves, setLeaves] = useState(() => {
    const saved = localStorage.getItem('wf_team_leaves');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_LEAVE_RECORDS;
  });

  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('wf_team_holidays');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [...DEFAULT_PUBLIC_HOLIDAYS, ...DEFAULT_OPTIONAL_HOLIDAYS];
  });

  useEffect(() => {
    localStorage.setItem('wf_team_leaves', JSON.stringify(leaves));
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem('wf_team_holidays', JSON.stringify(holidays));
  }, [holidays]);

  const { currentUser, permissions } = useAuth();

  // Load from REST API on mount with fallback to local storage
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectApi.getProjects({ page: 1, pageSize: 500 });
      if (res.data && res.data.length > 0) {
        setProjects(res.data);
      } else {
        // Fallback to local storage if API returns empty
        const saved = localStorage.getItem('wf_projects');
        if (saved) {
          const parsed = JSON.parse(saved);
          setProjects(parsed);
          // Auto migrate to database
          migrationApi.migrateLocalStorage(parsed).then(() => {
            console.log('Legacy local storage projects migrated to database server');
          }).catch(err => console.warn('Migration warning:', err));
        }
      }
    } catch (err) {
      console.warn('Backend API connection falling back to local storage:', err);
      const saved = localStorage.getItem('wf_projects');
      if (saved) {
        setProjects(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Ensure current view is allowed for user role
  useEffect(() => {
    if (!permissions) return;
    if (view === 'form' && !permissions.canLogProjects) {
      setView('grid');
    }
    if (view === 'admin' && !permissions.canAccessAdminPanel) {
      setView('grid');
    }
  }, [currentUser, permissions, view]);

  // MANDATORY LOGIN SCREEN IF NO CURRENT USER SESSION
  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleAddProject = async (project) => {
    if (!permissions.canLogProjects) {
      alert("Your role does not have permission to log new projects.");
      return;
    }

    try {
      const res = await projectApi.createProject(project);
      if (res.data) {
        setProjects(prev => [res.data, ...prev]);
      }
    } catch (err) {
      console.warn('API error on add, saving locally:', err);
      setProjects(prev => [project, ...prev]);
    }
    setView('grid');
  };

  const handleUpdateProject = async (updatedProject) => {
    if (!permissions.canEditProjects) {
      alert("Your role does not have permission to edit projects.");
      return;
    }

    try {
      if (updatedProject.id) {
        const res = await projectApi.updateProject(updatedProject.id, updatedProject);
        if (res.data) {
          setProjects(prev => prev.map(p => p.id === res.data.id ? res.data : p));
          return;
        }
      }
    } catch (err) {
      console.warn('API error on update:', err);
    }
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleBulkAddProjects = async (newProjects) => {
    try {
      await migrationApi.migrateLocalStorage(newProjects);
      fetchProjects();
    } catch (err) {
      setProjects(prev => [...newProjects, ...prev]);
    }
  };

  const handleClearProjects = () => {
    if (!permissions.canDeleteProjects) {
      alert("Only Admin can clear all project records.");
      return;
    }

    if (window.confirm("Are you sure you want to completely wipe all projects? This cannot be undone.")) {
      setProjects([]);
      localStorage.removeItem('wf_projects');
    }
  };

  const handleDeleteProjects = async (idsToDelete) => {
    if (!permissions.canDeleteProjects) {
      alert("Only Admin can delete projects.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${idsToDelete.length} project(s)?`)) {
      for (const id of idsToDelete) {
        try {
          await projectApi.deleteProject(id);
        } catch (e) {
          console.warn('Failed to delete project on server:', id);
        }
      }
      setProjects(prev => prev.filter(p => !idsToDelete.includes(p.id)));
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header animate-fade-in">
          <h1><Briefcase color="#818cf8" size={24} /> Logger</h1>
        </div>

        {/* LOGGED IN USER BADGE */}
        <div 
          onClick={() => setIsLoginOpen(true)}
          style={{
            margin: '0.75rem 1rem 1.25rem 1rem',
            padding: '0.75rem 0.85rem',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(129, 140, 248, 0.25)',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s'
          }}
          title="Click to switch user or change access role"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f8fafc', lineHeight: 1.2 }}>
                {currentUser?.name || 'Guest User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: '600' }}>
                {currentUser?.role || 'Viewer'}
              </div>
            </div>
          </div>
          <LogIn size={15} color="#94a3b8" />
        </div>

        <nav className="sidebar-nav">
          <button 
            className={view === 'myDashboard' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('myDashboard')}
          >
            <LayoutDashboard size={18} />
            My Dashboard
          </button>

          {permissions.canLogProjects && (
            <button 
              className={view === 'form' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('form')}
            >
              <PlusCircle size={18} />
              Log Project
            </button>
          )}

          <button 
            className={view === 'staging' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('staging')}
            style={{ position: 'relative' }}
          >
            <Layers size={18} />
            Staging Queue
            {projects.filter(p => p.status === 'Staged' || p.status === 'Pending Approval' || p.isStaged).length > 0 && (
              <span style={{
                background: '#8b5cf6',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                marginLeft: 'auto'
              }}>
                {projects.filter(p => p.status === 'Staged' || p.status === 'Pending Approval' || p.isStaged).length}
              </span>
            )}
          </button>

          <button 
            className={view === 'grid' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('grid')}
          >
            <LayoutGrid size={18} />
            View Projects
          </button>

          <button 
            className={view === 'sla' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('sla')}
          >
            <Table size={18} />
            SLA Master {permissions.canUpdateSLA ? '' : '(View)'}
          </button>

          <button 
            className={view === 'scrum' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('scrum')}
          >
            <Briefcase size={18} />
            Scrum Board
          </button>

          <button 
            className={view === 'campaignOps' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('campaignOps')}
          >
            <BarChart2 size={18} />
            Campaign Ops
          </button>

          <button 
            className={view === 'deploymentCalendar' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('deploymentCalendar')}
          >
            <Table size={18} />
            Deployment Calendar
          </button>

          <button 
            className={view === 'resourceLoading' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('resourceLoading')}
          >
            <Users size={18} />
            Resource Loading
          </button>

          <button 
            className={view === 'leaveManagement' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('leaveManagement')}
            style={{ position: 'relative' }}
          >
            <Table size={18} />
            Leave Management
          </button>

          {permissions.canAccessAdminPanel && (
            <button 
              className={view === 'admin' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('admin')}
              style={{ marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}
            >
              <Sliders size={18} color={view === 'admin' ? '#ffffff' : '#818cf8'} />
              Admin Panel
            </button>
          )}
        </nav>
      </aside>

      <main className="main-content">
        {view === 'myDashboard' && <MyDashboard projects={projects} onUpdateProject={handleUpdateProject} leaves={leaves} />}
        {view === 'form' && permissions.canLogProjects && <ProjectForm onAddProject={handleAddProject} projects={projects} leaves={leaves} />}
        {view === 'grid' && <ProjectGrid projects={projects} onUpdateProject={handleUpdateProject} onBulkAddProjects={handleBulkAddProjects} onClearProjects={handleClearProjects} onDeleteProjects={handleDeleteProjects} />}
        {view === 'staging' && <StagingQueue projects={projects} onUpdateProject={handleUpdateProject} onDeleteProjects={handleDeleteProjects} onBulkAddProjects={handleBulkAddProjects} leaves={leaves} />}
        {view === 'sla' && <SLAMasterModule readOnly={!permissions.canUpdateSLA} />}
        {view === 'scrum' && <ScrumDashboard projects={projects} />}
        {view === 'campaignOps' && <CampaignOpsDashboard projects={projects} />}
        {view === 'deploymentCalendar' && <DeploymentCalendar projects={projects} />}
        {view === 'resourceLoading' && <ResourceLoading projects={projects} />}
        {view === 'leaveManagement' && <LeaveManagement leaves={leaves} setLeaves={setLeaves} holidays={holidays} setHolidays={setHolidays} projects={projects} setProjects={setProjects} />}
        {view === 'admin' && permissions.canAccessAdminPanel && <AdminPanel />}
      </main>

      {/* LOGIN / ROLE SWITCHING MODAL */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090d16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '560px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#818cf8', fontSize: '1.5rem' }}>Workfront Logger Recovery</h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              An unexpected render update occurred. Click below to restore session or clear cache and reload.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '1.5rem',
                wordBreak: 'break-word',
                textAlign: 'left',
                fontFamily: 'monospace'
              }}>
                <strong>Error Details:</strong> {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.removeItem('wf_user_session');
                  localStorage.removeItem('wf_remembered_credentials');
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: '#334155',
                  color: '#f8fafc',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Reset Session & Login
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <DropdownProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </DropdownProvider>
    </ErrorBoundary>
  );
}

export default App;
