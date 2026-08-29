export type CallState = 'idle' | 'ringing' | 'connected' | 'ended';

export interface CallSession {
  id: string;
  peerId: string;
  state: CallState;
  startTime?: number;
}

export class CallingEngine {
  private activeCall?: CallSession;

  startCall(peerId: string): CallSession {
    this.activeCall = {
      id: `call_${Date.now()}`,
      peerId,
      state: 'ringing',
      startTime: Date.now()
    };
    return this.activeCall;
  }

  acceptCall(callId: string): CallSession {
    if (!this.activeCall || this.activeCall.id !== callId) {
      throw new Error(`Call ${callId} not found`);
    }
    this.activeCall.state = 'connected';
    return this.activeCall;
  }

  endCall(callId: string): boolean {
    if (this.activeCall && this.activeCall.id === callId) {
      this.activeCall.state = 'ended';
      this.activeCall = undefined;
      return true;
    }
    return false;
  }
}
