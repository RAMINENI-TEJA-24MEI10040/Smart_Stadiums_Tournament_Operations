export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Reported' | 'Dispatched' | 'Resolving' | 'Resolved';

export interface IncidentTimelineEntry {
  status: IncidentStatus;
  comment: string;
  timestamp: string;
  updatedBy: string;
}

export class Incident {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly severity: IncidentSeverity,
    public readonly status: IncidentStatus,
    public readonly location: string,
    public readonly reportedBy: string,
    public readonly assignedStaff: string | null,
    public readonly aiSummary: string | null,
    public readonly timeline: IncidentTimelineEntry[],
    public readonly createdAt: Date
  ) {}

  public toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      severity: this.severity,
      status: this.status,
      location: this.location,
      reportedBy: this.reportedBy,
      assignedStaff: this.assignedStaff,
      aiSummary: this.aiSummary,
      timeline: this.timeline,
      createdAt: this.createdAt.toISOString()
    };
  }
}
