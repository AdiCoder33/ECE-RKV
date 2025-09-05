import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { User } from '@/types';
import UserModal from './UserModal';
import ImportUsersModal from './ImportUsersModal';
import { useToast } from '@/components/ui/use-toast';
import { motion } from "framer-motion";
import loaderMp2 from '@/Assets/loader.mp4';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Theme colors
const THEME = {
  bgBeige: '#fbf4ea',
  bgSoft: '#fdfaf6',
  accent: '#8b0000',
  accentHover: '#a52a2a',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

const UserManagement: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [popup, setPopup] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [viewUser, setViewUser] = useState<User | null>(null); // Add this state
  const { toast } = useToast();

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: Array<Record<string, unknown>> = await response.json();
      const mapped: User[] = data.map((u) => {
        const { roll_number, created_at, profile_image, id, ...rest } =
          u as Record<string, unknown>;
        return {
          id: typeof id === 'number' ? id : Number(id),
          ...(rest as Omit<User, 'id' | 'rollNumber' | 'createdAt' | 'profileImage'>),
          rollNumber:
            ((u as Record<string, unknown>).rollNumber as string | undefined) ??
            (roll_number as string | undefined),
          createdAt:
            ((u as Record<string, unknown>).createdAt as string | undefined) ??
            (created_at as string | undefined),
          profileImage:
            ((u as Record<string, unknown>).profileImage as string | undefined) ??
            (profile_image as string | undefined),
        } as User;
      });
      setUsers(mapped);
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      setError(msg);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, apiBase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Map role -> badge classes
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#6b0f0f] text-white';
      case 'hod':
        return 'bg-[#7b3f4a] text-white';
      case 'professor':
        return 'bg-[#0f766e] text-white';
      case 'student':
        return 'bg-[#345b7a] text-white';
      case 'alumni':
        return 'bg-[#b86b2e] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Filtering logic
  const filteredUsers = users.filter(user => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      lowerSearch === '' ||
      user.name.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch) ||
      (user.rollNumber ?? '').toLowerCase().includes(lowerSearch);
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesYear = selectedYear === 'all' || user.year?.toString() === selectedYear;
    const matchesSemester = selectedSemester === 'all' || user.semester?.toString() === selectedSemester;
    const matchesSection = selectedSection === 'all' || user.section?.toString() === selectedSection;
    return matchesSearch && matchesRole && matchesYear && matchesSemester && matchesSection;
  });

  // Basic stats
  const userStats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    professors: users.filter(u => u.role === 'professor').length,
    alumni: users.filter(u => u.role === 'alumni').length
  };

  // Add user
  const handleAddUser = async (newUser: Omit<User, 'id'> & { password: string }) => {
    setActionLoading(true);
    try {
      setModalError(null);
      const response = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });
      if (!response.ok) throw new Error('Failed to add user');
      const createdUser: User = await response.json();
      setUsers(prev => [...prev, createdUser]);
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      setPopup({ show: true, message: 'User added successfully!', type: 'success' });
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      setModalError(msg);
      setPopup({ show: true, message: 'Failed to add user', type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  // Bulk import
  const handleImportUsers = async (
    bulkUsers: (Omit<User, 'id'> & { password: string })[]
  ): Promise<{
    inserted: number;
    updated: number;
    results: { index: number; action?: 'inserted' | 'updated'; error?: string }[];
  }> => {
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBase}/users/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ users: bulkUsers })
      });
      if (!response.ok) throw new Error('Failed to import users');
      type BulkResult = { index: number; id?: string; action?: 'inserted' | 'updated'; error?: string };
      const data: { results: BulkResult[] } = await response.json();
      let inserted = 0,
        updated = 0;
      data.results.forEach((item) => {
        if (item.action === 'inserted') inserted++;
        else if (item.action === 'updated') updated++;
      });
      await fetchUsers();
      setPopup({ show: true, message: `Imported: ${inserted}, Updated: ${updated}`, type: 'success' });
      return { inserted, updated, results: data.results };
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      setPopup({ show: true, message: 'Failed to import users', type: 'error' });
      return { inserted: 0, updated: 0, results: [] };
    } finally {
      setActionLoading(false);
      setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  // Update user
  const handleUpdateUser = async (updatedUser: User) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBase}/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedUser)
      });
      if (!response.ok) throw new Error('Failed to update user');
      await fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
      setPopup({ show: true, message: 'User updated successfully!', type: 'success' });
    } catch (err) {
      setPopup({ show: true, message: 'Failed to update user', type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBase}/users/${String(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchUsers();
      setPopup({ show: true, message: 'User deleted successfully!', type: 'success' });
    } catch (err) {
      setPopup({ show: true, message: 'Failed to delete user', type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  // Export filtered users to Excel
  const handleExportUsers = () => {
    setActionLoading(true);
    try {
      const data = filteredUsers.map(user => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Department: user.department ?? '',
        Designation: user.designation ?? '',
        Year: user.year ?? '',
        Semester: user.semester ?? '',
        Section: user.section ?? '',
        RollNumber: user.rollNumber ?? '',
        Phone: user.phone ?? '',
        Password: ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, 'users.xlsx');
      setPopup({ show: true, message: 'Exported successfully!', type: 'success' });
    } catch (err) {
      setPopup({ show: true, message: 'Failed to export users', type: 'error' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setPopup({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  // Loader for button
  const ButtonLoader = () => (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
    </span>
  );

  // ECE-themed loader using loader.mp4 video
  const EceVideoLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp2}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">Loading ECE Users...</div>
      <div className="text-[#a52a2a] text-sm mt-1">Fetching user data, please wait</div>
    </div>
  );

  // Loading / Error states
  if (loading)
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  // ---------- Render ----------
  return (
    <div
      className="min-h-screen p-6 transition-all duration-300"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      {/* Popup */}
      {popup.show && (
        <div className={`fixed z-50 left-1/2 top-6 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white text-sm font-semibold
          ${popup.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {popup.message}
        </div>
      )}

      {/* Header */}
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 style={{ color: THEME.accent }} className="text-3xl font-bold">User Management</h1>
            <p className="mt-1 text-sm text-gray-700">Manage users for the ECE Department</p>
          </div>

          {/* Move buttons left: remove w-full, add 'justify-end' and 'md:ml-auto' for desktop */}
          <div className="flex gap-2 sm:w-auto justify-end md:ml-auto">
            {/* Add User Button */}
            <Button
              className="flex items-center gap-2 px-4 py-2 bg-[#8b0000] hover:bg-[#a52a2a] text-white font-semibold rounded-md transition-transform duration-200 transform hover:scale-105 shadow-lg"
              onClick={() => { setIsModalOpen(true); setEditingUser(null); }}
              disabled={actionLoading}
            >
              <UserPlus className="h-5 w-5" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>

            {/* Import Button */}
            <Button
              className="flex items-center gap-2 px-4 py-2 text-white font-semibold
                         bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500
                         hover:from-yellow-300 hover:via-amber-400 hover:to-orange-400
                         transition-transform duration-200 transform hover:scale-105
                         shadow-lg rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200"
              onClick={() => setIsImportModalOpen(true)}
              disabled={actionLoading}
            >
              {actionLoading ? <ButtonLoader /> : <Download className="h-5 w-5 drop-shadow-sm" />}
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </Button>

            {/* Export Button */}
            <Button
              className="flex items-center gap-2 px-3 py-2 bg-[#8b0000] hover:bg-[#a52a2a] text-white transition-colors rounded-md"
              onClick={handleExportUsers}
              disabled={actionLoading}
            >
              {actionLoading ? <ButtonLoader /> : <Upload className="h-4 w-4" />}
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Stats - Mobile responsive: 2 in a row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#fde8e6]">
                <Users className="h-5 w-5 text-[#8b0000]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#e8f0fb]">
                <GraduationCap className="h-5 w-5 text-[#345b7a]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-2xl font-bold">{userStats.students}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#e8fbf5]">
                <BookOpen className="h-5 w-5 text-[#0f766e]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Professors</p>
                <p className="text-2xl font-bold">{userStats.professors}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#fff6e6]">
                <Users className="h-5 w-5 text-[#b86b2e]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Alumni</p>
                <p className="text-2xl font-bold">{userStats.alumni}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters - Mobile: 2 in a row */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-4 items-start sm:items-center">
              <div className="flex-1 min-w-0 relative w-full col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users (name, email, roll)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#8b0000] focus:ring-[#8b0000] w-full"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#fde8e6] text-[#8b0000] border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] w-full"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="professor">Professors</option>
                <option value="hod">HOD</option>
                <option value="alumni">Alumni</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#e8f0fb] text-[#345b7a] border-[#345b7a] focus:border-[#8b0000] focus:ring-[#8b0000] w-full"
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#fff6e6] text-[#b86b2e] border-[#b86b2e] focus:border-[#8b0000] focus:ring-[#8b0000] w-full"
              >
                <option value="all">All Semesters</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
              </select>

              {/* Section Filter */}
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#f3e8ff] text-[#6b21a8] border-[#6b21a8] focus:border-[#8b0000] focus:ring-[#8b0000] w-full"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="E">Section E</option>
                <option value="F">Section F</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table - Desktop */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg hidden md:block`}>
          <CardHeader className="px-4 pt-4 pb-0">
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm text-gray-700">Name</th>
                    <th className="text-left p-3 text-sm text-gray-700">Email</th>
                    <th className="text-left p-3 text-sm text-gray-700">Role</th>
                    <th className="text-left p-3 text-sm text-gray-700">Designation</th>
                    <th className="text-left p-3 text-sm text-gray-700">Year / Sem / Section</th>
                    <th className="text-left p-3 text-sm text-gray-700">Roll</th>
                    <th className="text-left p-3 text-sm text-gray-700">Phone</th>
                    <th className="text-left p-3 text-sm text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="p-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: '#fff5f5' }}
                          >
                            <span className="text-sm font-medium text-[#8b0000]">
                              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-sm text-gray-600">{user.email}</td>

                      <td className="p-3">
                        <Badge className={getRoleBadgeColor(user.role || '')}>
                          {(user.role || 'N/A').toUpperCase()}
                        </Badge>
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {['professor', 'hod'].includes(user.role || '')
                          ? user.designation || '-'
                          : '-'}
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {user.year && user.semester && user.section
                          ? `${user.year}/${user.semester}/${user.section}`
                          : '-'}
                      </td>

                      <td className="p-3 text-sm text-gray-700">{user.rollNumber || '-'}</td>

                      <td className="p-3 text-sm text-gray-700">{user.phone || '-'}</td>

                      <td className="p-3">
                        <div className="flex gap-2 items-center">
                          {/* View button removed for desktop */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-gray-100 rounded"
                            onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users Cards - Mobile */}
        <div className="md:hidden grid grid-cols-1 gap-3">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}
              style={{ minHeight: 0, height: 'auto' }}
            >
              <CardContent className="p-3 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#fff5f5' }}
                  >
                    <span className="text-xs font-medium text-[#8b0000]">
                      {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                  {user.role !== 'student' && (
                    <Badge
                      className={`${getRoleBadgeColor(user.role || '')} hidden sm:inline-flex text-[10px] px-2 py-0.5`}
                    >
                      {(user.role || 'N/A').toUpperCase()}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-700 mb-2">
                  {user.year && user.semester && user.section && (
                    <>
                      <span className="text-gray-500">Year/Sem/Sec</span>
                      <span>{user.year}/{user.semester}/{user.section}</span>
                    </>
                  )}
                  {['professor', 'hod'].includes(user.role || '') && (
                    <>
                      <span className="text-gray-500">Designation</span>
                      <span>{user.designation || '-'}</span>
                    </>
                  )}
                  <span className="text-gray-500">Roll No</span>
                  <span>{user.rollNumber || '-'}</span>
                  <span className="text-gray-500">Phone</span>
                  <span>{user.phone || '-'}</span>
                </div>

                <div className="flex gap-1 mt-auto">
                  {/* View button for mobile only */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 px-1 py-1 text-xs"
                    onClick={() => setViewUser(user)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 px-1 py-1 text-xs"
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 px-1 py-1"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-gray-600 py-6 col-span-2">No users to show.</div>
          )}
        </div>

        {/* User View Modal for Mobile */}
        <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
          <DialogContent className="max-w-xs w-full p-4 rounded-lg bg-white border-2 border-[#8b0000] shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#8b0000]">
                User Details
              </DialogTitle>
            </DialogHeader>
            {viewUser && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fde8e6] flex items-center justify-center text-xl font-bold text-[#8b0000]">
                    {viewUser.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{viewUser.name}</div>
                    <div className="text-xs text-gray-600">{viewUser.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-700">
                  <span className="text-gray-500">Role</span>
                  <span>{viewUser.role}</span>
                  {['professor', 'hod'].includes(viewUser.role) && (
                    <>
                      <span className="text-gray-500">Designation</span>
                      <span>{viewUser.designation || '-'}</span>
                    </>
                  )}
                  <span className="text-gray-500">Year</span>
                  <span>{viewUser.year || '-'}</span>
                  <span className="text-gray-500">Semester</span>
                  <span>{viewUser.semester || '-'}</span>
                  <span className="text-gray-500">Section</span>
                  <span>{viewUser.section || '-'}</span>
                  <span className="text-gray-500">Roll No</span>
                  <span>{viewUser.rollNumber || '-'}</span>
                  <span className="text-gray-500">Phone</span>
                  <span>{viewUser.phone || '-'}</span>
                  <span className="text-gray-500">Department</span>
                  <span>{viewUser.department || '-'}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modals */}
        <UserModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingUser(null); setModalError(null); }}
          mode={editingUser ? 'edit' : 'add'}
          initialUser={editingUser ?? undefined}
          onSubmit={editingUser ? handleUpdateUser : handleAddUser}
          error={modalError}
          actionLoading={actionLoading}
        />

        <ImportUsersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportUsers={handleImportUsers}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
};

export default UserManagement;
