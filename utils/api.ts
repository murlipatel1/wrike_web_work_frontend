/**
 * API utility functions
 */
import { Task, User, ApiLog, Setting } from '../types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Add response type interfaces
interface ApiListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

/**
 * Generic fetch function with error handling
 */
export async function fetchFromApi<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetch tasks from API
 * @returns Promise with an array of Task objects
 */
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetchFromApi<ApiListResponse<Task>>('/api/tasks');
  return response.data;
};

/**
 * Fetch users from API
 * @returns Promise with an array of User objects
 */
export const fetchUsers = async (): Promise<User[]> => {
  const response = await fetchFromApi<ApiListResponse<User>>('/api/users');
  return response.data;
};

/**
 * Fetch API logs from API
 * @returns Promise with an array of ApiLog objects
 */
export const fetchApiLogs = async (): Promise<ApiLog[]> => {
  const response = await fetchFromApi<ApiListResponse<ApiLog>>('/api/api-logs');
  return response.data;
};

/**
 * Fetch settings from API
 * @returns Promise with an array of Setting objects
 */
// export const fetchSettings = async (): Promise<Setting[]> => {
//   const response = await fetchFromApi<ApiListResponse<Setting>>('/api/settings');
//   return response.data;
// };

/**
 * Interface for dashboard data returned from the API
 */
interface DashboardData {
  tasks: Task[];
  users: User[];
  apiLogs: ApiLog[];
  settings: Setting[];
}

/**
 * Fetch all dashboard data in parallel
 * @returns Promise with an object containing all dashboard data
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const [tasks, users, apiLogs] = await Promise.all([
      fetchTasks(),
      fetchUsers(),
      fetchApiLogs(),
      // fetchSettings()
    ]);
    
    return { tasks, users, apiLogs, settings: [] }; // settings is currently empty
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Post data to API
 * @param endpoint - API endpoint
 * @param data - Data to post
 * @returns Promise with the response data
 */
export async function postToApi<T, R>(endpoint: string, data: T): Promise<R> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error posting to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Update data via API
 * @param endpoint - API endpoint
 * @param data - Data to update
 * @returns Promise with the response data
 */
export async function updateApi<T, R>(endpoint: string, data: T): Promise<R> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Delete data via API
 * @param endpoint - API endpoint
 * @returns Promise with the response data
 */
export async function deleteFromApi<R>(endpoint: string): Promise<R> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting from ${endpoint}:`, error);
    throw error;
  }
}