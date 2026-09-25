import React, { useState, useEffect } from 'react';
import { Save, Zap, Layers } from 'lucide-react';
import { TEAM_MEMBERS, autoAssignTeamMembers } from '../constants';
import { useDropdowns } from '../context/DropdownContext';

// Calculate dynamic stats for each member based on logged projects
const calculateMemberStats = (name, projects = []) => {
  let a = 0; // Active
  let e = 0; // Expected
  let dt = 0; // Deployment Today
  let et = 0; // Expected Today

  const todayStr = new Date().toISOString().split('T')[0];

  projects.forEach(project => {
    // Check if member is assigned to this project in any role. 
    // We use .includes to handle old data that might have the full string saved.
    const isAssigned = (
      (project.emailDeveloper && project.emailDeveloper.includes(name)) ||
      (project.campaignBuilder && project.campaignBuilder.includes(name)) ||
      (project.emailQA && project.emailQA.includes(name)) ||
      (project.campaignQA && project.campaignQA.includes(name)) ||
      (project.audience && project.audience.includes(name)) ||
      (project.coe && project.coe.includes(name))
    );

    if (isAssigned) {
      const activeStatuses = ['In-Developement', 'In-QA', 'In-UAT', 'In-Pre-Depoyment-Checks', 'Scheduled'];
      const expectedStatuses = ['Yet to Start', 'Pending from Requester', 'Pending for Approval', 'On-Hold', 'Yet to be assigned'];
      const deploymentStatuses = ['In-Pre-Depoyment-Checks', 'Scheduled'];

      if (activeStatuses.includes(project.status)) a++;
      if (expectedStatuses.includes(project.status)) e++;
      
      // Assume "Deployment Today" checks if status is active/deploying and date matches today
      if (deploymentStatuses.includes(project.status) && project.expectedStartDate === todayStr) dt++;
      
      // Expected Today
      if (expectedStatuses.includes(project.status) && project.expectedStartDate === todayStr) et++;
    }
  });

  return `${name} | A: ${a} | E: ${e} | DT: ${dt} | ET: ${et}`;
};

export const LOB_OPTIONS = [
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

export const TASK_COMPLEXITY_OPTIONS = [
  'Simple Updates',
  'Simple Creation',
  'Services Updates',
  'Medium Updates',
  'Medium Creation',
  'Complex Updates',
  'Complex Creation',
  'Custom'
];

export const PRIORITY_OPTIONS = [
  'None',
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Critical Business Impact'
];

export const TYPE_OF_REQUEST_OPTIONS = [
  'Delivery',
  'Delivery + Campaign',
  'Transaction message',
  'CMP Templates',
  'SMS',
  'Push notification',
  'Inapp notification',
  'Workflow',
  'Audience'
];

export const STATUS_OPTIONS = [
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

export const TYPE_OF_CAMPAIGN_OPTIONS = [
  'Service',
  'Marketing',
  'Issue fixes'
];

// Component for selecting multiple resources for a single role
function MultiResourceSelect({ label, id, name, value, options, projects, onChange }) {
  const currentArray = React.useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return typeof value === 'string'
      ? value.split(/[,|]/).map(s => s.trim()).filter(Boolean)
      : [];
  }, [value]);

  const handleAdd = (memberName) => {
    if (!memberName) return;
    if (!currentArray.includes(memberName)) {
      const nextArray = [...currentArray, memberName];
      onChange(name, nextArray.join(', '));
    }
  };

  const handleRemove = (memberName) => {
    const nextArray = currentArray.filter(m => m !== memberName);
    onChange(name, nextArray.join(', '));
  };

  const availableOptions = options.filter(opt => !currentArray.includes(opt));

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>

      {currentArray.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
          {currentArray.map(m => (
            <span
              key={m}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.18)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              {m}
              <button
                type="button"
                onClick={() => handleRemove(m)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: '2px'
                }}
                title={`Remove ${m}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <select
        id={id}
        name={name}
        value=""
        onChange={(e) => handleAdd(e.target.value)}
      >
        <option value="">
          {currentArray.length > 0 ? '+ Add another member...' : 'Select Member'}
        </option>
        {availableOptions.map(name => {
          const display = calculateMemberStats(name, projects);
          return <option key={name} value={name}>{display}</option>;
        })}
      </select>
    </div>
  );
}

export default function ProjectForm({ onAddProject, onUpdateProject, initialData, projects = [] }) {
  const { options } = useDropdowns();
  const lobOptions = options?.lobOptions || LOB_OPTIONS;
  const campaignTypeOptions = options?.campaignTypeOptions || TYPE_OF_CAMPAIGN_OPTIONS;
  const priorityOptions = options?.priorityOptions || PRIORITY_OPTIONS;
  const typeOfRequestOptions = options?.typeOfRequestOptions || TYPE_OF_REQUEST_OPTIONS;
  const taskComplexityOptions = options?.taskComplexityOptions || TASK_COMPLEXITY_OPTIONS;
  const statusOptions = options?.statusOptions || STATUS_OPTIONS;
  const teamMembers = options?.teamMembers || TEAM_MEMBERS;

  const emptyForm = {
    date: new Date().toISOString().split('T')[0],
    expectedStartDate: '',
    expectedEndDate: '',
    projectName: '',
    wfUrl: '',
    taskName: '',
    lineOfBusiness: '',
    typeOfCampaign: '',
    requestorName: '',
    numEmails: '',
    numWorkflows: '',
    numSms: '',
    numInapp: '',
    priority: '',
    typeOfRequest: '',
    taskComplexity: '',
    customHours: '',
    customTeamHours: {},
    emailDeveloper: '',
    campaignBuilder: '',
    emailQA: '',
    campaignQA: '',
    audience: '',
    coe: '',
    status: 'Yet to be assigned',
    isCR: false,
    crCustomHours: '',
    crApprovalDate: ''
  };

  const [formData, setFormData] = useState(initialData ? { ...emptyForm, ...initialData } : emptyForm);

  // Re-sync whenever the project being edited changes (different project clicked)
  useEffect(() => {
    if (initialData) {
      setFormData({ ...emptyForm, ...initialData });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleAutoAssign = () => {
    const assigned = autoAssignTeamMembers(
      projects,
      teamMembers,
      formData,
      options?.autoAssignRules,
      options?.resourceSkills
    );
    setFormData(prev => ({
      ...prev,
      ...assigned,
      status: (prev.status === 'Yet to be assigned' || !prev.status) ? 'In-Developement' : prev.status
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for per-team custom hours
  const handleTeamHoursChange = (role, value) => {
    setFormData(prev => {
      const updated = { ...prev, customTeamHours: { ...(prev.customTeamHours || {}), [role]: value } };
      // Auto-sum total customHours from all roles
      const total = Object.values(updated.customTeamHours).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      return { ...updated, customHours: total > 0 ? total.toString() : '' };
    });
  };

  const handleSubmit = (e, submitToStaging = false) => {
    if (e) e.preventDefault();
    const stgNum = String(Date.now()).slice(-4);
    const generatedStagingId = `STG-${new Date().getFullYear()}-${stgNum}`;
    const finalData = {
      ...formData,
      stagingId: formData.stagingId || (submitToStaging ? generatedStagingId : null),
      stagedAt: formData.stagedAt || (submitToStaging ? new Date().toISOString() : null),
      status: submitToStaging ? 'Staged' : (formData.status || 'In-Developement'),
      isStaged: submitToStaging
    };

    if (initialData && initialData.id) {
      if (onUpdateProject) {
        onUpdateProject({ ...finalData, id: initialData.id });
      }
    } else {
      if (onAddProject) {
        onAddProject({ ...finalData, id: Date.now().toString() });
      }
      setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    }
  };

  const getVisibleResources = () => {
    const req = formData.typeOfRequest;
    const camp = formData.typeOfCampaign;
    
    let showEmailDev = false;
    let showEmailQA = false;
    let showCampDev = false;
    let showCampQA = false;

    if (req === 'Delivery' || req === 'Delivery + Campaign') {
      showEmailDev = true;
      showEmailQA = true;
      showCampDev = true;
      showCampQA = true;
    } else if (req === 'Transaction message' || req === 'CMP Templates') {
      showEmailDev = true;
      showEmailQA = true;
    } else if (req === 'SMS' || req === 'Push notification' || req === 'Inapp notification') {
      showCampDev = true;
      showCampQA = true;
    } else {
      // Default fallback if some other type is selected
      showEmailDev = true;
      showEmailQA = true;
      showCampDev = true;
      showCampQA = true;
    }

    // Override: When Service is chosen, always show all 4
    if (camp === 'Service') {
      showEmailDev = true;
      showEmailQA = true;
      showCampDev = true;
      showCampQA = true;
    }

    return { showEmailDev, showEmailQA, showCampDev, showCampQA };
  };

  const visibility = getVisibleResources();

  return (
    <div className={initialData ? 'project-form-container' : 'glass-panel form-panel animate-fade-in'}>
      {!initialData && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span>📝</span> Log New Workfront Campaign Project
            </h2>
            <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
              Fill in project details, configure role routing, auto-assign available team members, or submit to Staging Queue.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* SECTION 1: BASIC DETAILS & SCHEDULE */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#818cf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📌 1. Basic Project Identity & Dates
          </h4>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">Log Date *</label>
              <input type="date" id="date" name="date" value={formData.date || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="expectedStartDate">Expected Start Date *</label>
              <input type="date" id="expectedStartDate" name="expectedStartDate" value={formData.expectedStartDate || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="expectedEndDate">Expected End Date *</label>
              <input type="date" id="expectedEndDate" name="expectedEndDate" value={formData.expectedEndDate || ''} onChange={handleChange} required />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="projectName">WF Project Name *</label>
              <input type="text" id="projectName" name="projectName" placeholder="e.g. Q4 Holiday Campaign Promo" value={formData.projectName || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label htmlFor="wfUrl">WF URL</label>
              <input type="url" id="wfUrl" name="wfUrl" placeholder="https://workfront.com/..." value={formData.wfUrl || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="taskName">Task Name</label>
              <input type="text" id="taskName" name="taskName" placeholder="Enter task name" value={formData.taskName || ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* SECTION 2: BUSINESS ATTRIBUTES & PARAMETERS */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💼 2. Campaign Parameters & Scope Counts
          </h4>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="lineOfBusiness">Line of Business (LOB)</label>
              <select id="lineOfBusiness" name="lineOfBusiness" value={formData.lineOfBusiness || ''} onChange={handleChange}>
                <option value="">Select LOB</option>
                {lobOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="typeOfCampaign">Type of Campaign</label>
              <select id="typeOfCampaign" name="typeOfCampaign" value={formData.typeOfCampaign || ''} onChange={handleChange}>
                <option value="">Select Campaign Type</option>
                {campaignTypeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="requestorName">Requester Name</label>
              <input type="text" id="requestorName" name="requestorName" placeholder="Name of requester" value={formData.requestorName || ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority Level</label>
              <select id="priority" name="priority" value={formData.priority || ''} onChange={handleChange}>
                <option value="">Select Priority</option>
                {priorityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="typeOfRequest">Type of Request</label>
              <select id="typeOfRequest" name="typeOfRequest" value={formData.typeOfRequest || ''} onChange={handleChange}>
                <option value="">Select Request Type</option>
                {typeOfRequestOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="taskComplexity">Task Complexity</label>
              <select id="taskComplexity" name="taskComplexity" value={formData.taskComplexity || ''} onChange={handleChange}>
                <option value="">Select Complexity</option>
                {taskComplexityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="numEmails">Emails Count</label>
              <input type="number" min="0" id="numEmails" name="numEmails" placeholder="0" value={formData.numEmails ?? ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="numWorkflows">Workflows Count</label>
              <input type="number" min="0" id="numWorkflows" name="numWorkflows" placeholder="0" value={formData.numWorkflows ?? ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="numSms">SMS Count</label>
              <input type="number" min="0" id="numSms" name="numSms" placeholder="0" value={formData.numSms ?? ''} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="numInapp">In-App Notifications</label>
              <input type="number" min="0" id="numInapp" name="numInapp" placeholder="0" value={formData.numInapp ?? ''} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* SECTION 3: CUSTOM HOURS (If Complexity is Custom) */}
        {formData.taskComplexity === 'Custom' && (
          <div style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.95rem' }}>⏱ Custom Hours Breakdown by Role</span>
              {formData.customHours && (
                <span style={{ background: 'var(--primary-color)', color: '#fff', borderRadius: '20px', padding: '2px 12px', fontSize: '0.85rem', fontWeight: 700 }}>
                  Total: {formData.customHours} hrs
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { role: 'emailDeveloper', label: 'Email Developer', member: formData.emailDeveloper },
                { role: 'emailQA', label: 'Email QA', member: formData.emailQA },
                { role: 'campaignBuilder', label: 'Campaign Builder', member: formData.campaignBuilder },
                { role: 'campaignQA', label: 'Campaign QA', member: formData.campaignQA },
                { role: 'audience', label: 'Audience', member: formData.audience },
                { role: 'coe', label: 'CoE', member: formData.coe },
              ].map(({ role, label, member }) => (
                <div key={role} style={{
                  background: 'rgba(15,23,42,0.5)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--surface-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem'
                }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{label}</label>
                  {member ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{member}</span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>Not assigned</span>
                  )}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Hours (e.g. 4)"
                    value={(formData.customTeamHours || {})[role] || ''}
                    onChange={(e) => handleTeamHoursChange(role, e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', marginTop: '0.25rem' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: TEAM RESOURCE ALLOCATION & AUTO ASSIGN */}
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👥 3. Team Member Assignments & Auto-Dispatcher
            </span>
            <button
              type="button"
              onClick={handleAutoAssign}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s ease'
              }}
              title="Automatically assign available team members based on campaign matrix, skills, and lowest workload"
            >
              <Zap size={16} /> Auto-Assign Team (Workload Balanced)
            </button>
          </div>

          <div className="form-grid">
            {visibility.showEmailDev && (
              <MultiResourceSelect
                label="Email Developer"
                id="emailDeveloper"
                name="emailDeveloper"
                value={formData.emailDeveloper}
                options={teamMembers.emailDeveloper || []}
                projects={projects}
                onChange={handleRoleChange}
              />
            )}

            {visibility.showCampDev && (
              <MultiResourceSelect
                label="Campaign Builder"
                id="campaignBuilder"
                name="campaignBuilder"
                value={formData.campaignBuilder}
                options={teamMembers.campaignBuilder || []}
                projects={projects}
                onChange={handleRoleChange}
              />
            )}

            {visibility.showEmailQA && (
              <MultiResourceSelect
                label="Email QA"
                id="emailQA"
                name="emailQA"
                value={formData.emailQA}
                options={teamMembers.emailQA || []}
                projects={projects}
                onChange={handleRoleChange}
              />
            )}

            {visibility.showCampQA && (
              <MultiResourceSelect
                label="Campaign QA"
                id="campaignQA"
                name="campaignQA"
                value={formData.campaignQA}
                options={teamMembers.campaignQA || []}
                projects={projects}
                onChange={handleRoleChange}
              />
            )}

            <MultiResourceSelect
              label="Audience"
              id="audience"
              name="audience"
              value={formData.audience}
              options={teamMembers.audience || []}
              projects={projects}
              onChange={handleRoleChange}
            />

            <MultiResourceSelect
              label="COE"
              id="coe"
              name="coe"
              value={formData.coe}
              options={teamMembers.coe || []}
              projects={projects}
              onChange={handleRoleChange}
            />

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="status">Overall Project Status</label>
              <select id="status" name="status" value={formData.status || 'Yet to be assigned'} onChange={handleChange}>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 5: CHANGE REQUEST (CR) TRACKING */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--surface-border)', padding: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', margin: 0, fontWeight: 700, color: '#fbbf24' }}>
            <input type="checkbox" name="isCR" checked={formData.isCR} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#eab308' }} />
            Is this a Change Request (CR)?
          </label>
          
          {formData.isCR && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
              <div>
                <label htmlFor="crCustomHours">CR Custom Hours *</label>
                <input type="number" min="0" step="0.5" id="crCustomHours" name="crCustomHours" placeholder="e.g. 2.5" value={formData.crCustomHours} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="crApprovalDate">CR Shared & Approved Date/Time *</label>
                <input type="datetime-local" id="crApprovalDate" name="crApprovalDate" value={formData.crApprovalDate} onChange={handleChange} required />
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT ACTIONS FOOTER */}
        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              color: '#c4b5fd',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            title="Submit project to Staging Queue for review & approval before publishing live"
          >
            <Layers size={18} /> Submit to Staging Queue
          </button>

          <button type="submit" onClick={(e) => handleSubmit(e, false)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            <Save size={18} />
            {initialData ? 'Update Project' : 'Publish Directly'}
          </button>
        </div>
      </form>
    </div>
  );
}
