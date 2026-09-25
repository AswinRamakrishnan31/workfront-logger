import React, { useState, useMemo, useRef } from 'react';
import { Database, ExternalLink, Filter, Upload, Download, FileSpreadsheet, Trash2, X, Zap } from 'lucide-react';
import { TEAM_MEMBERS, autoAssignTeamMembers } from '../constants';
import { useDropdowns } from '../context/DropdownContext';
import * as XLSX from 'xlsx';
import ProjectForm from './ProjectForm';

const STATUS_OPTIONS = [
  'Not Started',
  'In-Developement',
  'In-QA',
  'Completed',
  'On-Hold',
  'Deferred'
];

const allUsers = [...new Set([
  ...TEAM_MEMBERS.emailDeveloper,
  ...TEAM_MEMBERS.campaignBuilder,
  ...TEAM_MEMBERS.emailQA,
  ...TEAM_MEMBERS.campaignQA,
  ...TEAM_MEMBERS.audience,
  ...TEAM_MEMBERS.coe
])].sort();

const REQUIRED_FIELDS = [
  { key: 'projectName', label: 'Project Name (Required)' },
  { key: 'expectedStartDate', label: 'Expected Start Date' },
  { key: 'expectedEndDate', label: 'Expected End Date' },
  { key: 'status', label: 'Status' },
  { key: 'emailDeveloper', label: 'Email Developer' },
  { key: 'emailQA', label: 'Email QA' },
  { key: 'campaignBuilder', label: 'Campaign Builder' },
  { key: 'campaignQA', label: 'Campaign QA' },
  { key: 'audience', label: 'Audience' },
  { key: 'coe', label: 'CoE' },
  { key: 'priority', label: 'Priority' },
  { key: 'taskComplexity', label: 'Task Complexity' },
  { key: 'typeOfRequest', label: 'Type of Request' },
  { key: 'lob', label: 'Line of Business' },
  { key: 'campaignType', label: 'Type of Campaign' },
  { key: 'requesterName', label: 'Requester Name' },
  { key: 'emailCount', label: 'Number of Emails' },
  { key: 'workflowCount', label: 'Number of Workflows' },
  { key: 'smsCount', label: 'Number of SMS' },
  { key: 'inAppCount', label: 'Number of In-app notifications' },
  { key: 'isCR', label: 'Is this a Change Request (CR)?' }
];

export default function ProjectGrid({ projects, onUpdateProject, onBulkAddProjects, onClearProjects, onDeleteProjects }) {
  const { options, allResources } = useDropdowns();
  const statusOptions = options?.statusOptions || STATUS_OPTIONS;
  const usersList = allResources?.length ? allResources : allUsers;

  const fileInputRef = useRef(null);
  
  // Filter States
  const [filterDateType, setFilterDateType] = useState('All');
  const [filterCustomStart, setFilterCustomStart] = useState('');
  const [filterCustomEnd, setFilterCustomEnd] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [filterUsers, setFilterUsers] = useState([]);
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterRush, setFilterRush] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Selection and Pagination States
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterDateType, filterCustomStart, filterCustomEnd, filterStatus, filterUsers, filterTeam, filterRush]);

  // Import States
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});

  const handleAutoAssignAllUnassigned = () => {
    let count = 0;
    (projects || []).forEach(p => {
      const needsDev = !p.emailDeveloper && !p.campaignBuilder;
      const needsQa = !p.emailQA && !p.campaignQA;
      const needsAud = !p.audience;
      const needsCoe = !p.coe;

      if (needsDev || needsQa || needsAud || needsCoe) {
        const autoAssigned = autoAssignTeamMembers(projects, options?.teamMembers || TEAM_MEMBERS);
        const updated = {
          ...p,
          emailDeveloper: p.emailDeveloper || autoAssigned.emailDeveloper,
          campaignBuilder: p.campaignBuilder || autoAssigned.campaignBuilder,
          emailQA: p.emailQA || autoAssigned.emailQA,
          campaignQA: p.campaignQA || autoAssigned.campaignQA,
          audience: p.audience || autoAssigned.audience,
          coe: p.coe || autoAssigned.coe,
          status: (p.status === 'Yet to Start' || p.status === 'Yet to be assigned' || !p.status) ? 'In-Developement' : p.status
        };
        onUpdateProject(updated);
        count++;
      }
    });

    if (count > 0) {
      alert(`Successfully auto-assigned team resources for ${count} project(s) based on least workload balancing!`);
    } else {
      alert('All projects are already fully assigned!');
    }
  };

  const handleDownloadTemplate = (format = 'xlsx') => {
    const sampleRows = [
      {
        "WF Project Name": "Q4 Holiday Marketing Promo",
        "Expected Start Date": new Date().toISOString().split('T')[0],
        "Expected End Date": new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        "Status": "Yet to Start",
        "Email Developer": "Subhasri",
        "Email QA": "Jagadesh",
        "Campaign Builder": "Indrajit",
        "Campaign QA": "Thiyagaraj",
        "Audience": "Nandha",
        "CoE": "Sathya",
        "Priority": "High",
        "Task Complexity": "Medium Creation",
        "Type of Request": "Delivery + Campaign",
        "Line of Business": "Acquisition",
        "Type of Campaign": "Marketing",
        "Requester Name": "Alex Smith",
        "Number of Emails": 2,
        "Number of Workflows": 1,
        "Number of SMS": 0,
        "Number of In-app notifications": 0,
        "Is Change Request (CR)?": "No"
      },
      {
        "WF Project Name": "Account Update Notification",
        "Expected Start Date": new Date().toISOString().split('T')[0],
        "Expected End Date": new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        "Status": "In-Developement",
        "Email Developer": "Mohanapriya",
        "Email QA": "Niranjana",
        "Campaign Builder": "Ambarish",
        "Campaign QA": "Suwetha",
        "Audience": "Preeth",
        "CoE": "Preetha",
        "Priority": "Normal",
        "Task Complexity": "Simple Updates",
        "Type of Request": "Transaction message",
        "Line of Business": "Service Comms - Account Management",
        "Type of Campaign": "Service",
        "Requester Name": "Sarah Jenkins",
        "Number of Emails": 1,
        "Number of Workflows": 0,
        "Number of SMS": 0,
        "Number of In-app notifications": 1,
        "Is Change Request (CR)?": "No"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);

    // Set column width auto-fit for Sheet 1
    const colWidths = Object.keys(sampleRows[0]).map(key => ({
      wch: Math.max(key.length + 3, 18)
    }));
    worksheet['!cols'] = colWidths;

    // Build Tab 2: Valid_Dropdown_Values reference sheet
    const lobOpts = options?.lobOptions || [];
    const campaignTypeOpts = options?.campaignTypeOptions || [];
    const priorityOpts = options?.priorityOptions || [];
    const typeOfRequestOpts = options?.typeOfRequestOptions || [];
    const taskComplexityOpts = options?.taskComplexityOptions || [];
    const statusOpts = options?.statusOptions || [];
    const teamMembersMap = options?.teamMembers || {};

    const emailDevs = teamMembersMap.emailDeveloper || [];
    const campBuilders = teamMembersMap.campaignBuilder || [];
    const emailQAs = teamMembersMap.emailQA || [];
    const campQAs = teamMembersMap.campaignQA || [];
    const audiences = teamMembersMap.audience || [];
    const coes = teamMembersMap.coe || [];

    const maxRows = Math.max(
      lobOpts.length,
      campaignTypeOpts.length,
      priorityOpts.length,
      typeOfRequestOpts.length,
      taskComplexityOpts.length,
      statusOpts.length,
      emailDevs.length,
      campBuilders.length,
      emailQAs.length,
      campQAs.length,
      audiences.length,
      coes.length,
      1
    );

    const refRows = [];
    for (let i = 0; i < maxRows; i++) {
      refRows.push({
        "Line of Business": lobOpts[i] || "",
        "Type of Campaign": campaignTypeOpts[i] || "",
        "Priority": priorityOpts[i] || "",
        "Type of Request": typeOfRequestOpts[i] || "",
        "Task Complexity": taskComplexityOpts[i] || "",
        "Status": statusOpts[i] || "",
        "Email Developer": emailDevs[i] || "",
        "Campaign Builder": campBuilders[i] || "",
        "Email QA": emailQAs[i] || "",
        "Campaign QA": campQAs[i] || "",
        "Audience": audiences[i] || "",
        "CoE": coes[i] || ""
      });
    }

    const refWorksheet = XLSX.utils.json_to_sheet(refRows);
    const refColWidths = Object.keys(refRows[0] || {}).map(key => ({
      wch: Math.max(key.length + 3, 22)
    }));
    refWorksheet['!cols'] = refColWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Project_Template");
    XLSX.utils.book_append_sheet(workbook, refWorksheet, "Valid_Dropdown_Values");

    if (format === 'csv') {
      XLSX.writeFile(workbook, "workfront_projects_import_template.csv", { bookType: "csv" });
      
      // Also download CSV reference file for convenience
      const refWorkbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(refWorkbook, refWorksheet, "Valid_Dropdown_Values");
      XLSX.writeFile(refWorkbook, "workfront_projects_valid_dropdown_values.csv", { bookType: "csv" });
    } else {
      XLSX.writeFile(workbook, "workfront_projects_import_template.xlsx");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames.find(n => n.includes('WIP')) || wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        
        if (data.length === 0) {
          alert('No data found in the sheet.');
          return;
        }

        const headers = Object.keys(data[0]);
        setImportData(data);
        setImportHeaders(headers);

        // Auto-guess mapping
        const initialMap = {};
        REQUIRED_FIELDS.forEach(field => {
          const match = headers.find(h => 
            h.toLowerCase() === field.key.toLowerCase() || 
            h.toLowerCase().includes(field.key.toLowerCase()) ||
            field.label.toLowerCase().includes(h.toLowerCase())
          );
          initialMap[field.key] = match || '';
        });
        
        setColumnMap(initialMap);
        setIsMappingModalOpen(true);
      } catch (err) {
        console.error("Error parsing file:", err);
        alert("Error parsing Excel file. Please ensure it's a valid XLSX/CSV format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset
  };

  const handleConfirmImport = () => {
    const importedProjects = importData.map((row, index) => {
      const pNameCol = columnMap['projectName'];
      if (!pNameCol || !row[pNameCol]) return null;

      const newProject = {
        id: 'imported_' + Date.now() + '_' + index,
        date: new Date().toISOString().split('T')[0],
      };

      REQUIRED_FIELDS.forEach(field => {
        const colName = columnMap[field.key];
        let val = colName ? (row[colName] || '') : '';
        
        // Format dates correctly if they are JS Date objects (due to cellDates: true)
        if (val && (field.key === 'expectedStartDate' || field.key === 'expectedEndDate')) {
          if (val instanceof Date && !isNaN(val)) {
            val = val.toISOString().split('T')[0];
          } else if (typeof val === 'string' && !isNaN(Date.parse(val))) {
            val = new Date(val).toISOString().split('T')[0];
          }
        }
        
        newProject[field.key] = val;
      });

      if (!newProject.status) newProject.status = 'Yet to Start';
      if (!newProject.priority) newProject.priority = 'Normal';
      if (!newProject.taskComplexity) newProject.taskComplexity = 'Simple Updates';
      if (!newProject.typeOfRequest) newProject.typeOfRequest = 'Delivery';

      // Boolean conversion for CR
      if (typeof newProject.isCR === 'string') {
        newProject.isCR = newProject.isCR.toLowerCase() === 'yes' || newProject.isCR.toLowerCase() === 'true';
      } else {
        newProject.isCR = !!newProject.isCR;
      }

      // Number conversion for counts
      ['emailCount', 'workflowCount', 'smsCount', 'inAppCount'].forEach(c => {
        newProject[c] = Number(newProject[c]) || 0;
      });

      return newProject;
    }).filter(Boolean);

    if (onBulkAddProjects && importedProjects.length > 0) {
      onBulkAddProjects(importedProjects);
      alert(`Successfully imported ${importedProjects.length} valid projects!`);
    } else {
      alert('No valid projects found to import. Make sure Project Name is mapped and rows are not empty.');
    }
    
    setIsMappingModalOpen(false);
  };

  const isDateInRange = (dateStr, rangeType, customStart, customEnd) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    switch (rangeType) {
      case 'Current Month': return d >= thisMonthStart && d < nextMonthStart;
      case 'Next Month':
        const nextNextMonthStart = new Date(now.getFullYear(), now.getMonth() + 2, 1);
        return d >= nextMonthStart && d < nextNextMonthStart;
      case 'Last Month': return d >= lastMonthStart && d < thisMonthStart;
      case 'Last 2 Months':
        const last2MonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return d >= last2MonthsStart && d < thisMonthStart;
      case 'Last 6 Months':
        const last6MonthsStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return d >= last6MonthsStart && d < thisMonthStart;
      case 'Last 12 Months':
      case 'Last Year':
        const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        return d >= lastYearStart && d < thisMonthStart;
      case 'Custom':
        if (!customStart && !customEnd) return true;
        if (customStart && customEnd) return d >= new Date(customStart) && d <= new Date(customEnd);
        if (customStart) return d >= new Date(customStart);
        if (customEnd) return d <= new Date(customEnd);
        return true;
      default: return true;
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(p => {
      // 1. Date Filter
      if (filterDateType !== 'All') {
        const dStr = p.expectedEndDate || p.expectedLaunchDate || p.expectedStartDate || p.date;
        if (!isDateInRange(dStr, filterDateType, filterCustomStart, filterCustomEnd)) {
          return false;
        }
      }
      
      // 2. Status Filter
      if (filterStatus === 'Active') {
        const inactive = ['Completed', 'Deferred', 'Cancelled'];
        if (inactive.includes(p.status)) return false;
      } else if (filterStatus !== 'All') {
        if (p.status !== filterStatus) return false;
      }
      
      // 3. Rush Request
      if (filterRush) {
        if (p.priority !== 'Urgent' && p.priority !== 'Critical Business Impact' && p.priority !== 'High') return false;
      }
      
      // 4. User Name (Multi-select)
      if (filterUsers.length > 0) {
        const matchesAnyUser = filterUsers.some(user => {
          const uSearch = user.toLowerCase();
          return (p.emailDeveloper && p.emailDeveloper.toLowerCase().includes(uSearch)) || 
                 (p.campaignBuilder && p.campaignBuilder.toLowerCase().includes(uSearch)) || 
                 (p.emailQA && p.emailQA.toLowerCase().includes(uSearch)) || 
                 (p.campaignQA && p.campaignQA.toLowerCase().includes(uSearch)) || 
                 (p.audience && p.audience.toLowerCase().includes(uSearch)) || 
                 (p.coe && p.coe.toLowerCase().includes(uSearch));
        });
        if (!matchesAnyUser) return false;
      }
      
      // 5. Team Category
      if (filterTeam !== 'All') {
        if (filterTeam === 'Email Dev' && !p.emailDeveloper) return false;
        if (filterTeam === 'Campaign Dev' && !p.campaignBuilder) return false;
        if (filterTeam === 'Email QA' && !p.emailQA) return false;
        if (filterTeam === 'Campaign QA' && !p.campaignQA) return false;
        if (filterTeam === 'Audience' && !p.audience) return false;
        if (filterTeam === 'CoE' && !p.coe) return false;
      }
      
      return true;
    });
  }, [projects, filterDateType, filterCustomStart, filterCustomEnd, filterStatus, filterUsers, filterTeam, filterRush]);

  const totalPages = itemsPerPage === 'All' ? 1 : Math.ceil(filteredProjects.length / itemsPerPage);
  const currentProjects = useMemo(() => {
    if (itemsPerPage === 'All') return filteredProjects;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredProjects, currentPage, itemsPerPage]);

  const isAllCurrentSelected = currentProjects.length > 0 && currentProjects.every(p => selectedProjects.includes(p.id));
  
  const toggleSelectAll = () => {
    if (isAllCurrentSelected) {
      setSelectedProjects(prev => prev.filter(id => !currentProjects.find(p => p.id === id)));
    } else {
      const newIds = currentProjects.map(p => p.id).filter(id => !selectedProjects.includes(id));
      setSelectedProjects(prev => [...prev, ...newIds]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedProjects(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    if (onDeleteProjects && selectedProjects.length > 0) {
      onDeleteProjects(selectedProjects);
      setSelectedProjects([]);
    }
  };

  const toggleUserFilter = (user) => {
    setFilterUsers(prev => 
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
    );
  };

  const handleStatusChange = (project, field, value) => {
    onUpdateProject({ ...project, [field]: value });
  };

  const handleCompletionDateChange = (project, value) => {
    const updated = { ...project, actualCompletionDate: value };
    if (value) {
      updated.status = 'Completed';
      updated.emailDevStatus = 'Completed';
      updated.campDevStatus = 'Completed';
      updated.emailQAStatus = 'Completed';
      updated.campQAStatus = 'Completed';
    }
    onUpdateProject(updated);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In-Developement': 
      case 'In-QA': 
      case 'In-UAT': 
      case 'In-Pre-Depoyment-Checks': return 'status-in-progress';
      case 'On-Hold': 
      case 'Deferred': return 'status-on-hold';
      default: return 'status-not-started';
    }
  };

  const renderResourceCell = (project, resourceString, statusField) => {
    if (!resourceString) return <td className="interactive-cell">-</td>;
    const name = resourceString.split(' | ')[0];
    const currentStatus = project[statusField] || 'Not Started';
    return (
      <td className="interactive-cell">
        <div className="resource-name">{name}</div>
        <select 
          value={currentStatus} 
          onChange={(e) => handleStatusChange(project, statusField, e.target.value)}
          className={`status-dropdown ${getStatusClass(currentStatus)}`}
        >
          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </td>
    );
  };

  return (
    <div className="glass-panel grid-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      
      {/* HEADER WITH ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>View Projects</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {selectedProjects.length > 0 && (
            <button 
              onClick={handleDeleteSelected} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444' }}
            >
              <Trash2 size={16} /> Delete Selected ({selectedProjects.length})
            </button>
          )}

          
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <button 
            onClick={() => handleDownloadTemplate('xlsx')} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e' }}
            title="Download pre-formatted Excel template (.xlsx)"
          >
            <Download size={16} /> Excel Template
          </button>
          
          <button 
            onClick={() => handleDownloadTemplate('csv')} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: '1px solid #c084fc' }}
            title="Download pre-formatted CSV template (.csv)"
          >
            <FileSpreadsheet size={16} /> CSV Template
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid #38bdf8' }}
          >
            <Upload size={16} /> Import Excel / CSV
          </button>

          <button 
            onClick={handleAutoAssignAllUnassigned} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)', color: '#a5b4fc', border: '1px solid #8b5cf6', fontWeight: 600 }}
            title="Auto assign team members for all unassigned projects based on least workload balancing"
          >
            <Zap size={16} /> Auto-Assign Unassigned Projects
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', background: 'var(--surface-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 'bold', marginRight: '1rem', marginTop: '0.5rem' }}>
          <Filter size={18} /> Filters
        </div>
        
        {/* Date Filter */}
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expected End Date</label>
          <select 
            value={filterDateType} 
            onChange={(e) => setFilterDateType(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
          >
            <option value="All">All Dates</option>
            <option value="Current Month">Current Month</option>
            <option value="Next Month">Next Month</option>
            <option value="Last Month">Last Month</option>
            <option value="Last 2 Months">Last 2 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Last 12 Months">Last 12 Months</option>
            <option value="Last Year">Last Year</option>
            <option value="Custom">Custom Range</option>
          </select>
          {filterDateType === 'Custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input type="date" value={filterCustomStart} onChange={e => setFilterCustomStart(e.target.value)} style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.15rem 0.25rem', borderRadius: '4px', fontSize: '0.75rem' }} />
              <input type="date" value={filterCustomEnd} onChange={e => setFilterCustomEnd(e.target.value)} style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.15rem 0.25rem', borderRadius: '4px', fontSize: '0.75rem' }} />
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
          >
            <option value="All">All Projects</option>
            <option value="Active">Active Only</option>
            {[...new Set([...statusOptions, 'Yet to Start', 'In Progress', 'Scheduled'])].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* User Multi-select */}
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', position: 'relative' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search User</label>
          <div 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', minWidth: '150px' }}
          >
            {filterUsers.length === 0 ? 'All Users' : `${filterUsers.length} Selected`}
          </div>
          {isUserDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10, background: 'var(--surface-bg)', border: '1px solid var(--surface-border)', borderRadius: '4px', padding: '0.5rem', maxHeight: '200px', overflowY: 'auto', width: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
              {usersList.map(u => (
                <label key={u} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={filterUsers.includes(u)} onChange={() => toggleUserFilter(u)} />
                  {u}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Team Category Filter */}
        <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Team Category</label>
          <select 
            value={filterTeam} 
            onChange={(e) => setFilterTeam(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
          >
            <option value="All">All Teams</option>
            <option value="Email Dev">Email Dev</option>
            <option value="Email QA">Email QA</option>
            <option value="Campaign Dev">Campaign Dev</option>
            <option value="Campaign QA">Campaign QA</option>
            <option value="Audience">Audience</option>
            <option value="CoE">CoE</option>
          </select>
        </div>

        {/* Rush Filter */}
        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
          <input 
            type="checkbox" 
            id="rushFilter"
            checked={filterRush}
            onChange={(e) => setFilterRush(e.target.checked)}
          />
          <label htmlFor="rushFilter" style={{ color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>Rush Requests</label>
        </div>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <Database size={48} />
          <h3>No Projects Logged</h3>
          <p>Projects you log will appear here in a grid view.</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '2rem' }}>
          <h3>No Matches</h3>
          <p>No projects match your current filter criteria.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '1rem' }}>
          <table className="data-table interactive-data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" checked={isAllCurrentSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                </th>
                <th>Project Name</th>
                <th>Overall Status</th>
                <th>Email Dev</th>
                <th>Email QA</th>
                <th>Campaign Dev</th>
                <th>Campaign QA</th>
                <th>Completion Date</th>
                <th>WF URL</th>
              </tr>
            </thead>
            <tbody>
              {currentProjects.map((project) => (
                <tr key={project.id} className={selectedProjects.includes(project.id) ? 'selected-row' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedProjects.includes(project.id)} onChange={() => toggleSelectRow(project.id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    <button 
                      className="btn-link" 
                      onClick={() => setEditingProject(project)}
                      style={{ textDecoration: 'underline', color: 'var(--primary-color)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontWeight: 600, fontSize: '0.9rem' }}
                    >
                      {project.projectName}
                    </button>
                    {project.isCR && <span style={{ marginLeft: '8px', background: '#eab308', color: '#000', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CR</span>}
                  </td>
                  <td>
                    <select 
                      value={project.status || 'Yet to Start'}
                      onChange={(e) => handleStatusChange(project, 'status', e.target.value)}
                      className={`status-dropdown overall ${getStatusClass(project.status || 'Yet to Start')}`}
                    >
                      {[...new Set([...statusOptions, 'Yet to Start', 'In Progress', 'Scheduled'])].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  
                  {renderResourceCell(project, project.emailDeveloper, 'emailDevStatus')}
                  {renderResourceCell(project, project.emailQA, 'emailQAStatus')}
                  {renderResourceCell(project, project.campaignBuilder, 'campDevStatus')}
                  {renderResourceCell(project, project.campaignQA, 'campQAStatus')}
                  
                  <td>
                    <input 
                      type="date" 
                      value={project.actualCompletionDate || ''}
                      onChange={(e) => handleCompletionDateChange(project, e.target.value)}
                      className="completion-date-picker"
                    />
                  </td>
                  
                  <td>
                    {project.wfUrl ? (
                      <a href={project.wfUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Link <ExternalLink size={12} />
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* PAGINATION CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--surface-bg)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Items per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                style={{ background: '#1e293b', border: '1px solid var(--surface-border)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
              >
                <option value={10}>10</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="All">All</option>
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing {itemsPerPage === 'All' ? filteredProjects.length : Math.min(filteredProjects.length, currentPage * itemsPerPage)} of {filteredProjects.length}
              </span>
            </div>
            
            {itemsPerPage !== 'All' && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  className="btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                >
                  Previous
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.9rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAPPING MODAL OVERLAY */}
      {isMappingModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button 
              onClick={() => setIsMappingModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#1e293b', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Map Excel Columns</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              We found {importHeaders.length} columns in your sheet. Please map them to the application fields below.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(56, 189, 248, 0.08)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Need standard format template?</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => handleDownloadTemplate('xlsx')}>
                  <Download size={14} /> .XLSX
                </button>
                <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => handleDownloadTemplate('csv')}>
                  <FileSpreadsheet size={14} /> .CSV
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>App Field</div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Excel Column</div>
              
              {REQUIRED_FIELDS.map(field => (
                <React.Fragment key={field.key}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                    {field.label}
                  </div>
                  <select 
                    value={columnMap[field.key] || ''} 
                    onChange={(e) => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                    style={{ background: 'var(--surface-bg)', border: '1px solid var(--surface-border)', color: 'white', padding: '0.5rem', borderRadius: '4px' }}
                  >
                    <option value="">-- Ignore / Not Present --</option>
                    {importHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn-secondary" onClick={() => setIsMappingModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmImport}>Confirm Import</button>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Edit Project</h2>
              <button className="btn-secondary" onClick={() => setEditingProject(null)}>Close</button>
            </div>
            <ProjectForm 
              initialData={editingProject} 
              onUpdateProject={(updated) => {
                if (onUpdateProject) onUpdateProject(updated);
                setEditingProject(null);
              }}
              projects={projects}
            />
          </div>
        </div>
      )}
    </div>
  );
}
