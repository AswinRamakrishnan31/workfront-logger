import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutGrid, Table, Briefcase, BarChart2, Users, Sliders, LogIn, User, Layers } from 'lucide-react';
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
import { DropdownProvider } from './context/DropdownContext';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import projectApi from './api/projectApi';
import migrationApi from './api/migrationApi';
import './App.css';

function MainApp() {
  const [view, setView] = useState('deploymentCalendar');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
    if (view === 'form' && !permissions.canLogProjects) {
      setView('grid');
    }
    if (view === 'admin' && !permissions.canAccessAdminPanel) {
      setView('grid');
    }
  }, [currentUser, permissions, view]);

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
            className={view === 'resourceLoading' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('resourceLoading')}
          >
            <Users size={18} />
            Resource Loading
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
        {view === 'form' && permissions.canLogProjects && <ProjectForm onAddProject={handleAddProject} projects={projects} />}
        {view === 'grid' && <ProjectGrid projects={projects} onUpdateProject={handleUpdateProject} onBulkAddProjects={handleBulkAddProjects} onClearProjects={handleClearProjects} onDeleteProjects={handleDeleteProjects} />}
        {view === 'staging' && <StagingQueue projects={projects} onUpdateProject={handleUpdateProject} onDeleteProjects={handleDeleteProjects} onBulkAddProjects={handleBulkAddProjects} />}
        {view === 'sla' && <SLAMasterModule readOnly={!permissions.canUpdateSLA} />}
        {view === 'scrum' && <ScrumDashboard projects={projects} />}
        {view === 'campaignOps' && <CampaignOpsDashboard projects={projects} />}
        {view === 'deploymentCalendar' && <DeploymentCalendar projects={projects} />}
        {view === 'resourceLoading' && <ResourceLoading projects={projects} />}
        {view === 'admin' && permissions.canAccessAdminPanel && <AdminPanel />}
      </main>

      {/* LOGIN / ROLE SWITCHING MODAL */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <DropdownProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </DropdownProvider>
  );
}

export default App;
