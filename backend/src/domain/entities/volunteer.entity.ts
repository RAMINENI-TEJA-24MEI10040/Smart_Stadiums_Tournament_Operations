export type VolunteerStatus = 'Available' | 'Active' | 'OnBreak' | 'Offline';

export class Volunteer {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly name: string,
    public readonly assignedSection: string,
    public readonly skills: string[],
    public readonly status: VolunteerStatus,
    public readonly currentTask: string | null,
    public readonly checkInTime: Date | null,
    public readonly checkOutTime: Date | null
  ) {}

  public toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      assignedSection: this.assignedSection,
      skills: this.skills,
      status: this.status,
      currentTask: this.currentTask,
      checkInTime: this.checkInTime ? this.checkInTime.toISOString() : null,
      checkOutTime: this.checkOutTime ? this.checkOutTime.toISOString() : null
    };
  }
}
