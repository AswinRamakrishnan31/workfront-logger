import React, { useState, useRef } from 'react';
import { 
  Sliders, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X, RotateCcw, 
  Download, Upload, Users, Building, Tag, AlertCircle, Layers, ListChecks, CheckCircle2, ShieldCheck, UserCheck, ShieldAlert, Save, KeyRound, Database
} from 'lucide-react';
import { useDropdowns, ROLE_LABELS } from '../context/DropdownContext';
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
    importOptionsJSON
  } = useDropdowns();

  const { userRoles, updateUserRole, groupDefinitions, saveGroupDefinition, deleteGroupDefinition } = useAuth();

  const [activeTab, setActiveTab] = useState('databaseAdmin'); // 'databaseAdmin', 'userGroups', 'userAccess', etc.
  const [newInput, setNewInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

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
    { key: 'userAccess', label: 'User Role Assignments', icon: ShieldCheck },
    { key: 'lob', label: 'Line of Business', icon: Building, optionKey: 'lobOptions' },
    { key: 'campaignType', label: 'Type of Campaign', icon: Tag, optionKey: 'campaignTypeOptions' },
    { key: 'priority', label: 'Priority', icon: AlertCircle, optionKey: 'priorityOptions' },
    { key: 'typeOfRequest', label: 'Type of Request', icon: Layers, optionKey: 'typeOfRequestOptions' },
    { key: 'taskComplexity', label: 'Task Complexity', icon: ListChecks, optionKey: 'taskComplexityOptions' },
    { key: 'status', label: 'Status', icon: CheckCircle2, optionKey: 'statusOptions' },
    { key: 'teamMembers', label: 'Team Members Directory', icon: Users }
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

  const renderUserAccessTable = () => {
    const allUsers = ['System Admin', ...ALL_RESOURCES];
    const filteredUsers = allUsers.filter(u => u.toLowerCase().includes(userSearchTerm.toLowerCase()));
    const groupNamesList = Object.keys(groupDefinitions);

    return (
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Team Member Access Management</h3>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Assign access roles to team members</span>
          </div>
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
              width: '240px'
            }}
          />
        </div>

        <div className="admin-list">
          {filteredUsers.map(name => {
            const currentRole = userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops');
            return (
              <div key={name} className="admin-item" style={{ padding: '0.85rem 1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserCheck size={18} color="#818cf8" />
                  <div>
                    <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.95rem' }}>{name}</span>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {name.toLowerCase().replace(/\s+/g, '')}@company.com
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                </div>
              </div>
            );
          })}
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
            {activeTab !== 'databaseAdmin' && activeTab !== 'userGroups' && activeTab !== 'userAccess' && activeTab !== 'teamMembers' && (
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

          {/* ADD INPUT FORM (Hide on DB Admin, User Groups & User Access Tabs) */}
          {activeTab !== 'databaseAdmin' && activeTab !== 'userGroups' && activeTab !== 'userAccess' && (
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
