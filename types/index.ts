/**
 * Types for the application
 */

// Task interface based on mongoose schema
export interface Task {
  _id: string;
  wrikeTaskId: string;
  webworkTaskId: number;
  webworkProjectId: number;
  webworkUserId: number;
  email: string;
  wrikeStartDate: string | Date;
  wrikeEndDate: string | Date;
  wrikeEffort: number;
  timeSpent: number;
  createdAt: string | Date;
}

// User interface based on mongoose schema
export interface User {
  _id: string;
  email: string;
  wrikeId: string;
  webworkId: number;
  createdAt: string | Date;
}

// API Log interface based on mongoose schema
export interface ApiLog {
  _id: string;
  wrikeApiCalls: number;
  webworkApiCalls: number;
  databaseApiCalls: number;
  timestamp: string | Date;
}

// Setting interface based on mongoose schema
export interface Setting {
  _id: string;
  key: string;
  value: string;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Dashboard state interface
export interface DashboardState {
  tasks: Task[];
  users: User[];
  apiLogs: ApiLog[];
  settings: Setting[];
  loading: boolean;
  error: string | null;
}

// Dashboard stats interface
export interface DashboardStats {
  totalTasks: number;
  totalUsers: number;
  completionRate: number;
  totalApiCalls: number;
}