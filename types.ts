export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface Agent {
  id: string;
  code: string; // Unique ID
  name: string;
  company: string;
  phone: string;
  password?: string; // Only used for auth check, usually hashed
  status: AgentStatus;
  createdAt: string;
}

export interface Visit {
  id: string;
  agentId: string;
  agentName: string;
  companyVisited: string;
  visitDate: string; // ISO String
  notes: string;
  photoUrl?: string; // Base64
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalAgents: number;
  totalVisits: number;
  visitsToday: number;
  activeAgents: number;
}