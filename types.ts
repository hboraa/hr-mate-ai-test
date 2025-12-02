export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  department: string;
  joinDate: string;
  leaveBalance: number;
  position: string;
  email: string;
  avatarUrl: string;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string; // HTML or Markdown content
  lastUpdated: string;
}

export interface StructuredResponse {
  summary: string;
  details?: string;
  relatedPolicyId?: string;
  relatedPolicyName?: string;
  suggestions?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  structuredData?: StructuredResponse;
  isThinking?: boolean;
  relatedPolicyId?: string; // Legacy support
  actionRequired?: {
    type: 'DRAFT_LEAVE' | 'CONFIRM_ACTION';
    data: any;
  };
  toolCallId?: string;
}

export interface EmployeeSearchResult {
  name: string;
  role: string;
  department: string;
  phone: string;
  location: string;
}

export interface AnalyticsData {
  category: string;
  count: number;
}