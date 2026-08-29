export type CallState =
  | 'IDLE'
  | 'INCOMING_RINGTONE'
  | 'CONNECTING'
  | 'ACTIVE_TALKING'
  | 'ACTIVE_LISTENING'
  | 'MUTED'
  | 'ENDED';

export interface CallSessionConfig {
  sessionId: string;
  userId: string;
}

export interface ICallingEngine {
  readonly currentState: CallState;
  initiateCall(config: CallSessionConfig): Promise<void>;
  answerCall(sessionId: string): Promise<void>;
  endCall(sessionId: string): Promise<void>;
  onStateChange(listener: (state: CallState) => void): void;
}
