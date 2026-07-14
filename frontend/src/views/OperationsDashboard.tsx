import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Shield, Wind, Users, Activity, RefreshCw, BarChart2 } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  turnstileFlowRate: number;
  currentOccupancy: number;
  capacityLimit: number;
  status: string;
}

interface Telemetry {
  totalAttendance: number;
  activeGatesCount: number;
  congestedGatesCount: number;
  averageQueueTime: number;
  co2Level: number;
  temperature: number;
  sustainabilityScore: number;
  powerConsumption: number;
  waterUsage: number;
  carbonFootprint: number;
}

interface HealthSummary {
  status: string;
  uptimeSec: number;
  memoryUsagePercentage: number;
  cpuLoadPercentage: number;
  activeDbConnections: number;
  errorsLogged: number;
  aiMetrics: {
    totalRequests: number;
    averageLatencyMs: number;
    totalCostUSD: number;
    hallucinationRate: number;
  };
}

export const OperationsDashboard: React.FC = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [gatesData, telemetryData, healthData] = await Promise.all([
        api.get<Gate[]>('/api/stadium/gates'),
        api.get<Telemetry>('/api/stadium/telemetry'),
        api.get<HealthSummary>('/api/stadium/health')
      ]);

      setGates(gatesData);
      setTelemetry(telemetryData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Draw Heatmap Canvas representation of the stadium sections
  useEffect(() => {
    if (!canvasRef.current || gates.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stadium oval ring outline
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(200, 150, 150, 100, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw stadium pitch inner field
    ctx.strokeStyle = 'rgba(100, 255, 100, 0.2)';
    ctx.fillStyle = 'rgba(100, 255, 100, 0.05)';
    ctx.beginPath();
    ctx.ellipse(200, 150, 80, 50, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw heat hotspots mapping gate congestion loads
    gates.forEach((gate) => {
      let x = 200;
      let y = 150;

      // Assign position coordinates to gates relative to oval layout
      if (gate.name.toLowerCase().includes('north') || gate.id === 'gate-1') { x = 200; y = 45; }
      else if (gate.name.toLowerCase().includes('east') || gate.id === 'gate-2') { x = 360; y = 150; }
      else if (gate.name.toLowerCase().includes('south') || gate.id === 'gate-3') { x = 200; y = 255; }
      else if (gate.name.toLowerCase().includes('west') || gate.id === 'gate-4') { x = 40; y = 150; }

      // Congestion radius scale
      const intensity = gate.currentOccupancy / (gate.capacityLimit || 1);
      const radius = 25 + intensity * 35;

      // Create radial glow gradient representing temperature heat
      const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
      if (gate.status === 'Congested') {
        grad.addColorStop(0, 'rgba(255, 0, 0, 0.85)');
        grad.addColorStop(0.4, 'rgba(255, 120, 0, 0.4)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (gate.status === 'Open') {
        grad.addColorStop(0, 'rgba(0, 220, 100, 0.85)');
        grad.addColorStop(0.4, 'rgba(0, 220, 100, 0.3)');
        grad.addColorStop(1, 'rgba(0, 220, 100, 0)');
      } else {
        grad.addColorStop(0, 'rgba(120, 120, 120, 0.6)');
        grad.addColorStop(1, 'rgba(120, 120, 120, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Label gates textually for high visibility (contrast safe)
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px var(--font-body)';
      ctx.fillText(`${gate.name} (${Math.round(intensity * 100)}%)`, x - 25, y - 5);
    });
  }, [gates]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Loading live telemetry metrics...</div>;
  }

  return (
    <div className="grid-cols-12" id="dashboard-view">
      
      {/* Top Telemetry Widgets Row */}
      <div className="col-span-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
        
        {/* Attendance widget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'rgba(50, 120, 255, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <Users color="var(--color-primary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attendance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{telemetry?.totalAttendance} / 5000</div>
          </div>
        </div>

        {/* Avg queue widget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'rgba(255, 170, 0, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <Activity color="var(--color-warning)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg Queue Delay</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{telemetry?.averageQueueTime} mins</div>
          </div>
        </div>

        {/* Sustainability widget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'rgba(0, 220, 100, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <Shield color="var(--color-accent)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Green Ops Rating</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{telemetry?.sustainabilityScore}%</div>
          </div>
        </div>

        {/* CO2 sensor widget */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'rgba(100, 220, 255, 0.1)', padding: '12px', borderRadius: '50%' }}>
            <Wind color="var(--color-primary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CO2 Concentration</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{telemetry?.co2Level} ppm</div>
          </div>
        </div>
      </div>

      {/* Main Gate list and Heatmap visualization */}
      <div className="col-span-8 glass-panel">
        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>IoT Telemetry Sensor Ingress Nodes</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--spacing-lg)' }}>
          {gates.map((gate) => (
            <div
              key={gate.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{gate.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Flow: {gate.turnstileFlowRate} ppm | Occupancy: {gate.currentOccupancy} / {gate.capacityLimit}
                </div>
              </div>
              
              {/* Gate Status Badge */}
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  backgroundColor:
                    gate.status === 'Open' ? 'rgba(0, 200, 100, 0.15)' :
                    gate.status === 'Congested' ? 'rgba(255, 170, 0, 0.15)' :
                    'rgba(120, 120, 120, 0.15)',
                  color:
                    gate.status === 'Open' ? 'var(--color-accent)' :
                    gate.status === 'Congested' ? 'var(--color-warning)' :
                    'var(--text-secondary)'
                }}
              >
                {gate.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Area */}
      <div className="col-span-4 glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)', alignSelf: 'flex-start' }}>Crowd Density Layout Map</h2>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            maxWidth: '100%',
            height: 'auto'
          }}
          aria-label="Stadium sections showing heat points matching turnstiles load parameters."
        />
      </div>

      {/* Observability openTelemetry health widget */}
      <div className="col-span-12 glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={20} color="var(--color-primary)" />
            <span>Distributed Observability Dashboard (OpenTelemetry metrics)</span>
          </h2>
          <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ padding: '6px 12px' }}>
            <RefreshCw size={14} />
          </button>
        </div>

        {health && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)', fontSize: '0.85rem' }}>
            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>System Health Status</div>
              <span
                style={{
                  fontWeight: 'bold',
                  color: health.status === 'Healthy' ? 'var(--color-accent)' : 'var(--color-danger)'
                }}
              >
                ● {health.status}
              </span>
              <div style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Uptime: {Math.round(health.uptimeSec / 3600)} hrs</div>
            </div>

            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Processor & Cache Load</div>
              <div>CPU Load: {health.cpuLoadPercentage}%</div>
              <div>Memory: {health.memoryUsagePercentage}%</div>
            </div>

            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Database Connection pool</div>
              <div>Active Pools: {health.activeDbConnections} / 20</div>
              <div>Failures / Errors: {health.errorsLogged} logged</div>
            </div>

            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Generative AI Evaluation</div>
              <div>Requests: {health.aiMetrics.totalRequests} calls</div>
              <div>Avg Latency: {health.aiMetrics.averageLatencyMs}ms</div>
              <div>Hallucination: {health.aiMetrics.hallucinationRate}%</div>
              <div>Total Cost: ${health.aiMetrics.totalCostUSD}</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
