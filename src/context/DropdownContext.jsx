import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// Default Fallback Options
export const DEFAULT_LOB_OPTIONS = [
  'Acquisition',
  'Early Life Comms',
  'Engagement',
  'Onboarding',
  'Retention',
  'Service Comms - Account Management',
  'Service Comms - Loyalty & Retention',
  'Service Comms - Product',
  'Service Comms - Reliability',
  'Upgrade Comms'
];

export const DEFAULT_TYPE_OF_CAMPAIGN_OPTIONS = [
  'Service',
  'Marketing',
  'Issue fixes',
  'CoE'
];

export const DEFAULT_PRIORITY_OPTIONS = [
  'None',
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Critical Business Impact'
];

export const DEFAULT_TYPE_OF_REQUEST_OPTIONS = [
  'Delivery',
  'Delivery + Campaign',
  'Transaction message',
  'CMP Templates',
  'SMS',
  'Push notification',
  'Inapp notification',
  'Workflow',
  'Audience',
  'CoE'
];

export const DEFAULT_TASK_COMPLEXITY_OPTIONS = [
  'Simple Updates',
  'Simple Creation',
  'Services Updates',
  'Medium Updates',
  'Medium Creation',
  'Complex Updates',
  'Complex Creation',
  'Custom'
];

export const DEFAULT_STATUS_OPTIONS = [
  'Yet to be assigned',
  'Yet to Start',
  'Pending from Requester',
  'Pending for Approval',
  'On-Hold',
  'In-Developement',
  'In-QA',
  'In-UAT',
  'In-Pre-Depoyment-Checks',
  'Scheduled',
  'Completed',
  'Deferred'
];

export const DEFAULT_TEAM_MEMBERS = {
  emailDeveloper: ['Subhasri', 'Mohanapriya', 'Sudharsanan', 'Jerrald', 'Meshak', 'Samrajkumar'],
  campaignBuilder: ['Indrajit', 'Ambarish', 'Shankar', 'Gowsalya', 'Dharshan', 'Sivashankar', 'Sathyaleka'],
  emailQA: ['Jagadesh', 'Niranjana'],
  campaignQA: ['Thiyagaraj', 'Suwetha'],
  audience: ['Nandha', 'Preeth'],
  coe: ['Sathya', 'Preetha']
};

export const ROLE_LABELS = {
  emailDeveloper: 'Email Developer',
  campaignBuilder: 'Campaign Builder',
  emailQA: 'Email QA',
  campaignQA: 'Campaign QA',
  audience: 'Audience',
  coe: 'CoE'
};

export const DEFAULT_ROLE_ROUTING_RULES = [
  {
    id: 'rule_service',
    name: 'Service Campaigns Routing',
    campaignType: 'Service',
    typeOfRequest: 'Any Request',
    rolesRequired: ['campaignBuilder', 'emailQA', 'campaignQA'],
    active: true
  },
  {
    id: 'rule_marketing_delivery',
    name: 'Marketing - Delivery & Campaign',
    campaignType: 'Marketing',
    typeOfRequest: ['Delivery', 'Delivery + Campaign'],
    rolesRequired: ['emailDeveloper', 'emailQA', 'campaignBuilder', 'campaignQA'],
    active: true
  },
  {
    id: 'rule_marketing_transactional',
    name: 'Marketing - Transactional & CMP',
    campaignType: 'Marketing',
    typeOfRequest: ['Transaction message', 'CMP Templates'],
    rolesRequired: ['emailDeveloper'],
    active: true
  },
  {
    id: 'rule_marketing_channels',
    name: 'Marketing - SMS, Push, In-App & Workflows',
    campaignType: 'Marketing',
    typeOfRequest: ['SMS', 'Push notification', 'Inapp notification', 'Workflow'],
    rolesRequired: ['campaignBuilder', 'campaignQA'],
    active: true
  },
  {
    id: 'rule_marketing_audience',
    name: 'Marketing - Audience Data',
    campaignType: 'Marketing',
    typeOfRequest: ['Audience'],
    rolesRequired: ['audience'],
    active: true
  },
  {
    id: 'rule_coe',
    name: 'CoE Center of Excellence Routing',
    campaignType: 'CoE',
    typeOfRequest: ['CoE'],
    rolesRequired: ['coe'],
    active: true
  }
];

export const DEFAULT_AUTO_ASSIGN_RULES = {
  enablePastHistoryPriority: true,
  maxRushRequestsPerPerson: 1,
  maxComplexRequestsPerPerson: 2,
  enableSkillMatching: true,
  enableRoleRouting: true,
  roleRoutingRules: DEFAULT_ROLE_ROUTING_RULES,
  weightHistory: 15,
  weightWorkload: 5
};

export const DEFAULT_RESOURCE_SKILLS = {
  'Subhasri': ['HTML/CSS', 'AMPScript', 'SFMC Email Studio', 'Responsive Email'],
  'Mohanapriya': ['HTML/CSS', 'SFMC Email Studio', 'Dynamic Content'],
  'Sudharsanan': ['HTML/CSS', 'AMPScript', 'SQL', 'Interactive Email'],
  'Jerrald': ['HTML/CSS', 'Veeva Email', 'Litmus Testing'],
  'Meshak': ['HTML/CSS', 'AMPScript', 'Dark Mode Email'],
  'Samrajkumar': ['HTML/CSS', 'SFMC Email Studio', 'Automation Studio'],
  'Indrajit': ['SFMC Journey Builder', 'Automation Studio', 'Contact Builder'],
  'Ambarish': ['SFMC Journey Builder', 'SQL Query', 'API Triggered Send'],
  'Shankar': ['SFMC Journey Builder', 'CloudPages', 'Automation Studio'],
  'Gowsalya': ['SFMC Journey Builder', 'Data Extensions', 'Transactional Messaging'],
  'Dharshan': ['SFMC Journey Builder', 'MobilePush', 'In-App Comms'],
  'Sivashankar': ['SFMC Journey Builder', 'SMS Messaging', 'Automation Studio'],
  'Sathyaleka': ['SFMC Journey Builder', 'Analytics Tracking', 'Journey Testing'],
  'Jagadesh': ['Email QA', 'Litmus / Email on Acid', 'Cross-Client Testing', 'Link & Tracking Audit'],
  'Niranjana': ['Email QA', 'Litmus / Email on Acid', 'Accessibility QA', 'HTML Validation'],
  'Thiyagaraj': ['Campaign QA', 'Journey Testing', 'Data Extension QA', 'End-to-End Flow Audit'],
  'Suwetha': ['Campaign QA', 'Journey Testing', 'Audience Segment QA', 'Payload Validation'],
  'Nandha': ['Audience Segmentation', 'SQL Query', 'Data Extension Filtering'],
  'Preeth': ['Audience Segmentation', 'Contact Builder', 'SQL Query'],
  'Sathya': ['CoE Strategy', 'Deliverability Audit', 'Template Architecture'],
  'Preetha': ['CoE Strategy', 'Compliance Audit', 'Governance & Standards']
};

const INITIAL_STATE = {
  lobOptions: DEFAULT_LOB_OPTIONS,
  campaignTypeOptions: DEFAULT_TYPE_OF_CAMPAIGN_OPTIONS,
  priorityOptions: DEFAULT_PRIORITY_OPTIONS,
  typeOfRequestOptions: DEFAULT_TYPE_OF_REQUEST_OPTIONS,
  taskComplexityOptions: DEFAULT_TASK_COMPLEXITY_OPTIONS,
  statusOptions: DEFAULT_STATUS_OPTIONS,
  teamMembers: DEFAULT_TEAM_MEMBERS,
  autoAssignRules: DEFAULT_AUTO_ASSIGN_RULES,
  resourceSkills: DEFAULT_RESOURCE_SKILLS
};

const DropdownContext = createContext();

export function DropdownProvider({ children }) {
  const [options, setOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('wf_dropdown_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          lobOptions: parsed.lobOptions || DEFAULT_LOB_OPTIONS,
          campaignTypeOptions: parsed.campaignTypeOptions || DEFAULT_TYPE_OF_CAMPAIGN_OPTIONS,
          priorityOptions: parsed.priorityOptions || DEFAULT_PRIORITY_OPTIONS,
          typeOfRequestOptions: parsed.typeOfRequestOptions || DEFAULT_TYPE_OF_REQUEST_OPTIONS,
          taskComplexityOptions: parsed.taskComplexityOptions || DEFAULT_TASK_COMPLEXITY_OPTIONS,
          statusOptions: parsed.statusOptions || DEFAULT_STATUS_OPTIONS,
          teamMembers: { ...DEFAULT_TEAM_MEMBERS, ...(parsed.teamMembers || {}) },
          autoAssignRules: { ...DEFAULT_AUTO_ASSIGN_RULES, ...(parsed.autoAssignRules || {}) },
          resourceSkills: { ...DEFAULT_RESOURCE_SKILLS, ...(parsed.resourceSkills || {}) }
        };
      }
    } catch (e) {
      console.error("Error loading dropdown options from localStorage:", e);
    }
    return INITIAL_STATE;
  });

  // Save to localStorage when options change
  useEffect(() => {
    try {
      localStorage.setItem('wf_dropdown_options', JSON.stringify(options));
    } catch (e) {
      console.error("Error saving dropdown options to localStorage:", e);
    }
  }, [options]);

  // Derived resource arrays
  const allResources = useMemo(() => {
    const members = options.teamMembers || DEFAULT_TEAM_MEMBERS;
    return Array.from(new Set([
      ...(members.emailDeveloper || []),
      ...(members.campaignBuilder || []),
      ...(members.emailQA || []),
      ...(members.campaignQA || []),
      ...(members.audience || []),
      ...(members.coe || [])
    ])).sort();
  }, [options.teamMembers]);

  const campaignOpsResources = useMemo(() => {
    const members = options.teamMembers || DEFAULT_TEAM_MEMBERS;
    return Array.from(new Set([
      ...(members.emailDeveloper || []),
      ...(members.campaignBuilder || []),
      ...(members.emailQA || []),
      ...(members.campaignQA || [])
    ])).sort();
  }, [options.teamMembers]);

  const audienceResources = useMemo(() => {
    const members = options.teamMembers || DEFAULT_TEAM_MEMBERS;
    return [...(members.audience || [])].sort();
  }, [options.teamMembers]);

  const coeResources = useMemo(() => {
    const members = options.teamMembers || DEFAULT_TEAM_MEMBERS;
    return [...(members.coe || [])].sort();
  }, [options.teamMembers]);

  // Actions for simple option lists (lobOptions, statusOptions, etc.)
  const addOption = (categoryKey, newItem) => {
    const trimmed = newItem.trim();
    if (!trimmed) return false;
    setOptions(prev => {
      const currentList = prev[categoryKey] || [];
      if (currentList.some(item => item.toLowerCase() === trimmed.toLowerCase())) {
        return prev; // duplicate
      }
      return {
        ...prev,
        [categoryKey]: [...currentList, trimmed]
      };
    });
    return true;
  };

  const editOption = (categoryKey, index, newValue) => {
    const trimmed = newValue.trim();
    if (!trimmed) return false;
    setOptions(prev => {
      const currentList = [...(prev[categoryKey] || [])];
      currentList[index] = trimmed;
      return {
        ...prev,
        [categoryKey]: currentList
      };
    });
    return true;
  };

  const deleteOption = (categoryKey, index) => {
    setOptions(prev => {
      const currentList = [...(prev[categoryKey] || [])];
      currentList.splice(index, 1);
      return {
        ...prev,
        [categoryKey]: currentList
      };
    });
  };

  const reorderOption = (categoryKey, index, direction) => {
    setOptions(prev => {
      const currentList = [...(prev[categoryKey] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentList.length) return prev;
      
      const temp = currentList[index];
      currentList[index] = currentList[targetIndex];
      currentList[targetIndex] = temp;

      return {
        ...prev,
        [categoryKey]: currentList
      };
    });
  };

  // Actions for Team Members by Role
  const addTeamMember = (roleKey, newMember) => {
    const trimmed = newMember.trim();
    if (!trimmed) return false;
    setOptions(prev => {
      const currentMembers = prev.teamMembers[roleKey] || [];
      if (currentMembers.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        teamMembers: {
          ...prev.teamMembers,
          [roleKey]: [...currentMembers, trimmed]
        }
      };
    });
    return true;
  };

  const editTeamMember = (roleKey, index, newValue) => {
    const trimmed = newValue.trim();
    if (!trimmed) return false;
    setOptions(prev => {
      const currentMembers = [...(prev.teamMembers[roleKey] || [])];
      currentMembers[index] = trimmed;
      return {
        ...prev,
        teamMembers: {
          ...prev.teamMembers,
          [roleKey]: currentMembers
        }
      };
    });
    return true;
  };

  const deleteTeamMember = (roleKey, index) => {
    setOptions(prev => {
      const currentMembers = [...(prev.teamMembers[roleKey] || [])];
      currentMembers.splice(index, 1);
      return {
        ...prev,
        teamMembers: {
          ...prev.teamMembers,
          [roleKey]: currentMembers
        }
      };
    });
  };

  const reorderTeamMember = (roleKey, index, direction) => {
    setOptions(prev => {
      const currentMembers = [...(prev.teamMembers[roleKey] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentMembers.length) return prev;

      const temp = currentMembers[index];
      currentMembers[index] = currentMembers[targetIndex];
      currentMembers[targetIndex] = temp;

      return {
        ...prev,
        teamMembers: {
          ...prev.teamMembers,
          [roleKey]: currentMembers
        }
      };
    });
  };

  // Reset category or all defaults
  const resetCategory = (categoryKey) => {
    if (categoryKey === 'teamMembers') {
      setOptions(prev => ({
        ...prev,
        teamMembers: DEFAULT_TEAM_MEMBERS
      }));
    } else if (INITIAL_STATE[categoryKey]) {
      setOptions(prev => ({
        ...prev,
        [categoryKey]: INITIAL_STATE[categoryKey]
      }));
    }
  };

  const resetAllDefaults = () => {
    if (window.confirm("Are you sure you want to reset all dropdown options and team members to default settings?")) {
      setOptions(INITIAL_STATE);
      localStorage.removeItem('wf_dropdown_options');
    }
  };

  // Import / Export JSON
  const exportOptionsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(options, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `workfront_dropdown_options_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importOptionsJSON = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Invalid format");
      }
      setOptions({
        lobOptions: Array.isArray(parsed.lobOptions) ? parsed.lobOptions : DEFAULT_LOB_OPTIONS,
        campaignTypeOptions: Array.isArray(parsed.campaignTypeOptions) ? parsed.campaignTypeOptions : DEFAULT_TYPE_OF_CAMPAIGN_OPTIONS,
        priorityOptions: Array.isArray(parsed.priorityOptions) ? parsed.priorityOptions : DEFAULT_PRIORITY_OPTIONS,
        typeOfRequestOptions: Array.isArray(parsed.typeOfRequestOptions) ? parsed.typeOfRequestOptions : DEFAULT_TYPE_OF_REQUEST_OPTIONS,
        taskComplexityOptions: Array.isArray(parsed.taskComplexityOptions) ? parsed.taskComplexityOptions : DEFAULT_TASK_COMPLEXITY_OPTIONS,
        statusOptions: Array.isArray(parsed.statusOptions) ? parsed.statusOptions : DEFAULT_STATUS_OPTIONS,
        teamMembers: (parsed.teamMembers && typeof parsed.teamMembers === 'object') ? parsed.teamMembers : DEFAULT_TEAM_MEMBERS
      });
      return true;
    } catch (e) {
      alert("Failed to import configuration JSON: " + e.message);
      return false;
    }
  };

  // Auto-Assignment & Resource Skill Helper Actions
  const updateAutoAssignRules = (newRules) => {
    setOptions(prev => ({
      ...prev,
      autoAssignRules: {
        ...(prev.autoAssignRules || DEFAULT_AUTO_ASSIGN_RULES),
        ...newRules
      }
    }));
  };

  const updateResourceSkills = (resourceName, skillsArray) => {
    setOptions(prev => ({
      ...prev,
      resourceSkills: {
        ...(prev.resourceSkills || DEFAULT_RESOURCE_SKILLS),
        [resourceName]: skillsArray
      }
    }));
  };

  const addSkillToResource = (resourceName, skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    setOptions(prev => {
      const currentSkills = prev.resourceSkills?.[resourceName] || [];
      if (currentSkills.includes(trimmed)) return prev;
      return {
        ...prev,
        resourceSkills: {
          ...(prev.resourceSkills || DEFAULT_RESOURCE_SKILLS),
          [resourceName]: [...currentSkills, trimmed]
        }
      };
    });
  };

  const removeSkillFromResource = (resourceName, skill) => {
    setOptions(prev => {
      const currentSkills = prev.resourceSkills?.[resourceName] || [];
      return {
        ...prev,
        resourceSkills: {
          ...(prev.resourceSkills || DEFAULT_RESOURCE_SKILLS),
          [resourceName]: currentSkills.filter(s => s !== skill)
        }
      };
    });
  };

  const value = {
    options,
    allResources,
    campaignOpsResources,
    audienceResources,
    coeResources,
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
    updateResourceSkills,
    addSkillToResource,
    removeSkillFromResource
  };

  return (
    <DropdownContext.Provider value={value}>
      {children}
    </DropdownContext.Provider>
  );
}

export function useDropdowns() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdowns must be used within a DropdownProvider');
  }
  return context;
}
