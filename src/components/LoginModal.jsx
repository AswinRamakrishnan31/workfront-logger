import React, { useState } from 'react';
import { Shield, UserCheck, Lock, LogIn, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ALL_RESOURCES } from '../constants';
import './LoginModal.css';

export default function LoginModal({ isOpen, onClose }) {
  const { login, userRoles, currentUser, groupDefinitions } = useAuth();
  const availableGroups = Object.keys(groupDefinitions);

  const [selectedUser, setSelectedUser] = useState(currentUser?.name || 'System Admin');
  const [selectedRole, setSelectedRole] = useState(userRoles[currentUser?.name] || 'Admin');

  if (!isOpen) return null;

  const handleUserSelect = (name) => {
    setSelectedUser(name);
    const assignedRole = userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops');
    setSelectedRole(assignedRole);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    login(selectedUser, selectedRole);
    if (onClose) onClose();
  };

  const availableUsers = ['System Admin', ...ALL_RESOURCES];
  const activeGroupInfo = groupDefinitions[selectedRole] || {};

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-card animate-fade-in">
        <div className="login-header">
          <div className="login-badge-icon">
            <Shield size={28} color="#818cf8" />
          </div>
          <h2>Workfront Logger Authentication</h2>
          <p>Select your team member account to access role-based features</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="form-group">
            <label><UserCheck size={16} /> Select Team Member</label>
            <select 
              value={selectedUser} 
              onChange={(e) => handleUserSelect(e.target.value)}
              className="login-select"
            >
              {availableUsers.map(name => (
                <option key={name} value={name}>
                  {name} ({userRoles[name] || (name === 'System Admin' ? 'Admin' : 'Campaign Ops')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label><Lock size={16} /> Access Role & User Group</label>
            <div className="role-selector-grid" style={{ gridTemplateColumns: `repeat(${availableGroups.length > 4 ? 3 : 2}, 1fr)` }}>
              {availableGroups.map(role => (
                <button
                  type="button"
                  key={role}
                  className={`role-select-btn ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="role-title">{role}</div>
                  {selectedRole === role && <Check size={16} className="role-check" />}
                </button>
              ))}
            </div>
          </div>

          <div className="role-description-box">
            <p><strong>{selectedRole} Access:</strong> {activeGroupInfo.description || 'Custom user group access'}</p>
          </div>

          <button type="submit" className="login-submit-btn">
            <LogIn size={18} /> Continue as {selectedUser} ({selectedRole}) <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
