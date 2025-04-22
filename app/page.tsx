"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Task, User, ApiLog, Setting } from '../types';
import { fetchDashboardData, postToApi, updateApi, deleteFromApi, fetchFromApi } from '../utils/api';
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

  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [isBatchSizeModalOpen, setIsBatchSizeModalOpen] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(0);

  const [wrikeToken, setWrikeToken] = useState<string | null>(null);
  const [webworkToken, setWebworkToken] = useState<string | null>(null);
  const [webworkTokenExpiry, setWebworkTokenExpiry] = useState<{
    daysRemaining: number;
    updatedAt: string;
    expiryDate: string;
  } | null>(null);
  const [showWrikeToken, setShowWrikeToken] = useState(false);
  const [showWebworkToken, setShowWebworkToken] = useState(false);
  const [isWrikeTokenModalOpen, setIsWrikeTokenModalOpen] = useState(false);
  const [isWebworkTokenModalOpen, setIsWebworkTokenModalOpen] = useState(false);
  const [newWrikeToken, setNewWrikeToken] = useState('');
  const [newWebworkToken, setNewWebworkToken] = useState('');

  // First, let's add state variables for the search filters
  const [taskSearchEmail, setTaskSearchEmail] = useState<string>('');
  const [userSearchEmail, setUserSearchEmail] = useState<string>('');

  // Then add filter functions to filter the tasks and users
  const filteredTasks = tasks.filter(task => 
    task.email.toLowerCase().includes(taskSearchEmail.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(userSearchEmail.toLowerCase())
  );

  // Add these state variables for API log filtering and pagination
  const [apiLogDateFilter, setApiLogDateFilter] = useState<string>('');
  const [apiLogPage, setApiLogPage] = useState<number>(1);
  const [apiLogsPerPage] = useState<number>(20);

  // Add filter and pagination functions
  const filterApiLogs = () => {
    if (!apiLogDateFilter) return apiLogs;
    
    const filterDate = new Date(apiLogDateFilter);
    filterDate.setHours(0, 0, 0, 0); // Start of day
    
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1); // End of day
    
    return apiLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= filterDate && logDate < nextDay;
    });
  };

  const filteredApiLogs = filterApiLogs();

  // Calculate totals based on filtered logs
  const filteredWrikeApiCalls = filteredApiLogs.reduce((total, log) => total + (log.wrikeApiCalls || 0), 0);
  const filteredWebworkApiCalls = filteredApiLogs.reduce((total, log) => total + (log.webworkApiCalls || 0), 0);
  const filteredDatabaseApiCalls = filteredApiLogs.reduce((total, log) => total + (log.databaseApiCalls || 0), 0);

  // Pagination logic
  const indexOfLastLog = apiLogPage * apiLogsPerPage;
  const indexOfFirstLog = indexOfLastLog - apiLogsPerPage;
  const currentApiLogs = filteredApiLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredApiLogs.length / apiLogsPerPage);

  const paginate = (pageNumber: number) => setApiLogPage(pageNumber);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        const { tasks: tasksData, users: usersData, apiLogs: apiLogsData, settings: settingsData } = 
          await fetchDashboardData();
        
        setTasks(tasksData);
        setUsers(usersData);
        setApiLogs(apiLogsData);
        setSettings(settingsData);
        
        // Also fetch the batch size
        await fetchBatchSize();
        
        // Fetch tokens
        await fetchTokens();
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

  const handleDeleteTask = async () => {
    if (!currentTask) return;
    
    try {
      await deleteFromApi(`/api/tasks/${currentTask.webworkTaskId}`);
      setIsDeleteTaskModalOpen(false);
      setCurrentTask(null);
      // Refresh tasks after deletion
      const { tasks: refreshedTasks } = await fetchDashboardData();
      setTasks(refreshedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const fetchBatchSize = async () => {
    try {
      const response = await fetchFromApi<{success: boolean, data: {batchSize: number}}>('/api/settings/batch-size');
      // Update to match the actual response structure where batchSize is directly in the data object
      const size = response.data.batchSize;
      setBatchSize(isNaN(size) ? 0 : size);
      return size;
    } catch (error) {
      console.error('Error fetching batch size:', error);
      return 0;
    }
  };

  const handleEditBatchSize = () => {
    fetchBatchSize().then(() => {
      setIsBatchSizeModalOpen(true);
    });
  };

  const handleUpdateBatchSize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Update to match the expected payload structure for the API
      await updateApi('/api/settings/batch-size', { batchSize: batchSize });
      setIsBatchSizeModalOpen(false);
      
      // Refresh settings after update
      const { settings: refreshedSettings } = await fetchDashboardData();
      setSettings(refreshedSettings);
    } catch (error) {
      console.error('Error updating batch size:', error);
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

  const openDeleteTaskModal = (task: Task) => {
    setCurrentTask({...task});
    setIsDeleteTaskModalOpen(true);
  };

  const isWebworkTokenExpired = (): boolean => {
    if (!webworkTokenExpiry || !webworkTokenExpiry.daysRemaining) return true;
    return webworkTokenExpiry.daysRemaining <= 0;
  };

  const fetchTokens = async () => {
    try {
      // Fetch Wrike token
      const wrikeResponse = await fetchFromApi<{ success: boolean, data: {
        token: string,
      } }>('/api/tokens/wrike');

      setWrikeToken(wrikeResponse.data.token !== null  ? wrikeResponse.data.token : JSON.stringify(wrikeResponse.data.token));

      // Fetch Webwork token
      const webworkResponse = await fetchFromApi<{ success: boolean, data: {
        token: string,
      } }>('/api/tokens/webwork');
      setWebworkToken(wrikeResponse.data.token !== null ? webworkResponse.data.token : JSON.stringify(wrikeResponse.data.token));

      // Fetch Webwork token expiry
      const expiryResponse = await fetchFromApi<{ 
        success: boolean, 
        data: {
          daysRemaining: number,
          updatedAt: string,
          expiryDate: string,
        }
      }>('/api/tokens/webwork/expiry');
      
      // Store the entire expiry data object
      setWebworkTokenExpiry(expiryResponse.data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  const handleUpdateWrikeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send the token in the correct format expected by the controller
      await updateApi('/api/tokens/wrike', { token: newWrikeToken });
      setIsWrikeTokenModalOpen(false);
      setNewWrikeToken('');
      await fetchTokens();
    } catch (error) {
      console.error('Error updating Wrike token:', error);
    }
  };

  const handleUpdateWebworkToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Send the token in the correct format expected by the controller
      await updateApi('/api/tokens/webwork', { token: newWebworkToken });
      setIsWebworkTokenModalOpen(false);
      setNewWebworkToken('');
      await fetchTokens();
    } catch (error) {
      console.error('Error updating Webwork token:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openWrikeTokenModal = () => {
    // Populate the form with the existing token
    setNewWrikeToken(wrikeToken || '');
    setIsWrikeTokenModalOpen(true);
  };

  const openWebworkTokenModal = () => {
    // Populate the form with the existing token
    setNewWebworkToken(webworkToken || '');
    setIsWebworkTokenModalOpen(true);
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
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className='text-black'>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Task List</CardTitle>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by email..."
                  className="border rounded py-2 px-3 w-full pr-8"
                  value={taskSearchEmail}
                  onChange={(e) => setTaskSearchEmail(e.target.value)}
                />
                {taskSearchEmail && (
                  <button 
                    className="absolute right-2 top-2.5"
                    onClick={() => setTaskSearchEmail('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
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
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map(task => (
                        <tr key={task.wrikeTaskId} className="hover:bg-gray-50">
                          <td className="border p-2">{task.email}</td>
                          <td className="border p-2">{task.wrikeTaskId}</td>
                          <td className="border p-2">{task.webworkTaskId}</td>
                          <td className="border p-2">{new Date(task.wrikeStartDate).toLocaleDateString()}</td>
                          <td className="border p-2">{new Date(task.wrikeEndDate).toLocaleDateString()}</td>
                          <td className="border p-2">{task.wrikeEffort}</td>
                          <td className="border p-2">{task.timeSpent}</td>
                          <td className="border p-2">
                            <div className="flex gap-2">
                              <button 
                                className="bg-red-500 hover:bg-red-700 text-white p-1 rounded"
                                onClick={() => openDeleteTaskModal(task)}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="border p-4 text-center text-gray-500">
                          {taskSearchEmail ? 'No tasks found matching your search.' : 'No tasks available.'}
                        </td>
                      </tr>
                    )}
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
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search by email..."
                    className="border rounded py-2 px-3 w-full pr-8"
                    value={userSearchEmail}
                    onChange={(e) => setUserSearchEmail(e.target.value)}
                  />
                  {userSearchEmail && (
                    <button 
                      className="absolute right-2 top-2.5"
                      onClick={() => setUserSearchEmail('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button 
                  className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <PlusIcon className="w-4 h-4" /> Add User
                </button>
              </div>
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
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center text-gray-500">
                          {userSearchEmail ? 'No users found matching your search.' : 'No users available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api-logs" className='text-black'>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>API Call Logs</CardTitle>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Filter by Date</label>
                  <input
                    type="date"
                    className="border rounded py-1 px-2"
                    value={apiLogDateFilter}
                    onChange={(e) => {
                      setApiLogDateFilter(e.target.value);
                      setApiLogPage(1); // Reset to first page on filter change
                    }}
                  />
                </div>
                {apiLogDateFilter && (
                  <button 
                    className="mt-6 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => {
                      setApiLogDateFilter('');
                      setApiLogPage(1);
                    }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* API Call Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700">Wrike API Calls</h3>
                  <p className="text-2xl font-bold text-blue-900">{filteredWrikeApiCalls}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-700">Webwork API Calls</h3>
                  <p className="text-2xl font-bold text-green-900">{filteredWebworkApiCalls}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-700">Database API Calls</h3>
                  <p className="text-2xl font-bold text-purple-900">{filteredDatabaseApiCalls}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700">Total Calls</h3>
                  <p className="text-2xl font-bold text-gray-900">{filteredWrikeApiCalls + filteredWebworkApiCalls + filteredDatabaseApiCalls}</p>
                </div>
              </div>

              {/* Log data display */}
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
                    {currentApiLogs.length > 0 ? (
                      currentApiLogs.map(log => (
                        <tr key={log._id} className="hover:bg-gray-50">
                          <td className="border p-2">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="border p-2">{log.wrikeApiCalls}</td>
                          <td className="border p-2">{log.webworkApiCalls}</td>
                          <td className="border p-2">{log.databaseApiCalls}</td>
                          <td className="border p-2">{log.wrikeApiCalls + log.webworkApiCalls + log.databaseApiCalls}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border p-4 text-center text-gray-500">
                          {apiLogDateFilter ? 'No logs found for the selected date.' : 'No logs available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {filteredApiLogs.length > apiLogsPerPage && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredApiLogs.length)} of {filteredApiLogs.length} logs
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 border rounded ${apiLogPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      onClick={() => apiLogPage > 1 && paginate(apiLogPage - 1)}
                      disabled={apiLogPage === 1}
                    >
                      Previous
                    </button>
                    
                    {/* Show page numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to determine which page numbers to show
                        let pageNum;
                        if (totalPages <= 5) {
                          // Show all pages if 5 or fewer
                          pageNum = i + 1;
                        } else if (apiLogPage <= 3) {
                          // Show first 5 pages
                          pageNum = i + 1;
                        } else if (apiLogPage >= totalPages - 2) {
                          // Show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show current page and 2 pages before/after
                          pageNum = apiLogPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`px-3 py-1 border rounded ${pageNum === apiLogPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                            onClick={() => paginate(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      className={`px-3 py-1 border rounded ${apiLogPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                      onClick={() => apiLogPage < totalPages && paginate(apiLogPage + 1)}
                      disabled={apiLogPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className='text-black'>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Setting</th>
                      <th className="border p-2 text-left">Value</th>
                      <th className="border p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Display batch size regardless of whether it's in settings array */}
                    <tr className="hover:bg-gray-50">
                      <td className="border p-2">Batch Size</td>
                      <td className="border p-2">{batchSize}</td>
                      <td className="border p-2">
                        <button 
                          className="bg-blue-500 hover:bg-blue-700 text-white p-1 rounded"
                          onClick={handleEditBatchSize}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {/* Display other settings */}
                    {settings.filter(setting => setting.key !== 'batchSize').map(setting => (
                      <tr key={setting.key} className="hover:bg-gray-50">
                        <td className="border p-2">{setting.key}</td>
                        <td className="border p-2">{setting.value}</td>
                        <td className="border p-2">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className='text-black'>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Wrike Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="font-medium w-full">
                    {wrikeToken ? (
                      <div className="flex items-center gap-2">
                        <div className="overflow-hidden text-ellipsis line-clamp-2 break-all">
                          {showWrikeToken ? wrikeToken : '••••••••••••••••••••'}
                        </div>
                        <button 
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          onClick={() => setShowWrikeToken(!showWrikeToken)}
                        >
                          {showWrikeToken ? 'Hide' : 'Show'}
                        </button>
                        <button 
                          className="text-green-500 hover:text-green-700 text-sm"
                          onClick={() => wrikeToken && copyToClipboard(wrikeToken)}
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-red-500">No token available</span>
                    )}
                  </div>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
                    onClick={openWrikeTokenModal}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Webwork Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="font-medium w-full">
                    {webworkToken ? (
                      <div className="flex items-center gap-2">
                        <div className="overflow-hidden text-ellipsis line-clamp-2 break-all">
                          {showWebworkToken ? webworkToken : '••••••••••••••••••••'}
                        </div>
                        <button 
                          className="text-blue-500 hover:text-blue-700 text-sm"
                          onClick={() => setShowWebworkToken(!showWebworkToken)}
                        >
                          {showWebworkToken ? 'Hide' : 'Show'}
                        </button>
                        <button 
                          className="text-green-500 hover:text-green-700 text-sm"
                          onClick={() => webworkToken && copyToClipboard(webworkToken)}
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <span className="text-red-500">No token available</span>
                    )}
                  </div>
                  <button 
                    className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded"
                    onClick={openWebworkTokenModal}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Token Expiry:</div>
                  <div className="flex items-center gap-2">
                    {webworkTokenExpiry ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Days Remaining:</span>
                          <span>{webworkTokenExpiry.daysRemaining}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            isWebworkTokenExpired() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {isWebworkTokenExpired() ? 'Expired' : 'Valid'}
                          </span>
                        </div>
                        {webworkTokenExpiry.expiryDate && (
                          <div>
                            <span className="font-medium">Expiry Date:</span>{' '}
                            {new Date(webworkTokenExpiry.expiryDate).toLocaleDateString()} {new Date(webworkTokenExpiry.expiryDate).toLocaleTimeString()}
                          </div>
                        )}
                        {webworkTokenExpiry.updatedAt && (
                          <div>
                            <span className="font-medium">Last Updated:</span>{' '}
                            {new Date(webworkTokenExpiry.updatedAt).toLocaleDateString()} {new Date(webworkTokenExpiry.updatedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-500">No expiry information available</span>
                    )}
                  </div>
                </div>
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

      {/* Delete Task Confirmation Modal */}
      {isDeleteTaskModalOpen && currentTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Task</h2>
            <p className="mb-6">
              Are you sure you want to delete task <span className="font-bold">#{currentTask.webworkTaskId}</span> for <span className="font-bold">{currentTask.email}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                onClick={() => setIsDeleteTaskModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleDeleteTask}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Size Edit Modal */}
      {isBatchSizeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Batch Size</h2>
            <form onSubmit={handleUpdateBatchSize}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">Batch Size</label>
                <input
                  type="number"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 0)}
                  required
                  min="1"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Number of tasks to process in each batch.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={() => setIsBatchSizeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wrike Token Edit Modal */}
      {isWrikeTokenModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Wrike Token</h2>
            <form onSubmit={handleUpdateWrikeToken}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">New Token</label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-64"
                  value={newWrikeToken}
                  onChange={(e) => setNewWrikeToken(e.target.value)}
                  required
                  placeholder="Enter the new Wrike token"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={() => setIsWrikeTokenModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webwork Token Edit Modal */}
      {isWebworkTokenModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Webwork Token</h2>
            <form onSubmit={handleUpdateWebworkToken}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">New Token</label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-32"
                  value={newWebworkToken}
                  onChange={(e) => setNewWebworkToken(e.target.value)}
                  required
                  placeholder="Enter the new Webwork token"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={() => setIsWebworkTokenModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Update Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
