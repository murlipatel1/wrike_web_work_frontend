/**
 * API utility functions
 */
import { Task, User, ApiLog, Setting} from '../types';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Generic fetch function with error handling
 */
async function fetchFromApi<T>(endpoint: string): Promise<T> {
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
export const fetchTasks = (): Promise<Task[]> => fetchFromApi<Task[]>('/api/tasks');

/**
 * Fetch users from API
 * @returns Promise with an array of User objects
 */
export const fetchUsers = (): Promise<User[]> => fetchFromApi<User[]>('/api/users');

/**
 * Fetch API logs from API
 * @returns Promise with an array of ApiLog objects
 */
export const fetchApiLogs = (): Promise<ApiLog[]> => fetchFromApi<ApiLog[]>('/api/api-logs');

/**
 * Fetch settings from API
 * @returns Promise with an array of Setting objects
 */
export const fetchSettings = (): Promise<Setting[]> => fetchFromApi<Setting[]>('/api/settings');

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
    const [tasks, users, apiLogs, settings] = await Promise.all([
      fetchTasks(),
      fetchUsers(),
      fetchApiLogs(),
      fetchSettings()
    ]);
    
    return { tasks, users, apiLogs, settings };
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