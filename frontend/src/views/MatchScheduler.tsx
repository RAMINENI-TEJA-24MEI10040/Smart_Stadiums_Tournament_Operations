import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { User, MapPin, AlertCircle, Plus, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  endTime: string;
  status: string;
  venue: string;
  referee: string;
  safetyLog: string[];
}

export const MatchScheduler: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const { user } = useAuth();
  
  // Creation form states
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('Stadium Main Arena');
  const [referee, setReferee] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      const data = await api.get<Match[]>('/api/matches');
      setMatches(data);
    } catch (err) {
      console.error('Failed to load matches list:', err);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Validate inputs
      if (!homeTeam || !awayTeam || !startTime || !endTime || !referee) {
        throw new Error('All fields are required.');
      }

      const isoStart = new Date(startTime).toISOString();
      const isoEnd = new Date(endTime).toISOString();

      await api.post('/api/matches', {
        homeTeam,
        awayTeam,
        startTime: isoStart,
        endTime: isoEnd,
        venue,
        referee
      });

      setSuccessMsg('Match scheduled successfully with zero venue booking conflicts!');
      setHomeTeam('');
      setAwayTeam('');
      setStartTime('');
      setEndTime('');
      setReferee('');
      fetchMatches();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="grid-cols-12" id="tournament-view">
      
      {/* List of Scheduled Matches */}
      <div className="col-span-8 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)' }}>Tournament Match Calendar</h2>
        
        {matches.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matches scheduled yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map((match) => (
              <div
                key={match.id}
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
                  <span
                    style={{
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      color: 'var(--color-primary)'
                    }}
                  >
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor:
                        match.status === 'Live' ? 'rgba(255, 0, 0, 0.15)' :
                        match.status === 'Completed' ? 'rgba(0, 220, 100, 0.15)' :
                        'rgba(120, 120, 120, 0.15)',
                      color:
                        match.status === 'Live' ? 'var(--color-danger)' :
                        match.status === 'Completed' ? 'var(--color-accent)' :
                        'var(--text-secondary)'
                    }}
                  >
                    {match.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    <span>{new Date(match.startTime).toLocaleTimeString()} - {new Date(match.endTime).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    <span>{match.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} />
                    <span>Ref: {match.referee}</span>
                  </div>
                </div>

                {/* Safety Log Accordion */}
                <div style={{ marginTop: '8px', padding: '10px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Safety & Operational Logs:</div>
                  <ul style={{ listStyleType: 'circle', paddingLeft: '16px' }}>
                    {match.safetyLog.map((log, idx) => (
                      <li key={idx}>{log}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Form Panel */}
      <div className="col-span-4 glass-panel">
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={20} color="var(--color-primary)" />
          <span>Schedule New Match</span>
        </h2>

        {/* Roles restrict warning */}
        {user?.role !== 'OpsManager' && user?.role !== 'Director' ? (
          <div style={{ display: 'flex', gap: '8px', padding: '12px', border: '1px solid var(--color-warning)', borderRadius: '8px', backgroundColor: 'rgba(255, 170, 0, 0.05)', fontSize: '0.85rem' }}>
            <AlertCircle color="var(--color-warning)" size={16} />
            <span>Only Operations Managers and Directors have scheduling clearance.</span>
          </div>
        ) : (
          <form onSubmit={handleScheduleSubmit}>
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
              <label className="form-label">Home Team Name</label>
              <input
                type="text"
                className="form-input"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="e.g. Manchester City"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Away Team Name</label>
              <input
                type="text"
                className="form-input"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="e.g. Real Madrid"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stadium Court/Venue</label>
              <select
                className="form-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              >
                <option>Stadium Main Arena</option>
                <option>Court North Entrance A</option>
                <option>South Training Grounds</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Referee Assigned</label>
              <input
                type="text"
                className="form-input"
                value={referee}
                onChange={(e) => setReferee(e.target.value)}
                placeholder="e.g. Pierluigi Collina"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              Confirm Booking Schedule
            </button>
          </form>
        )}
      </div>

    </div>
  );
};
