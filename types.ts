export enum GuardianMode {
  IDLE = 'IDLE',
  MONITORING = 'MONITORING',
  ALERT = 'ALERT'
}

export interface IncidentLog {
  id: string;
  timestamp: Date;
  type: 'FALL' | 'HAZARD' | 'MEDICAL' | 'INFO' | 'CALL' | 'WHATSAPP';
  message: string;
}

export interface StreamConfig {
  frameRate: number;
  quality: number;
}

export interface CallInfo {
  isActive: boolean;
  recipient: string; // e.g., "911", "Parents"
  status: 'DIALING' | 'CONNECTED';
}