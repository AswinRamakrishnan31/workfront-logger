import React, { useState } from 'react';
import { Layers, Lock, User, KeyRound, HelpCircle, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ALL_RESOURCES } from '../constants';
import './LoginScreen.css';

export default function LoginScreen() {
  const { authenticateUser, resetPasswordWithSecurity, userProfiles, login } = useAuth();

  const [mode, setMode] = useState('signIn'); // 'signIn' | 'forgotPassword'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password Recovery state
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: username, 2: answer & new pass
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [secretAnswerInput, setSecretAnswerInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const handleSignIn = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Username or Name.');
      return;
    }

    const res = authenticateUser(identifier, password);
    if (!res.success) {
      setErrorMessage(res.error);
    }
  };

  const handleLookupSecretQuestion = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const input = identifier.trim().toLowerCase();
    const profile = Object.values(userProfiles).find(p => 
      (p.username && p.username.toLowerCase() === input) ||
      (p.name && p.name.toLowerCase() === input) ||
      (p.email && p.email.toLowerCase() === input)
    );

    if (!profile) {
      setErrorMessage('User account not found. Please check username.');
      return;
    }

    setMatchedProfile(profile);
    setRecoveryStep(2);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!secretAnswerInput.trim()) {
      setErrorMessage('Please answer the secret question.');
      return;
    }
    if (!newPasswordInput.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    const res = resetPasswordWithSecurity(identifier, secretAnswerInput, newPasswordInput);
    if (!res.success) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Password successfully reset! Please sign in with your new password.');
      setMode('signIn');
      setPassword(newPasswordInput);
      setRecoveryStep(1);
    }
  };

  const handleQuickDemoLogin = (resName) => {
    login(resName);
  };

  return (
    <div className="login-page-container">
      <div className="login-glass-card animate-fade-in">
        
        {/* BRAND HEADER */}
        <div className="login-brand-header">
          <div className="brand-icon-circle">
            <Layers size={32} />
          </div>
          <h2>Workfront Logger</h2>
          <p>Enterprise Operations & Project Management Suite</p>
        </div>

        {/* ERROR / SUCCESS ALERTS */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} /> {successMessage}
          </div>
        )}

        {/* MODE 1: SIGN IN FORM */}
        {mode === 'signIn' && (
          <form onSubmit={handleSignIn}>
            <div className="login-form-group">
              <label>Username, Name, or Email</label>
              <div className="login-input-wrap">
                <User size={18} />
                <input
                  type="text"
                  placeholder="e.g. subhasri or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="login-input-field"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgotPassword'); setErrorMessage(''); setSuccessMessage(''); }}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="login-input-wrap">
                <Lock size={18} />
                <input
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input-field"
                />
              </div>
            </div>

            <button type="submit" className="login-btn-primary">
              Sign In
            </button>
          </form>
        )}

        {/* MODE 2: FORGOT PASSWORD RECOVERY FLOW */}
        {mode === 'forgotPassword' && (
          <div>
            <button
              type="button"
              onClick={() => { setMode('signIn'); setRecoveryStep(1); setErrorMessage(''); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>

            {recoveryStep === 1 && (
              <form onSubmit={handleLookupSecretQuestion}>
                <div style={{ marginBottom: '1rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  Enter your Username or Name to retrieve your secret security question:
                </div>
                <div className="login-form-group">
                  <label>Username or Name</label>
                  <div className="login-input-wrap">
                    <User size={18} />
                    <input
                      type="text"
                      placeholder="e.g. subhasri or indrajit"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="login-input-field"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn-primary">
                  Find Security Question
                </button>
              </form>
            )}

            {recoveryStep === 2 && matchedProfile && (
              <form onSubmit={handleResetPassword}>
                <div style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Secret Security Question:</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <HelpCircle size={16} color="#818cf8" /> {matchedProfile.secretQuestion || 'What is your favorite campaign tool?'}
                  </div>
                </div>

                <div className="login-form-group">
                  <label>Your Secret Answer</label>
                  <div className="login-input-wrap">
                    <KeyRound size={18} />
                    <input
                      type="text"
                      placeholder="Enter secret answer..."
                      value={secretAnswerInput}
                      onChange={(e) => setSecretAnswerInput(e.target.value)}
                      className="login-input-field"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="login-form-group">
                  <label>New Password</label>
                  <div className="login-input-wrap">
                    <Lock size={18} />
                    <input
                      type="password"
                      placeholder="Enter new password..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="login-input-field"
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn-primary">
                  Reset Password & Sign In
                </button>
              </form>
            )}
          </div>
        )}

        {/* QUICK DEMO LOGIN SELECTOR FOR EASY TESTING */}
        <div className="login-demo-selector-box">
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>
            ⚡ Demo Instant Access (1-Click Login):
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) handleQuickDemoLogin(e.target.value);
            }}
            defaultValue=""
            style={{
              width: '100%',
              padding: '0.55rem',
              background: '#0f172a',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="" disabled>-- Select Demo Account --</option>
            <option value="System Admin">System Admin (Admin)</option>
            <option value="Subhasri">Subhasri (SPOC / Email Dev)</option>
            <option value="Indrajit">Indrajit (SPOC / Campaign Builder)</option>
            <option value="Jagadesh">Jagadesh (SPOC / Email QA)</option>
            <option value="Mohanapriya">Mohanapriya (Email Dev)</option>
            <option value="Ambarish">Ambarish (Campaign Builder)</option>
            <option value="Suwetha">Suwetha (Campaign QA)</option>
            <option value="Sathya">Sathya (CoE Team)</option>
          </select>
        </div>

      </div>
    </div>
  );
}
