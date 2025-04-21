"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Task, User, ApiLog, Setting } from '../types';
import { fetchDashboardData } from '../utils/api';
import { useAuth } from '../providers/AuthProvider';

export default function Dashboard() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not authenticated, redirect to login
    // if (!isAuthenticated) {
    //   router.push('/login');
    //   return;
    // }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data using the utility function
        const { tasks: tasksData, users: usersData, apiLogs: apiLogsData, settings: settingsData } = 
          await fetchDashboardData();
        
        setTasks(tasksData);
        setUsers(usersData);
        console.log(usersData);
        setApiLogs(apiLogsData);
        setSettings(settingsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, router]);

  // Calculate stats
  const totalTasks = tasks.length;
  const totalUsers = users.length;
  const tasksWithEffort = tasks.filter(task => task.wrikeEffort > 0).length;
  const completionRate = totalTasks > 0 ? Math.round((tasksWithEffort / totalTasks) * 100) : 0;

  // Calculate total API calls
  const totalWrikeApiCalls = apiLogs.reduce((total, log) => total + (log.wrikeApiCalls || 0), 0);
  const totalWebworkApiCalls = apiLogs.reduce((total, log) => total + (log.webworkApiCalls || 0), 0);
  const totalDatabaseApiCalls = apiLogs.reduce((total, log) => total + (log.databaseApiCalls || 0), 0);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading dashboard...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wrike - Webwork Integration Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>{user?.email}</span>
          <button 
            className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-black">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completionRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalWrikeApiCalls + totalWebworkApiCalls + totalDatabaseApiCalls}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tasks" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="api-logs">API Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className='text-black'>
          <Card>
            <CardHeader>
              <CardTitle>Task List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Email</th>
                      <th className="border p-2 text-left">Wrike Task ID</th>
                      <th className="border p-2 text-left">Webwork Task ID</th>
                      <th className="border p-2 text-left">Start Date</th>
                      <th className="border p-2 text-left">End Date</th>
                      <th className="border p-2 text-left">Effort (hrs)</th>
                      <th className="border p-2 text-left">Time Spent (hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.wrikeTaskId} className="hover:bg-gray-50">
                        <td className="border p-2">{task.email}</td>
                        <td className="border p-2">{task.wrikeTaskId}</td>
                        <td className="border p-2">{task.webworkTaskId}</td>
                        <td className="border p-2">{new Date(task.wrikeStartDate).toLocaleDateString()}</td>
                        <td className="border p-2">{new Date(task.wrikeEndDate).toLocaleDateString()}</td>
                        <td className="border p-2">{task.wrikeEffort}</td>
                        <td className="border p-2">{task.timeSpent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users" className='text-black'>
          <Card>
            <CardHeader>
              <CardTitle>User List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Email</th>
                      <th className="border p-2 text-left">Wrike ID</th>
                      <th className="border p-2 text-left">Webwork ID</th>
                      <th className="border p-2 text-left">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="border p-2">{user.email}</td>
                        <td className="border p-2">{user.wrikeId}</td>
                        <td className="border p-2">{user.webworkId}</td>
                        <td className="border p-2">{new Date(user.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Logs Tab */}
        <TabsContent value="api-logs" className='text-black'>
          <Card>
            <CardHeader>
              <CardTitle>API Call Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Timestamp</th>
                      <th className="border p-2 text-left">Wrike API Calls</th>
                      <th className="border p-2 text-left">Webwork API Calls</th>
                      <th className="border p-2 text-left">Database API Calls</th>
                      <th className="border p-2 text-left">Total Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.map(log => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="border p-2">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="border p-2">{log.wrikeApiCalls}</td>
                        <td className="border p-2">{log.webworkApiCalls}</td>
                        <td className="border p-2">{log.databaseApiCalls}</td>
                        <td className="border p-2">{log.wrikeApiCalls + log.webworkApiCalls + log.databaseApiCalls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className='text-black'>
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Key</th>
                      <th className="border p-2 text-left">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map(setting => (
                      <tr key={setting.key} className="hover:bg-gray-50">
                        <td className="border p-2">{setting.key}</td>
                        <td className="border p-2">{setting.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
