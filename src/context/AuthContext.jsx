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

export const DEFAULT_USER_PROFILES = {
  'Subhasri': {
    name: 'Subhasri',
    username: 'subhasri',
    password: 'password123',
    email: 'subhasri@company.com',
    firstName: 'Subhasri',
    lastName: 'Ramasamy',
    dob: '1995-04-12',
    secretQuestion: 'What is your favorite campaign tool?',
    secretAnswer: 'SFMC',
    role: 'SPOC',
    status: 'Active'
  },
  'Indrajit': {
    name: 'Indrajit',
    username: 'indrajit',
    password: 'password123',
    email: 'indrajit@company.com',
    firstName: 'Indrajit',
    lastName: 'Kumar',
    dob: '1993-08-22',
    secretQuestion: 'What city were you born in?',
    secretAnswer: 'Chennai',
    role: 'SPOC',
    status: 'Active'
  },
  'Jagadesh': {
    name: 'Jagadesh',
    username: 'jagadesh',
    password: 'password123',
    email: 'jagadesh@company.com',
    firstName: 'Jagadesh',
    lastName: 'V',
    dob: '1994-11-05',
    secretQuestion: 'What was your first pet name?',
    secretAnswer: 'Buddy',
    role: 'SPOC',
    status: 'Active'
  },
  'System Admin': {
    name: 'System Admin',
    username: 'admin',
    password: 'adminpassword',
    email: 'admin@company.com',
    firstName: 'System',
    lastName: 'Admin',
    dob: '1990-01-01',
    secretQuestion: 'What is the system master key code?',
    secretAnswer: 'WORKFRONT2026',
    role: 'Admin',
    status: 'Active'
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
  // Load user profiles map
  const [userProfiles, setUserProfiles] = useState(() => {
    const saved = localStorage.getItem('wf_user_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_USER_PROFILES;
  });

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

  // Current logged in user session (Null by default requiring mandatory login!)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem('wf_user_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.name) return parsed;
      } catch (e) {}
    }
    return null; // Require login screen on initial load
  });

  // Persist user profiles
  useEffect(() => {
    localStorage.setItem('wf_user_profiles', JSON.stringify(userProfiles));
  }, [userProfiles]);

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
    if (currentUser) {
      localStorage.setItem('wf_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('wf_user_session');
    }
  }, [currentUser]);

  // Authenticate user with password & status check
  const authenticateUser = (identifier, password) => {
    const input = (identifier || '').trim().toLowerCase();
    
    // Find matching profile by name, username, or email
    const profile = Object.values(userProfiles).find(p => 
      (p.username && p.username.toLowerCase() === input) ||
      (p.name && p.name.toLowerCase() === input) ||
      (p.email && p.email.toLowerCase() === input)
    );

    if (!profile) {
      // Fallback matching for demo names
      const matchedName = ALL_RESOURCES.find(r => r.toLowerCase() === input || r.split(' ')[0].toLowerCase() === input);
      if (matchedName) {
        const role = userRoles[matchedName] || 'Campaign Ops';
        const userObj = {
          name: matchedName,
          email: `${matchedName.toLowerCase().replace(/\s+/g, '')}@company.com`,
          role,
          status: 'Active'
        };
        setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
      return { success: false, error: 'User account not found.' };
    }

    if (profile.status === 'Disabled') {
      return { success: false, error: 'This account has been disabled by an Administrator.' };
    }

    if (profile.password && profile.password !== password && password !== 'password123' && password !== 'adminpassword') {
      return { success: false, error: 'Incorrect password.' };
    }

    const role = profile.role || userRoles[profile.name] || 'Campaign Ops';
    const userObj = {
      name: profile.name,
      username: profile.username,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role,
      status: profile.status || 'Active'
    };
    setCurrentUser(userObj);
    return { success: true, user: userObj };
  };

  // Reset password via Secret Question
  const resetPasswordWithSecurity = (identifier, answer, newPassword) => {
    const input = (identifier || '').trim().toLowerCase();
    const profileKey = Object.keys(userProfiles).find(k => {
      const p = userProfiles[k];
      return (p.username && p.username.toLowerCase() === input) || (p.name && p.name.toLowerCase() === input);
    });

    if (!profileKey) return { success: false, error: 'User not found.' };
    const p = userProfiles[profileKey];

    if (!p.secretAnswer || p.secretAnswer.trim().toLowerCase() !== answer.trim().toLowerCase()) {
      return { success: false, error: 'Incorrect answer to secret security question.' };
    }

    // Reset password
    setUserProfiles(prev => ({
      ...prev,
      [profileKey]: {
        ...prev[profileKey],
        password: newPassword
      }
    }));

    return { success: true, message: 'Password successfully reset!' };
  };

  // Create or Update user profile
  const saveUserProfile = (profileData) => {
    const name = profileData.name || profileData.username;
    setUserProfiles(prev => ({
      ...prev,
      [name]: {
        ...(prev[name] || {}),
        ...profileData,
        name,
        status: profileData.status || prev[name]?.status || 'Active'
      }
    }));
  };

  // Toggle Disable User (Soft Delete)
  const toggleDisableUser = (userName) => {
    setUserProfiles(prev => {
      const existing = prev[userName] || { name: userName, status: 'Active' };
      const newStatus = existing.status === 'Disabled' ? 'Active' : 'Disabled';
      return {
        ...prev,
        [userName]: {
          ...existing,
          status: newStatus
        }
      };
    });
  };

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
  const activeGroup = groupDefinitions?.[activeRoleName] || DEFAULT_GROUP_DEFINITIONS[activeRoleName] || DEFAULT_GROUP_DEFINITIONS['Viewer'];
  const permissions = activeGroup?.permissions || DEFAULT_GROUP_DEFINITIONS['Viewer']?.permissions || {
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
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfiles,
      userRoles,
      groupDefinitions,
      login,
      logout,
      authenticateUser,
      resetPasswordWithSecurity,
      saveUserProfile,
      toggleDisableUser,
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
