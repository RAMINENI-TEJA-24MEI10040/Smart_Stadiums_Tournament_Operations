export type MatchStatus = 'Scheduled' | 'Live' | 'Completed' | 'Delayed';

export class Match {
  constructor(
    public readonly id: string,
    public readonly homeTeam: string,
    public readonly awayTeam: string,
    public readonly startTime: Date,
    public readonly endTime: Date,
    public readonly status: MatchStatus,
    public readonly venue: string,
    public readonly referee: string,
    public readonly safetyLog: string[],
    public readonly createdAt: Date
  ) {}

  public toJSON() {
    return {
      id: this.id,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
      status: this.status,
      venue: this.venue,
      referee: this.referee,
      safetyLog: this.safetyLog,
      createdAt: this.createdAt.toISOString()
    };
  }
}
