import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { OperationsDashboard } from './views/OperationsDashboard';
import { MatchScheduler } from './views/MatchScheduler';
import { IncidentCenter } from './views/IncidentCenter';
import { VolunteerPortal } from './views/VolunteerPortal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { api } from './services/api';
import { Calendar, AlertTriangle, Users, Sun, Moon, Eye, LogOut, Layout } from 'lucide-react';

export const App: React.FC = () => {
  const { user, token, login, logout } = useAuth();
  const { theme, contrast, toggleTheme, toggleContrast } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'incidents' | 'volunteers'>('dashboard');
  
  // Login form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OpsManager' | 'Director' | 'Security' | 'Volunteer'>('OpsManager');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await api.post<any>('/api/auth/login', { username, password });
      login(res.token, res.user);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.post('/api/auth/register', { username, password, role, name, email });
      setIsRegistering(false);
      setUsername('');
      setPassword('');
      alert('Registration successful! Please login.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const forceRefreshViews = () => {
    // Triggers layout updates
    setActiveTab(prev => prev);
  };

  // 1. Unauthenticated Login/Register Layout
  if (!token) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          padding: 'var(--spacing-md)'
        }}
      >
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
            <span style={{ fontSize: '3rem' }}>🏟️</span>
          </div>
          
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)', fontSize: '1.4rem' }}>
            Smart Stadium Operations
          </h2>

          <form onSubmit={isRegistering ? handleRegisterSubmit : handleLoginSubmit}>
            {errorMsg && (
              <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 'bold' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {isRegistering && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus Aurelius"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. marcus@stadium.org"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Access Role Authorization</label>
                  <select
                    className="form-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="OpsManager">Operations Manager</option>
                    <option value="Director">Tournament Director</option>
                    <option value="Security">Safety Security Officer</option>
                    <option value="Volunteer">Field Volunteer Agent</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {isRegistering ? 'Register Roster User' : 'Sign In Securely'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--spacing-md)', textAlign: 'center', fontSize: '0.85rem' }}>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg(null);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegistering ? 'Back to Sign In' : 'Need authorization access? Register profile'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Dashboard Layout
  return (
    <div className="app-container">
      {/* Skip to content accessibility link */}
      <a href="#main-content-section" className="skip-link">Skip to main content</a>

      {/* Main Operations Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          padding: '12px var(--spacing-lg)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 900
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem' }}>🏟️</span>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Smart Stadium Command Center</h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Session: <strong>{user?.name}</strong> ({user?.role})
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          {/* Contrast high toggle */}
          <button
            className="btn btn-secondary"
            onClick={toggleContrast}
            style={{ padding: '8px' }}
            aria-label={contrast === 'high' ? 'Disable High Contrast Mode' : 'Enable High Contrast Mode'}
          >
            <Eye size={18} />
          </button>

          {/* Theme light/dark toggle */}
          <button
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '8px' }}
            aria-label={theme === 'dark' ? 'Toggle Light Theme' : 'Toggle Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Logout button */}
          <button
            className="btn btn-secondary"
            onClick={logout}
            style={{ padding: '8px' }}
            aria-label="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-md)',
          padding: '8px var(--spacing-md)'
        }}
      >
        <button
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Layout size={16} />
          <span>Live Operations</span>
        </button>

        <button
          className={`btn ${activeTab === 'matches' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('matches')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Calendar size={16} />
          <span>Tournament Matches</span>
        </button>

        <button
          className={`btn ${activeTab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('incidents')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <AlertTriangle size={16} />
          <span>Security Tickets</span>
        </button>

        <button
          className={`btn ${activeTab === 'volunteers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('volunteers')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Users size={16} />
          <span>Volunteer Roster</span>
        </button>
      </nav>

      {/* Main View Area */}
      <main className="main-content" id="main-content-section" tabIndex={-1}>
        {activeTab === 'dashboard' && <OperationsDashboard />}
        {activeTab === 'matches' && <MatchScheduler />}
        {activeTab === 'incidents' && <IncidentCenter />}
        {activeTab === 'volunteers' && <VolunteerPortal />}
      </main>

      {/* AI Assistant drawer */}
      <AIAssistantDrawer onToolExecuted={forceRefreshViews} />
    </div>
  );
};
export default App;
