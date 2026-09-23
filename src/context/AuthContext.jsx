import React, { createContext, useContext, useState, useEffect } from 'react';
import { ALL_RESOURCES } from '../constants';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'Admin',
  SPOC: 'SPOC',
  CAMPAIGN_OPS: 'Campaign Ops',
  VIEWER: 'Viewer'
};

export const DEFAULT_GROUP_DEFINITIONS = {
  'Admin': {
    name: 'Admin',
    description: 'Super Admin with full unrestricted access to all modules and configurations',
    isDefault: true,
    permissions: {
      canLogProjects: true,
      canViewProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
      canUpdateSLA: true,
      canViewSLA: true,
      canAccessScrum: true,
      canAccessCampaignOps: true,
      canAccessCalendar: true,
      canAccessResourceLoading: true,
      canAccessAdminPanel: true
    }
  },
  'SPOC': {
    name: 'SPOC',
    description: 'Single Point of Contact / Lead with project logging, editing, and SLA management permissions',
    isDefault: true,
    permissions: {
      canLogProjects: true,
      canViewProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
      canUpdateSLA: true,
      canViewSLA: true,
      canAccessScrum: true,
      canAccessCampaignOps: true,
      canAccessCalendar: true,
      canAccessResourceLoading: true,
      canAccessAdminPanel: false
    }
  },
  'Campaign Ops': {
    name: 'Campaign Ops',
    description: 'Campaign Operations member with project editing, dashboards, and read-only SLA access',
    isDefault: true,
    permissions: {
      canLogProjects: false,
      canViewProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
      canUpdateSLA: false,
      canViewSLA: true,
      canAccessScrum: true,
      canAccessCampaignOps: true,
      canAccessCalendar: true,
      canAccessResourceLoading: true,
      canAccessAdminPanel: false
    }
  },
  'Viewer': {
    name: 'Viewer',
    description: 'Read-only access across project dashboards, Scrum board, calendar, and resource loading',
    isDefault: true,
    permissions: {
      canLogProjects: false,
      canViewProjects: true,
      canEditProjects: false,
      canDeleteProjects: false,
      canUpdateSLA: false,
      canViewSLA: true,
      canAccessScrum: true,
      canAccessCampaignOps: true,
      canAccessCalendar: true,
      canAccessResourceLoading: true,
      canAccessAdminPanel: false
    }
  }
};

const DEFAULT_USER_ROLES = {
  'Subhasri': 'SPOC',
  'Indrajit': 'SPOC',
  'Jagadesh': 'SPOC',
  'System Admin': 'Admin',
  'Admin': 'Admin'
};

export const AuthProvider = ({ children }) => {
  // Load group definitions (defaults + custom groups)
  const [groupDefinitions, setGroupDefinitions] = useState(() => {
    const saved = localStorage.getItem('wf_group_definitions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_GROUP_DEFINITIONS;
  });

  // Load user role assignments
  const [userRoles, setUserRoles] = useState(() => {
    const saved = localStorage.getItem('wf_user_roles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_USER_ROLES;
  });

  // Current logged in user session
  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem('wf_user_session');
    if (savedSession) {
      try { return JSON.parse(savedSession); } catch (e) {}
    }
    return {
      name: 'System Admin',
      email: 'admin@company.com',
      role: 'Admin',
      team: 'Management'
    };
  });

  // Persist group definitions
  useEffect(() => {
    localStorage.setItem('wf_group_definitions', JSON.stringify(groupDefinitions));
  }, [groupDefinitions]);

  // Persist user roles
  useEffect(() => {
    localStorage.setItem('wf_user_roles', JSON.stringify(userRoles));
  }, [userRoles]);

  // Persist current session
  useEffect(() => {
    localStorage.setItem('wf_user_session', JSON.stringify(currentUser));
  }, [currentUser]);

  // Login handler
  const login = (userName, roleOverride = null) => {
    const role = roleOverride || userRoles[userName] || 'Campaign Ops';
    const userObj = {
      name: userName,
      email: `${userName.toLowerCase().replace(/\s+/g, '')}@company.com`,
      role,
      team: 'Operations'
    };
    setCurrentUser(userObj);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Update a team member's assigned role group
  const updateUserRole = (userName, newRole) => {
    setUserRoles(prev => ({
      ...prev,
      [userName]: newRole
    }));

    if (currentUser && currentUser.name === userName) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
  };

  // Create or Update a User Group with specific module accesses
  const saveGroupDefinition = (groupName, description, permissionsData, isDefault = false) => {
    setGroupDefinitions(prev => ({
      ...prev,
      [groupName]: {
        name: groupName,
        description,
        isDefault: prev[groupName] ? prev[groupName].isDefault : isDefault,
        permissions: permissionsData
      }
    }));
  };

  // Delete a custom user group
  const deleteGroupDefinition = (groupName) => {
    if (DEFAULT_GROUP_DEFINITIONS[groupName]) {
      alert("Default system groups cannot be deleted, but their permissions can be edited!");
      return false;
    }

    setGroupDefinitions(prev => {
      const updated = { ...prev };
      delete updated[groupName];
      return updated;
    });

    // Reset users assigned to this group back to Campaign Ops
    setUserRoles(prev => {
      const updatedRoles = { ...prev };
      Object.keys(updatedRoles).forEach(user => {
        if (updatedRoles[user] === groupName) {
          updatedRoles[user] = 'Campaign Ops';
        }
      });
      return updatedRoles;
    });

    return true;
  };

  // Dynamic permission resolver based on current user group
  const activeRoleName = currentUser?.role || 'Viewer';
  const activeGroup = groupDefinitions[activeRoleName] || DEFAULT_GROUP_DEFINITIONS['Viewer'];
  const permissions = activeGroup.permissions;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRoles,
      groupDefinitions,
      login,
      logout,
      updateUserRole,
      saveGroupDefinition,
      deleteGroupDefinition,
      permissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
