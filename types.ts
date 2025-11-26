export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  mobile: string;
  emergencyContact: string;
  bloodGroup: string;
  healthIssues: string;
  language?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingSources?: GroundingSource[];
  isError?: boolean;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
  sourceType: 'search' | 'map';
}

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  MAPS = 'MAPS',
  PROFILE = 'PROFILE'
}

export interface HospitalLocation {
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  openNow?: boolean;
}