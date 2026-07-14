export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
}

export class SessionMemory {
  private sessions: Map<string, ChatMessage[]> = new Map();
  private maxHistory: number = 20; // Sliding window limit

  public getSessionHistory(sessionId: string): ChatMessage[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
  }

  public appendMessage(sessionId: string, role: 'user' | 'model' | 'system', content: string): void {
    const history = this.getSessionHistory(sessionId);
    history.push({
      role,
      content,
      timestamp: new Date()
    });

    // Enforce sliding window to optimize context memory footprint
    if (history.length > this.maxHistory) {
      this.sessions.set(sessionId, history.slice(history.length - this.maxHistory));
    }
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const sessionMemoryInstance = new SessionMemory();
