import React, { useState, useRef } from 'react';
import { 
  Sliders, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X, RotateCcw, 
  Download, Upload, Users, Building, Tag, AlertCircle, Layers, ListChecks, CheckCircle2, ShieldCheck, UserCheck, ShieldAlert, Save, KeyRound, Database,
  Zap, History, Sparkles
} from 'lucide-react';
import { useDropdowns, ROLE_LABELS, DEFAULT_ROLE_ROUTING_RULES } from '../context/DropdownContext';
import { useAuth } from '../context/AuthContext';
import { ALL_RESOURCES } from '../constants';
import DatabaseAdmin from './DatabaseAdmin';
import './AdminPanel.css';

const MODULE_PERMISSIONS_LIST = [
  { key: 'canLogProjects', label: 'Log Projects (Form)', category: 'Projects' },
  { key: 'canViewProjects', label: 'View Projects (Grid)', category: 'Projects' },
  { key: 'canEditProjects', label: 'Edit Projects', category: 'Projects' },
  { key: 'canDeleteProjects', label: 'Delete Projects / Clear All', category: 'Projects' },
  { key: 'canUpdateSLA', label: 'Update SLA Master', category: 'SLA' },
  { key: 'canViewSLA', label: 'View SLA Master', category: 'SLA' },
  { key: 'canAccessScrum', label: 'Scrum Board', category: 'Dashboards' },
  { key: 'canAccessCampaignOps', label: 'Campaign Ops Dashboard', category: 'Dashboards' },
  { key: 'canAccessCalendar', label: 'Deployment Calendar', category: 'Dashboards' },
  { key: 'canAccessResourceLoading', label: 'Resource Loading', category: 'Dashboards' },
  { key: 'canAccessAdminPanel', label: 'Admin Panel Access', category: 'Admin' }
];

export default function AdminPanel() {
  const {
    options,
    addOption,
    editOption,
    deleteOption,
    reorderOption,
    addTeamMember,
    editTeamMember,
    deleteTeamMember,
    reorderTeamMember,
    resetCategory,
    resetAllDefaults,
    exportOptionsJSON,
    importOptionsJSON,
    updateAutoAssignRules,
    addSkillToResource,
    removeSkillFromResource
  } = useDropdowns();

  const { 
    userProfiles = {}, 
    saveUserProfile, 
    toggleDisableUser, 
    userRoles, 
    updateUserRole, 
    groupDefinitions, 
    saveGroupDefinition, 
    deleteGroupDefinition 
  } = useAuth();

  // Profile Edit Drawer State
  const [profileModalState, setProfileModalState] = useState({
    isOpen: false,
    name: '',
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    dob: '',
    secretQuestion: '',
    secretAnswer: '',
    role: 'Campaign Ops',
    status: 'Active'
  });

  const [activeTab, setActiveTab] = useState('databaseAdmin'); // 'databaseAdmin', 'userGroups', 'userAccess', etc.
  const [newInput, setNewInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Auto-Assignment & Skill State
  const [skillRoleKey, setSkillRoleKey] = useState('emailDeveloper');
  const [newSkillInputs, setNewSkillInputs] = useState({});

  // Group Editing State
  const [selectedGroupToEdit, setSelectedGroupToEdit] = useState('Admin');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPermissions, setGroupPermissions] = useState(groupDefinitions['Admin']?.permissions || {});

  // Team Member active sub-role tab
  const [activeRoleKey, setActiveRoleKey] = useState('emailDeveloper');

  const fileInputRef = useRef(null);

  const CATEGORIES = [
    { key: 'databaseAdmin', label: 'DB Backup, Memory & Archival', icon: Database },
    { key: 'userGroups', label: 'User Groups & Module Access', icon: KeyRound },
    { key: 'userAccess', label: 'User Credentials & Access Roles', icon: ShieldCheck },
    { key: 'teamMembers', label: 'Team Members Directory & Security Profiles', icon: Users },
    { key: 'autoAssignRules', label: 'Auto-Assignment Rules & Resource Skills', icon: Sliders },
    { key: 'lob', label: 'Line of Business', icon: Building, optionKey: 'lobOptions' },
    { key: 'campaignType', label: 'Type of Campaign', icon: Tag, optionKey: 'campaignTypeOptions' },
    { key: 'priority', label: 'Priority', icon: AlertCircle, optionKey: 'priorityOptions' },
    { key: 'typeOfRequest', label: 'Type of Request', icon: Layers, optionKey: 'typeOfRequestOptions' },
    { key: 'taskComplexity', label: 'Task Complexity', icon: ListChecks, optionKey: 'taskComplexityOptions' },
    { key: 'status', label: 'Status', icon: CheckCircle2, optionKey: 'statusOptions' }
  ];

  const currentCategory = CATEGORIES.find(c => c.key === activeTab);

  // Group selection for editing
  const handleSelectGroup = (groupName) => {
    setSelectedGroupToEdit(groupName);
    setIsCreatingNewGroup(false);
    const grp = groupDefinitions[groupName];
    if (grp) {
      setGroupDescription(grp.description || '');
      setGroupPermissions(grp.permissions || {});
    }
  };

  const handleStartCreateGroup = () => {
    setIsCreatingNewGroup(true);
    setNewGroupName('');
    setGroupDescription('');
    const defaultPerms = {};
    MODULE_PERMISSIONS_LIST.forEach(m => defaultPerms[m.key] = false);
    defaultPerms.canViewProjects = true;
    setGroupPermissions(defaultPerms);
  };

  const handleTogglePermission = (permKey) => {
    setGroupPermissions(prev => ({
      ...prev,
      [permKey]: !prev[permKey]
    }));
  };

  const handleSaveGroup = (e) => {
    e.preventDefault();
    const nameToSave = isCreatingNewGroup ? newGroupName.trim() : selectedGroupToEdit;

    if (!nameToSave) {
      alert("Please provide a valid user group name.");
      return;
    }

    saveGroupDefinition(nameToSave, groupDescription, groupPermissions);
    setSelectedGroupToEdit(nameToSave);
    setIsCreatingNewGroup(false);
    alert(`User Group "${nameToSave}" permissions saved successfully!`);
  };

  const handleDeleteGroup = (groupName) => {
    if (window.confirm(`Are you sure you want to delete the user group "${groupName}"?`)) {
      if (deleteGroupDefinition(groupName)) {
        const remaining = Object.keys(groupDefinitions).filter(g => g !== groupName);
        setSelectedGroupToEdit(remaining[0] || 'Admin');
        handleSelectGroup(remaining[0] || 'Admin');
      }
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newInput.trim()) return;

    let success = false;
    if (activeTab === 'teamMembers') {
      success = addTeamMember(activeRoleKey, newInput);
    } else {
      success = addOption(currentCategory.optionKey, newInput);
    }

    if (success) {
      setNewInput('');
    } else {
      alert('This option already exists or is invalid.');
    }
  };

  const handleStartEdit = (index, currentText) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const handleSaveEdit = (index) => {
    if (!editingText.trim()) return;
    let success = false;

    if (activeTab === 'teamMembers') {
      success = editTeamMember(activeRoleKey, index, editingText);
    } else {
      success = editOption(currentCategory.optionKey, index, editingText);
    }

    if (success) {
      setEditingIndex(null);
      setEditingText('');
    } else {
      alert('Failed to edit. Invalid value or duplicate.');
    }
  };

  const handleDelete = (index, label) => {
    if (window.confirm(`Are you sure you want to delete "${label}"?`)) {
      if (activeTab === 'teamMembers') {
        deleteTeamMember(activeRoleKey, index);
      } else {
        deleteOption(currentCategory.optionKey, index);
      }
    }
  };

  const handleReorder = (index, direction) => {
    if (activeTab === 'teamMembers') {
      reorderTeamMember(activeRoleKey, index, direction);
    } else {
      reorderOption(currentCategory.optionKey, index, direction);
    }
  };

  const handleResetCurrent = () => {
    if (activeTab === 'teamMembers' || activeTab === 'userGroups' || activeTab === 'databaseAdmin') return;
    if (window.confirm(`Reset "${currentCategory.label}" to default fallback options?`)) {
      resetCategory(currentCategory.optionKey);
    }
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset ALL dropdown options and team member lists to default values? Custom edits will be overwritten.')) {
      resetAllDefaults();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content) {
        const result = importOptionsJSON(content);
        if (result.success) {
          alert('Options and team members imported successfully!');
        } else {
          alert(`Import failed: ${result.error}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderUserGroupsSection = () => {
    const availableGroupNames = Object.keys(groupDefinitions);
    const activeGroupObj = groupDefinitions[selectedGroupToEdit] || {};

    return (
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>User Groups & Module Access Control</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Create new user groups or edit existing group module access permissions</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleStartCreateGroup}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> Create New User Group
          </button>
        </div>

        {/* GROUP SELECTOR PILLS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {availableGroupNames.map(gName => (
            <button
              key={gName}
              type="button"
              onClick={() => handleSelectGroup(gName)}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: (!isCreatingNewGroup && selectedGroupToEdit === gName) ? '#818cf8' : '#334155',
                background: (!isCreatingNewGroup && selectedGroupToEdit === gName) ? 'rgba(99, 102, 241, 0.2)' : '#0f172a',
                color: (!isCreatingNewGroup && selectedGroupToEdit === gName) ? '#818cf8' : '#94a3b8',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <KeyRound size={16} />
              {gName} {groupDefinitions[gName]?.isDefault && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(Default)</span>}
            </button>
          ))}
        </div>

        {/* EDIT / CREATE GROUP FORM */}
        <form onSubmit={handleSaveGroup} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', pb: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={20} />
              {isCreatingNewGroup ? 'Create New User Group' : `Edit Permissions for "${selectedGroupToEdit}"`}
            </h4>
            {!isCreatingNewGroup && !activeGroupObj.isDefault && (
              <button
                type="button"
                className="btn-text-sm danger"
                onClick={() => handleDeleteGroup(selectedGroupToEdit)}
                style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Trash2 size={15} /> Delete Group
              </button>
            )}
          </div>

          {isCreatingNewGroup ? (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: '600' }}>
                Group Name (Required)
              </label>
              <input
                type="text"
                placeholder="e.g. QA Manager, External Partner..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
              />
            </div>
          ) : null}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: '600' }}>
              Group Description / Role Notes
            </label>
            <input
              type="text"
              placeholder="Describe access responsibilities..."
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#ffffff', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', color: '#818cf8', marginBottom: '0.75rem', fontWeight: '700' }}>
              Module & Page Access Permissions:
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {MODULE_PERMISSIONS_LIST.map(perm => {
                const isChecked = !!groupPermissions[perm.key];
                return (
                  <label
                    key={perm.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem 1rem',
                      background: isChecked ? 'rgba(99, 102, 241, 0.12)' : '#1e293b',
                      border: '1px solid',
                      borderColor: isChecked ? '#818cf8' : '#334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePermission(perm.key)}
                      style={{ width: '17px', height: '17px', accentColor: '#6366f1', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isChecked ? '#ffffff' : '#94a3b8' }}>
                        {perm.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Category: {perm.category}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {isCreatingNewGroup && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleSelectGroup('Admin')}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              <Save size={18} /> Save Group Permissions
            </button>
          </div>
        </form>
      </div>
    );
  };

  const handleOpenCreateProfile = (defaultSubRoleKey = 'emailDeveloper') => {
    setProfileModalState({
      isOpen: true,
      isNew: true,
      name: '',
      username: '',
      password: 'password123',
      email: '',
      firstName: '',
      lastName: '',
      dob: '1995-01-01',
      secretQuestion: 'What is your favorite campaign tool?',
      secretAnswer: '',
      subRoleKey: defaultSubRoleKey,
      role: 'Campaign Ops',
      status: 'Active'
    });
  };

  const handleOpenEditProfile = (name, subRoleKey = null) => {
    const prof = userProfiles[name] || {};
    const role = userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops');
    setProfileModalState({
      isOpen: true,
      isNew: false,
      name,
      username: prof.username || name.toLowerCase().replace(/\s+/g, ''),
      password: prof.password || 'password123',
      email: prof.email || `${name.toLowerCase().replace(/\s+/g, '')}@company.com`,
      firstName: prof.firstName || name.split(' ')[0],
      lastName: prof.lastName || name.split(' ')[1] || '',
      dob: prof.dob || '1995-01-01',
      secretQuestion: prof.secretQuestion || 'What is your favorite campaign tool?',
      secretAnswer: prof.secretAnswer || 'Workfront',
      subRoleKey: subRoleKey || activeRoleKey || 'emailDeveloper',
      role,
      status: prof.status || 'Active'
    });
  };

  const handleSaveProfileForm = (e) => {
    e.preventDefault();
    const { name, role, subRoleKey, isNew, firstName, lastName, ...profileData } = profileModalState;
    const fullName = (name || `${firstName || ''} ${lastName || ''}`).trim();

    if (!fullName) {
      alert('Please enter a team member name.');
      return;
    }

    if (isNew) {
      // Add member to team directory pool
      addTeamMember(subRoleKey || activeRoleKey || 'emailDeveloper', fullName);
    }

    if (saveUserProfile) {
      saveUserProfile({
        name: fullName,
        firstName,
        lastName,
        ...profileData
      });
    }

    if (updateUserRole) {
      updateUserRole(fullName, role);
    }

    setProfileModalState(prev => ({ ...prev, isOpen: false }));
    alert(`Team Member "${fullName}" ${isNew ? 'added' : 'updated'} successfully with full security profile!`);
  };

  const renderUserAccessTable = () => {
    const allUsers = ['System Admin', ...ALL_RESOURCES];
    const filteredUsers = allUsers.filter(u => u.toLowerCase().includes(userSearchTerm.toLowerCase()));
    const groupNamesList = Object.keys(groupDefinitions);

    return (
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Team Member Directory & Security Profiles</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Edit credentials, usernames, passwords, secret questions, DOB, and toggle account enable/disable status</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="action-btn primary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => handleOpenCreateProfile('emailDeveloper')}
            >
              <Plus size={16} /> Add New Team Member
            </button>
            <input
              type="text"
              placeholder="Search team member..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                width: '220px'
              }}
            />
          </div>
        </div>

        <div className="admin-list">
          {filteredUsers.map(name => {
            const currentRole = userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops');
            const profile = userProfiles[name] || {};
            const isDisabled = profile.status === 'Disabled';

            return (
              <div key={name} className="admin-item" style={{ padding: '0.85rem 1.1rem', opacity: isDisabled ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserCheck size={18} color={isDisabled ? '#ef4444' : '#818cf8'} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.95rem' }}>{name}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        background: isDisabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isDisabled ? '#ef4444' : '#34d399',
                        border: `1px solid ${isDisabled ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                      }}>
                        {isDisabled ? 'Disabled (Soft-Deleted)' : 'Active'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      @{profile.username || name.toLowerCase().replace(/\s+/g, '')} • {profile.email || `${name.toLowerCase().replace(/\s+/g, '')}@company.com`} {profile.dob ? `• 📅 DOB: ${profile.dob}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <select
                    value={currentRole}
                    onChange={(e) => updateUserRole(name, e.target.value)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      background: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: currentRole === 'Admin' ? '#818cf8' : (currentRole === 'SPOC' ? '#38bdf8' : '#34d399'),
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {groupNamesList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <button
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => handleOpenEditProfile(name)}
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>

                  <button
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isDisabled ? '#10b981' : '#ef4444',
                      background: isDisabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isDisabled ? '#34d399' : '#f87171'
                    }}
                    onClick={() => toggleDisableUser && toggleDisableUser(name)}
                  >
                    {isDisabled ? 'Enable User' : 'Disable (Soft Delete)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CREATE / EDIT USER PROFILE MODAL */}
        {profileModalState.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content glass-card" style={{ maxWidth: '580px', width: '92%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', pb: '0.75rem' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {profileModalState.isNew ? '➕ Add New Team Member Profile' : `✏️ Edit Profile: ${profileModalState.name}`}
                </h3>
                <button
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
                  onClick={() => setProfileModalState(prev => ({ ...prev, isOpen: false }))}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfileForm} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {profileModalState.isNew && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Member Full Name / Display Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Subhasri Ramasamy"
                        value={profileModalState.name}
                        onChange={e => setProfileModalState(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Sub-Team Pool Role *</label>
                      <select
                        className="form-control"
                        value={profileModalState.subRoleKey}
                        onChange={e => setProfileModalState(prev => ({ ...prev, subRoleKey: e.target.value }))}
                      >
                        {Object.keys(ROLE_LABELS).map(roleKey => (
                          <option key={roleKey} value={roleKey}>{ROLE_LABELS[roleKey]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. subhasri"
                      value={profileModalState.username}
                      onChange={e => setProfileModalState(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={profileModalState.password}
                      onChange={e => setProfileModalState(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="First Name"
                      value={profileModalState.firstName}
                      onChange={e => setProfileModalState(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Last Name"
                      value={profileModalState.lastName}
                      onChange={e => setProfileModalState(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="name@company.com"
                      value={profileModalState.email}
                      onChange={e => setProfileModalState(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Date of Birth (DOB)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={profileModalState.dob}
                      onChange={e => setProfileModalState(prev => ({ ...prev, dob: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Secret Security Question (Password Recovery) *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileModalState.secretQuestion}
                    onChange={e => setProfileModalState(prev => ({ ...prev, secretQuestion: e.target.value }))}
                    placeholder="e.g. What is your favorite campaign tool?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Secret Security Answer *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profileModalState.secretAnswer}
                    onChange={e => setProfileModalState(prev => ({ ...prev, secretAnswer: e.target.value }))}
                    placeholder="Answer to secret question..."
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>User System Access Group</label>
                    <select
                      className="form-control"
                      value={profileModalState.role}
                      onChange={e => setProfileModalState(prev => ({ ...prev, role: e.target.value }))}
                    >
                      {groupNamesList.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Status</label>
                    <select
                      className="form-control"
                      value={profileModalState.status}
                      onChange={e => setProfileModalState(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled (Soft Deleted)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="action-btn secondary"
                    onClick={() => setProfileModalState(prev => ({ ...prev, isOpen: false }))}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="action-btn primary"
                  >
                    {profileModalState.isNew ? 'Save New Member Profile' : 'Update User Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAutoAssignRulesSection = () => {
    const rules = options.autoAssignRules || {};
    const resourceSkills = options.resourceSkills || {};
    const teamMembers = options.teamMembers || {};
    const currentMembers = teamMembers[skillRoleKey] || [];

    const handleAddSkill = (resName) => {
      const val = newSkillInputs[resName]?.trim();
      if (val) {
        addSkillToResource(resName, val);
        setNewSkillInputs(prev => ({ ...prev, [resName]: '' }));
      }
    };

    return (
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* RULE CONFIGURATION CARDS */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Sliders size={20} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Auto-Assignment Rule Configuration</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Rule 1: History Priority */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <History size={16} color="#38bdf8" /> Prior History Priority
                  </span>
                  <input
                    type="checkbox"
                    checked={rules.enablePastHistoryPriority !== false}
                    onChange={(e) => updateAutoAssignRules({ enablePastHistoryPriority: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                  Prioritizes team members who have previously completed projects for the same <strong>Requester</strong>, <strong>LOB</strong>, or <strong>Campaign Type</strong>.
                </p>
              </div>
            </div>

            {/* Rule 2: Skill Matching */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={16} color="#a855f7" /> Skill Matching Engine
                  </span>
                  <input
                    type="checkbox"
                    checked={rules.enableSkillMatching !== false}
                    onChange={(e) => updateAutoAssignRules({ enableSkillMatching: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                  Enforces matching member skillsets (e.g. AMPScript, SFMC, QA Validation) to request requirements.
                </p>
              </div>
            </div>

            {/* Rule 3: Max Rush Requests Cap */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <ShieldAlert size={16} color="#ef4444" /> Max Rush Requests Cap
              </span>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Skip resource if currently working on <strong>Rush / Urgent</strong> active projects.
              </p>
              <select
                value={rules.maxRushRequestsPerPerson !== undefined ? rules.maxRushRequestsPerPerson : 1}
                onChange={(e) => updateAutoAssignRules({ maxRushRequestsPerPerson: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <option value={1}>Max 1 Rush Request (Default)</option>
                <option value={2}>Max 2 Rush Requests</option>
                <option value={0}>Disabled (No Limit)</option>
              </select>
            </div>

            {/* Rule 4: Max Complex Requests Cap */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                <ListChecks size={16} color="#f59e0b" /> Max Complex Requests Cap
              </span>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Skip resource if currently working on <strong>Complex / Custom</strong> active projects.
              </p>
              <select
                value={rules.maxComplexRequestsPerPerson !== undefined ? rules.maxComplexRequestsPerPerson : 2}
                onChange={(e) => updateAutoAssignRules({ maxComplexRequestsPerPerson: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem',
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                <option value={2}>Max 2 Complex Requests (Default)</option>
                <option value={1}>Max 1 Complex Request</option>
                <option value={3}>Max 3 Complex Requests</option>
                <option value={0}>Disabled (No Limit)</option>
              </select>
            </div>
          </div>
        </div>

        {/* CAMPAIGN & REQUEST TYPE ROLE ROUTING MATRIX */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} color="#a855f7" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Campaign & Request Type Role Routing Matrix</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Enable Matrix Routing:</span>
              <input
                type="checkbox"
                checked={rules.enableRoleRouting !== false}
                onChange={(e) => updateAutoAssignRules({ enableRoleRouting: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
              />
            </div>
          </div>

          <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Determines which specific roles get auto-assigned based on the selected <strong>Campaign Type</strong> and <strong>Type of Request</strong>. Unrequired roles are automatically left empty.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DEFAULT_ROLE_ROUTING_RULES.map(ruleItem => (
              <div key={ruleItem.id} style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                    {ruleItem.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '1rem' }}>
                    <span>Campaign: <strong style={{ color: '#38bdf8' }}>{ruleItem.campaignType}</strong></span>
                    <span>Requests: <strong style={{ color: '#a855f7' }}>{Array.isArray(ruleItem.typeOfRequest) ? ruleItem.typeOfRequest.join(', ') : ruleItem.typeOfRequest}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {ruleItem.rolesRequired.map(rKey => (
                    <span key={rKey} style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px'
                    }}>
                      {ROLE_LABELS[rKey] || rKey}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RESOURCE SKILLS DIRECTORY */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.25rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={20} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Resource Skills Matrix & Tracking</h3>
            </div>
          </div>

          {/* Sub-role Role Tabs */}
          <div className="admin-subroles-bar" style={{ marginBottom: '1.25rem' }}>
            {Object.keys(ROLE_LABELS).map(roleKey => (
              <button
                key={roleKey}
                className={`admin-subrole-btn ${skillRoleKey === roleKey ? 'active' : ''}`}
                onClick={() => setSkillRoleKey(roleKey)}
              >
                {ROLE_LABELS[roleKey]} ({teamMembers[roleKey]?.length || 0})
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {currentMembers.map(resName => {
              const skills = resourceSkills[resName] || [];
              const currInputValue = newSkillInputs[resName] || '';

              return (
                <div key={resName} style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={18} color="#818cf8" />
                      <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.98rem' }}>{resName}</span>
                      <span style={{ fontSize: '0.75rem', background: '#334155', color: '#cbd5e1', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                        {ROLE_LABELS[skillRoleKey]}
                      </span>
                    </div>
                  </div>

                  {/* Skills Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    {skills.map((s, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(99, 102, 241, 0.18)',
                        border: '1px solid rgba(129, 140, 248, 0.4)',
                        color: '#c7d2fe',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        {s}
                        <X
                          size={12}
                          style={{ cursor: 'pointer', color: '#a5b4fc' }}
                          onClick={() => removeSkillFromResource(resName, s)}
                        />
                      </span>
                    ))}

                    {/* Add Skill Inline Form */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="text"
                        placeholder="+ Add skill..."
                        value={currInputValue}
                        onChange={(e) => setNewSkillInputs(prev => ({ ...prev, [resName]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill(resName);
                          }
                        }}
                        style={{
                          padding: '0.25rem 0.6rem',
                          background: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          width: '130px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkill(resName)}
                        style={{
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTeamMembersSection = () => {
    const teamMembersMap = options.teamMembers || {};
    const currentMembers = teamMembersMap[activeRoleKey] || [];
    const filteredMembers = currentMembers.filter(m => m.toLowerCase().includes(userSearchTerm.toLowerCase()));

    return (
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff' }}>Team Members Directory & Security Profiles</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Manage team credentials, username, password, email, date of birth, and secret security questions & answers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleOpenCreateProfile(activeRoleKey)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem' }}
            >
              <Plus size={18} /> ➕ Add New Member with Credentials
            </button>
            <input
              type="text"
              placeholder="Search member in pool..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem',
                width: '210px'
              }}
            />
          </div>
        </div>

        {/* SUB-ROLES PICKER */}
        <div className="admin-subroles-bar" style={{ marginBottom: '1.25rem' }}>
          {Object.keys(ROLE_LABELS).map(roleKey => (
            <button
              key={roleKey}
              className={`admin-subrole-btn ${activeRoleKey === roleKey ? 'active' : ''}`}
              onClick={() => {
                setActiveRoleKey(roleKey);
                setEditingIndex(null);
                setNewInput('');
              }}
            >
              {ROLE_LABELS[roleKey]} ({teamMembersMap[roleKey]?.length || 0})
            </button>
          ))}
        </div>

        {/* TEAM MEMBER PROFILE CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredMembers.length === 0 ? (
            <div className="admin-empty-state" style={{ background: '#0f172a', padding: '2rem', borderRadius: '10px', textAlign: 'center', border: '1px solid #334155' }}>
              No team members registered under {ROLE_LABELS[activeRoleKey]} yet. Click "➕ Add New Member with Credentials" above!
            </div>
          ) : (
            filteredMembers.map((name, index) => {
              const profile = userProfiles[name] || {};
              const isDisabled = profile.status === 'Disabled';
              const currentRole = userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops');

              return (
                <div key={name} className="admin-item" style={{ padding: '1rem 1.25rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', opacity: isDisabled ? 0.65 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <UserCheck size={22} color={isDisabled ? '#ef4444' : '#818cf8'} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: '700', color: '#f8fafc', fontSize: '1rem' }}>
                          {profile.firstName || profile.lastName ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : name}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: '6px' }}>
                          ({name})
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          background: isDisabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isDisabled ? '#ef4444' : '#34d399',
                          border: `1px solid ${isDisabled ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                        }}>
                          {isDisabled ? 'Disabled (Soft-Deleted)' : 'Active'}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.4)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                          Role: {currentRole}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        <span>👤 <strong>User Name:</strong> <code style={{ color: '#38bdf8' }}>@{profile.username || name.toLowerCase().replace(/\s+/g, '')}</code></span>
                        <span>🔑 <strong>Password:</strong> <code style={{ color: '#a855f7' }}>{profile.password ? profile.password : 'password123'}</code></span>
                        <span>✉️ <strong>Email:</strong> {profile.email || `${name.toLowerCase().replace(/\s+/g, '')}@company.com`}</span>
                        {profile.dob && <span>📅 <strong>DOB:</strong> {profile.dob}</span>}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        ❓ <strong>Secret Question:</strong> "{profile.secretQuestion || 'What is your favorite campaign tool?'}" • <strong>Answer:</strong> "{profile.secretAnswer || 'Workfront'}"
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => handleOpenEditProfile(name, activeRoleKey)}
                    >
                      <Edit2 size={14} /> Edit Credentials & Profile
                    </button>

                    <button
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isDisabled ? '#10b981' : '#ef4444',
                        background: isDisabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isDisabled ? '#34d399' : '#f87171'
                      }}
                      onClick={() => toggleDisableUser && toggleDisableUser(name)}
                    >
                      {isDisabled ? 'Enable' : 'Disable'}
                    </button>

                    <button
                      className="btn-icon-sm delete"
                      onClick={() => handleDelete(index, name)}
                      title="Delete Member from Pool"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderItemList = () => {
    if (activeTab === 'databaseAdmin') {
      return <DatabaseAdmin />;
    }
    if (activeTab === 'userGroups') {
      return renderUserGroupsSection();
    }
    if (activeTab === 'userAccess') {
      return renderUserAccessTable();
    }
    if (activeTab === 'autoAssignRules') {
      return renderAutoAssignRulesSection();
    }
    if (activeTab === 'teamMembers') {
      return renderTeamMembersSection();
    }

    const itemList = getListForCurrentTab();

    return (
      <div className="admin-list">
        {itemList.length === 0 ? (
          <div className="admin-empty-state">
            No items in this category yet. Add one above!
          </div>
        ) : (
          itemList.map((item, index) => {
            const isEditing = editingIndex === index;

            return (
              <div key={index} className="admin-item">
                <div className="admin-item-content">
                  <span className="admin-item-index">{index + 1}.</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="admin-edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="admin-item-label">{item}</span>
                  )}
                </div>

                <div className="admin-item-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-icon-sm success"
                        onClick={() => handleSaveEdit(index)}
                        title="Save Edit"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => setEditingIndex(null)}
                        title="Cancel Edit"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon-sm"
                        onClick={() => handleReorder(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => handleReorder(index, 'down')}
                        disabled={index === itemList.length - 1}
                        title="Move Down"
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="btn-icon-sm"
                        onClick={() => handleStartEdit(index, item)}
                        title="Edit Option"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon-sm delete"
                        onClick={() => handleDelete(index, item)}
                        title="Delete Option"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const getListForCurrentTab = () => {
    if (activeTab === 'teamMembers') {
      return options.teamMembers[activeRoleKey] || [];
    }
    return options[currentCategory?.optionKey] || [];
  };

  return (
    <div className="admin-panel animate-fade-in">
      {/* HEADER */}
      <div className="admin-header">
        <div className="admin-header-title">
          <Sliders color="#818cf8" size={28} />
          <div>
            <h2>Workfront Logger Enterprise Admin Panel</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Manage Database Diagnostics, Period Archival, Backups, User Groups, Dropdown Options, and Team Members
            </div>
          </div>
        </div>

        <div className="admin-header-actions">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Upload size={16} /> Import Config
          </button>
          <button
            className="btn-secondary"
            onClick={exportOptionsJSON}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export Config
          </button>
          <button
            className="btn-secondary danger"
            onClick={handleResetAll}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
          >
            <RotateCcw size={16} /> Reset All
          </button>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="admin-body">
        {/* SIDEBAR TABS */}
        <div className="admin-sidebar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                className={`admin-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(cat.key);
                  setEditingIndex(null);
                  setNewInput('');
                }}
              >
                <Icon size={18} color={isActive ? '#818cf8' : 'var(--text-secondary)'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* MAIN CONFIG AREA */}
        <div className="admin-content">
          <div className="admin-content-header">
            <h3>{currentCategory?.label}</h3>
            {activeTab !== 'databaseAdmin' && activeTab !== 'userGroups' && activeTab !== 'userAccess' && activeTab !== 'autoAssignRules' && activeTab !== 'teamMembers' && (
              <button
                className="btn-text-sm"
                onClick={handleResetCurrent}
                title="Reset this category to default fallback values"
              >
                <RotateCcw size={14} /> Reset Category
              </button>
            )}
          </div>

          {/* TEAM MEMBERS SUB-ROLES PICKER */}
          {activeTab === 'teamMembers' && (
            <div className="admin-subroles-bar">
              {Object.keys(ROLE_LABELS).map(roleKey => (
                <button
                  key={roleKey}
                  className={`admin-subrole-btn ${activeRoleKey === roleKey ? 'active' : ''}`}
                  onClick={() => {
                    setActiveRoleKey(roleKey);
                    setEditingIndex(null);
                    setNewInput('');
                  }}
                >
                  {ROLE_LABELS[roleKey]} ({options.teamMembers[roleKey]?.length || 0})
                </button>
              ))}
            </div>
          )}

          {/* ADD INPUT FORM (Hide on DB Admin, User Groups, User Access & AutoAssign Tabs) */}
          {activeTab !== 'databaseAdmin' && activeTab !== 'userGroups' && activeTab !== 'userAccess' && activeTab !== 'autoAssignRules' && (
            <form onSubmit={handleAdd} className="admin-add-form">
              <input
                type="text"
                placeholder={
                  activeTab === 'teamMembers'
                    ? `Add new ${ROLE_LABELS[activeRoleKey]} member name...`
                    : `Add new ${currentCategory?.label} option...`
                }
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                className="admin-add-input"
              />
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}>
                <Plus size={18} /> Add
              </button>
            </form>
          )}

          {/* ITEM LIST / DB ADMIN / CUSTOM GROUP EDITOR */}
          {renderItemList()}
        </div>
      </div>
    </div>
  );
}
