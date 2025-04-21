"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Task, User, ApiLog, Setting } from '../types';
import { fetchDashboardData, postToApi, updateApi, deleteFromApi } from '../utils/api';
import { useAuth } from '../providers/AuthProvider';
import { TrashIcon, PencilIcon, PlusIcon } from '../components/ui/icons';

export default function Dashboard() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    wrikeId: '',
    webworkId: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postToApi('/api/users', newUser);
      setIsAddModalOpen(false);
      setNewUser({ email: '', wrikeId: '', webworkId: 0 });
      const { users: refreshedUsers } = await fetchDashboardData();
      setUsers(refreshedUsers);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      await updateApi(`/api/users/${currentUser._id}`, currentUser);
      setIsEditModalOpen(false);
      setCurrentUser(null);
      const { users: refreshedUsers } = await fetchDashboardData();
      setUsers(refreshedUsers);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      await deleteFromApi(`/api/users/${currentUser._id}`);
      setIsDeleteModalOpen(false);
      setCurrentUser(null);
      const { users: refreshedUsers } = await fetchDashboardData();
      setUsers(refreshedUsers);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openEditModal = (user: User) => {
    setCurrentUser({...user});
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setCurrentUser({...user});
    setIsDeleteModalOpen(true);
  };

  const totalTasks = tasks.length;
  const totalUsers = users.length;
  const tasksWithEffort = tasks.filter(task => task.wrikeEffort > 0).length;
  const completionRate = totalTasks > 0 ? Math.round((tasksWithEffort / totalTasks) * 100) : 0;

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
        
        <TabsContent value="users" className='text-black'>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User List</CardTitle>
              <button 
                className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="w-4 h-4" /> Add User
              </button>
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
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="border p-2">{user.email}</td>
                        <td className="border p-2">{user.wrikeId}</td>
                        <td className="border p-2">{user.webworkId}</td>
                        <td className="border p-2">{new Date(user.createdAt).toLocaleString()}</td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button 
                              className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded"
                              onClick={() => openEditModal(user)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              className="bg-red-500 hover:bg-red-700 text-white p-1 rounded"
                              onClick={() => openDeleteModal(user)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
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

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Wrike ID</label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newUser.wrikeId}
                  onChange={(e) => setNewUser({...newUser, wrikeId: e.target.value})}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Webwork ID</label>
                <input
                  type="number"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={newUser.webworkId}
                  onChange={(e) => setNewUser({...newUser, webworkId: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                  type="email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Wrike ID</label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={currentUser.wrikeId}
                  onChange={(e) => setCurrentUser({...currentUser, wrikeId: e.target.value})}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Webwork ID</label>
                <input
                  type="number"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={currentUser.webworkId}
                  onChange={(e) => setCurrentUser({...currentUser, webworkId: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete User</h2>
            <p className="mb-6">
              Are you sure you want to delete user <span className="font-bold">{currentUser.email}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
