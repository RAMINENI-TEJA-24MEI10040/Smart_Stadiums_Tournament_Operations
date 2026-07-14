import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, MapPin, User, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TimelineEntry {
  status: string;
  comment: string;
  timestamp: string;
  updatedBy: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: string;
  location: string;
  reportedBy: string;
  assignedStaff: string | null;
  aiSummary: string | null;
  timeline: TimelineEntry[];
  createdAt: string;
}

export const IncidentCenter: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const { user } = useAuth();

  // Create form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [location, setLocation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dispatch staff assignment states
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const data = await api.get<Incident[]>('/api/incidents');
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents list:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!title || !description || !location) {
        throw new Error('Please fill in all incident parameters.');
      }

      await api.post('/api/incidents', {
        title,
        description,
        severity,
        location
      });

      setSuccessMsg('Emergency incident ticket created and dispatched successfully!');
      setTitle('');
      setDescription('');
      setLocation('');
      fetchIncidents();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAssignStaff = async (incidentId: string) => {
    if (!staffName.trim()) return;
    try {
      await api.patch(`/api/incidents/${incidentId}/assign`, { assignedStaff: staffName });
      setStaffName('');
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err) {
      alert(`Assignment failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleUpdateStatus = async (incidentId: string, status: string, comment: string) => {
    try {
      await api.patch(`/api/incidents/${incidentId}/status`, { status, comment });
      fetchIncidents();
    } catch (err) {
      alert(`Status update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const generateBriefing = async (incidentId: string) => {
    setLoadingSummaryId(incidentId);
    try {
      await api.post(`/api/incidents/${incidentId}/summary`, {});
      fetchIncidents();
    } catch (err) {
      alert(`AI Brief generation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingSummaryId(null);
    }
  };

  return (
    <div className="grid-cols-12" id="incidents-view">
      
      {/* Live Incidents Feed */}
      <div className="col-span-8 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>Active Safety & Dispatch Tickets</h2>

        {incidents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active incidents logged.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{inc.title}</span>
                  
                  {/* Severity Badge */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        backgroundColor:
                          inc.severity === 'Critical' ? 'rgba(255, 0, 0, 0.2)' :
                          inc.severity === 'High' ? 'rgba(255, 120, 0, 0.15)' :
                          inc.severity === 'Medium' ? 'rgba(255, 170, 0, 0.15)' :
                          'rgba(50, 150, 255, 0.15)',
                        color:
                          inc.severity === 'Critical' ? 'var(--color-danger)' :
                          inc.severity === 'High' ? 'var(--color-danger)' :
                          inc.severity === 'Medium' ? 'var(--color-warning)' :
                          'var(--color-primary)'
                      }}
                    >
                      {inc.severity}
                    </span>
                    
                    {/* Status Badge */}
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        backgroundColor: 'var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{inc.description}</p>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    <span>Location: {inc.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} />
                    <span>Responder: {inc.assignedStaff || 'Unassigned'}</span>
                  </div>
                </div>

                {/* AI Executive Briefing Block */}
                {inc.aiSummary ? (
                  <div style={{ marginTop: '10px', padding: '12px', backgroundColor: 'rgba(100, 150, 255, 0.08)', border: '1px solid rgba(100,150,255,0.2)', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', marginBottom: '6px' }}>
                      <Sparkles size={14} />
                      <span>AI Orchestrated Executive Incident Briefing</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{inc.aiSummary}</div>
                  </div>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => generateBriefing(inc.id)}
                    disabled={loadingSummaryId === inc.id}
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sparkles size={12} color="var(--color-primary)" />
                    <span>{loadingSummaryId === inc.id ? 'Generating AI Brief...' : 'Generate AI Briefing Summary'}</span>
                  </button>
                )}

                {/* Actions Section (Managers / Responders) */}
                {(user?.role === 'OpsManager' || user?.role === 'Security') && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {/* Assign Staff inline trigger */}
                    {selectedIncident === inc.id ? (
                      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Staff Name..."
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          style={{ padding: '4px var(--spacing-sm)', fontSize: '0.85rem' }}
                        />
                        <button className="btn btn-accent" onClick={() => handleAssignStaff(inc.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Dispatch</button>
                        <button className="btn btn-secondary" onClick={() => setSelectedIncident(null)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedIncident(inc.id)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Assign Responder
                      </button>
                    )}

                    {inc.status !== 'Resolved' && (
                      <>
                        <button
                          className="btn btn-accent"
                          onClick={() => handleUpdateStatus(inc.id, 'Resolving', 'Incident response team coordinates resolution on-site.')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Mark Resolving
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUpdateStatus(inc.id, 'Resolved', 'Incident fully cleared and resolved.')}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Incident Ticket Form */}
      <div className="col-span-4 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={20} color="var(--color-danger)" />
          <span>Report Safety Incident</span>
        </h2>

        <form onSubmit={handleReportSubmit}>
          {errorMsg && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginBottom: '10px', fontWeight: 'bold' }}>
              ✓ {successMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Incident Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fire Indicator alarm, Crowd stampede"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Severity Level</label>
            <select
              className="form-input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
            >
              <option value="Low">Low (Facilities issue)</option>
              <option value="Medium">Medium (Minor medical/crowd)</option>
              <option value="High">High (Security threat)</option>
              <option value="Critical">Critical (Immediate Evacuation)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Location</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Section D row 5, East Tunnel entrance"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Description</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the situation..."
              rows={4}
              style={{ resize: 'vertical' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '10px' }}>
            Dispatch Safety Ticket
          </button>
        </form>
      </div>

    </div>
  );
};
