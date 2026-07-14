import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserCheck, Shield, Clock, Plus, MapPin } from 'lucide-react';

interface Volunteer {
  id: string;
  name: string;
  assignedSection: string;
  skills: string[];
  status: 'Available' | 'Active' | 'OnBreak' | 'Offline';
  currentTask: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export const VolunteerPortal: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [name, setName] = useState('');
  
  // Check-in helper states
  const [activeCheckInId, setActiveCheckInId] = useState<string | null>(null);
  const [section, setSection] = useState('Gate 1 North');
  const [skills, setSkills] = useState('');

  const fetchVolunteers = async () => {
    try {
      const data = await api.get<Volunteer[]>('/api/volunteers');
      setVolunteers(data);
    } catch (err) {
      console.error('Failed to load volunteer roster:', err);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.post('/api/volunteers/register', { name });
      setName('');
      fetchVolunteers();
    } catch (err) {
      alert(`Registration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCheckInSubmit = async (volunteerId: string) => {
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      await api.patch(`/api/volunteers/${volunteerId}/check-in`, {
        assignedSection: section,
        skills: skillsArray
      });

      setActiveCheckInId(null);
      setSkills('');
      fetchVolunteers();
    } catch (err) {
      alert(`Check-in failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCheckOut = async (volunteerId: string) => {
    try {
      await api.patch(`/api/volunteers/${volunteerId}/check-out`, {});
      fetchVolunteers();
    } catch (err) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="grid-cols-12" id="volunteers-view">
      
      {/* Roster list */}
      <div className="col-span-8 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>Staff & Volunteer Roster</h2>
        
        {volunteers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No volunteers registered.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {volunteers.map((vol) => (
              <div
                key={vol.id}
                style={{
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{vol.name}</span>
                  
                  {/* Status Badge */}
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 'bold',
                      backgroundColor:
                        vol.status === 'Active' ? 'rgba(0, 220, 100, 0.15)' :
                        vol.status === 'Available' ? 'rgba(50, 150, 255, 0.15)' :
                        'rgba(120, 120, 120, 0.15)',
                      color:
                        vol.status === 'Active' ? 'var(--color-accent)' :
                        vol.status === 'Available' ? 'var(--color-primary)' :
                        'var(--text-secondary)'
                    }}
                  >
                    {vol.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    <span>Zone: {vol.assignedSection}</span>
                  </div>
                  {vol.currentTask && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={14} />
                      <span>Task: {vol.currentTask}</span>
                    </div>
                  )}
                  {vol.checkInTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>In: {new Date(vol.checkInTime).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {vol.skills.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {vol.skills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        #{s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions checkin/checkout form */}
                {vol.status === 'Offline' && (
                  <div style={{ marginTop: '8px' }}>
                    {activeCheckInId === vol.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Assigned Section</label>
                          <select className="form-input" style={{ padding: '6px' }} value={section} onChange={e => setSection(e.target.value)}>
                            <option>Gate 1 North</option>
                            <option>Gate 2 East</option>
                            <option>Gate 3 South</option>
                            <option>Gate 4 West</option>
                            <option>Section A Corridor</option>
                            <option>Section C Stands</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '8px' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Skills (comma separated)</label>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: '6px' }}
                            placeholder="e.g. First Aid, Crowd Control, Spanish"
                            value={skills}
                            onChange={e => setSkills(e.target.value)}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-primary" onClick={() => handleCheckInSubmit(vol.id)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Check In</button>
                          <button className="btn btn-secondary" onClick={() => setActiveCheckInId(null)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-accent"
                        onClick={() => setActiveCheckInId(vol.id)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <UserCheck size={12} />
                        <span>Check In Shift</span>
                      </button>
                    )}
                  </div>
                )}

                {vol.status !== 'Offline' && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleCheckOut(vol.id)}
                    style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem', marginTop: '6px' }}
                  >
                    Check Out Shift
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster Signup Form */}
      <div className="col-span-4 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={20} color="var(--color-accent)" />
          <span>Register Roster Profile</span>
        </h2>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Volunteer Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe, Elena Rostova"
              required
            />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '10px' }}>
            Register Volunteer Profile
          </button>
        </form>
      </div>

    </div>
  );
};
