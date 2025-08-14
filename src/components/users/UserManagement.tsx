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
import { motion } from "framer-motion"; // Add this if not already installed: npm install framer-motion
import loaderMp2 from '@/Assets/loader.mp4';

/**
 * Theme / color notes:
 * - Background: soft off-white
 * - Primary accent (ECE): deep-maroon: #8b0000
 * - Accent hover: #a52a2a
 * - Cards: white with deeper shadow
 *
 * To tweak colors, change THEME constants below.
 */

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Theme colors (single place to adjust)
const THEME = {
  bgBeige: '#fbf4ea', // original warm beige (kept to match your note)
  bgSoft: '#fdfaf6', // optional lighter alternative if you swap
  accent: '#8b0000', // deep-maroon
  accentHover: '#a52a2a',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg', // slightly deeper shadow for a premium feel
  textMuted: 'text-gray-600'
};

const UserManagement: React.FC = () => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch users - uses token from localStorage
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data: Array<Record<string, unknown>> = await response.json();
      const mapped: User[] = data.map((u) => {
        const { roll_number, created_at, id, ...rest } = u as Record<string, unknown>;
        return {
          id: typeof id === 'number' ? id : Number(id),
          ...(rest as Omit<User, 'id' | 'rollNumber' | 'createdAt'>),
          rollNumber:
            ((u as Record<string, unknown>).rollNumber as string | undefined) ??
            (roll_number as string | undefined),
          createdAt:
            ((u as Record<string, unknown>).createdAt as string | undefined) ??
            (created_at as string | undefined),
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
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Map role -> badge classes (professional, muted tones but distinct)
  const getRoleBadgeColor = (role: string) => {
    // Return Tailwind utility classes for Badge `className`
    switch (role) {
      case 'admin':
        return 'bg-[#6b0f0f] text-white'; // dark maroon
      case 'hod':
        return 'bg-[#7b3f4a] text-white'; // muted wine
      case 'professor':
        return 'bg-[#0f766e] text-white'; // teal-ish
      case 'student':
        return 'bg-[#345b7a] text-white'; // muted blue
      case 'alumni':
        return 'bg-[#b86b2e] text-white'; // warm amber
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
    return matchesSearch && matchesRole && matchesYear && matchesSemester;
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
      toast({ title: 'Success', description: 'User added successfully' });
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      setModalError(msg);
      toast({ variant: 'destructive', title: 'Error', description: msg });
      throw err;
    }
  };

  // Bulk import
  const handleImportUsers = async (
    bulkUsers: (Omit<User, 'id'> & { password: string })[]
  ): Promise<{ inserted: number; updated: number; errors: string[] }> => {
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
      type BulkResult = { id?: string; action?: 'inserted' | 'updated'; error?: string };
      const data: { results: BulkResult[] } = await response.json();
      const errors: string[] = [];
      const insertedUsers: User[] = [];
      const updatedUsers = new Map<string, User>();
      let inserted = 0;
      let updated = 0;
      data.results.forEach((item, idx) => {
        if (item.id && item.action === 'inserted') {
          const { password, ...rest } = bulkUsers[idx];
          insertedUsers.push({ id: String(item.id), ...rest });
          inserted++;
        } else if (item.id && item.action === 'updated') {
          const { password, ...rest } = bulkUsers[idx];
          updatedUsers.set(String(item.id), { id: String(item.id), ...rest });
          updated++;
        } else if (item.error) {
          errors.push(`Row ${idx + 2}: ${item.error}`);
        }
      });
      if (inserted || updated) {
        setUsers(prev => {
          const replaced = prev.map(u => updatedUsers.get(u.id) ?? u);
          return [...replaced, ...insertedUsers];
        });
      }
      await fetchUsers();
      toast({ title: 'Import Results', description: `Inserted: ${inserted}, Updated: ${updated}` });
      if (errors.length) {
        toast({ variant: 'destructive', title: 'Import Errors', description: errors.join('\n') });
      }
      return { inserted, updated, errors };
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      console.error('Import users error:', err);
      toast({ variant: 'destructive', title: 'Error', description: msg });
      return { inserted: 0, updated: 0, errors: [msg] };
    }
  };

  // Update user
  const handleUpdateUser = async (updatedUser: User) => {
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
      const savedUser: User = await response.json();
      setUsers(prev => prev.map(u => (u.id === savedUser.id ? savedUser : u)));
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
      toast({ title: 'Success', description: 'User updated successfully' });
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      console.error(err);
      setModalError(msg);
      toast({ variant: 'destructive', title: 'Error', description: msg });
      throw err;
    }
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${apiBase}/users/${String(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(user => user.id !== id));
      await fetchUsers();
      toast({ title: 'Success', description: 'User deleted successfully' });
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  // Export filtered users to Excel
  const handleExportUsers = () => {
    const data = filteredUsers.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Department: user.department ?? '',
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
  };

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
      className="min-h-screen p-6"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 style={{ color: THEME.accent }} className="text-3xl font-bold">User Management</h1>
            <p className="mt-1 text-sm text-gray-700">Manage users for the ECE Department</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* SPECIAL Import Excel button - gradient, hover, scale */}
            <Button
              className="flex items-center gap-2 px-4 py-2 text-white font-semibold
                         bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500
                         hover:from-yellow-300 hover:via-amber-400 hover:to-orange-400
                         transition-transform duration-200 transform hover:scale-105
                         shadow-lg rounded-md focus:outline-none focus:ring-2 focus:ring-amber-200"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="h-5 w-5 drop-shadow-sm" />
              <span className="hidden sm:inline">Import Excel</span>
              <span className="sm:hidden">Import</span>
            </Button>

            <Button
              className="flex items-center gap-2 px-3 py-2 bg-[#8b0000] hover:bg-[#a52a2a] text-white transition-colors rounded-md"
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add User</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Filters */}
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 min-w-0 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users (name, email, roll)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#8b0000] focus:ring-[#8b0000] w-full"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#fde8e6] text-[#8b0000] border-[#8b0000] focus:border-[#a52a2a] focus:ring-[#a52a2a] w-full sm:w-auto"
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
                  className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#e8f0fb] text-[#345b7a] border-[#345b7a] focus:border-[#8b0000] focus:ring-[#8b0000] w-full sm:w-auto"
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
                  className="px-3 py-2 border rounded-md text-sm font-semibold bg-[#fff6e6] text-[#b86b2e] border-[#b86b2e] focus:border-[#8b0000] focus:ring-[#8b0000] w-full sm:w-auto"
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Sem 1</option>
                  <option value="2">Sem 2</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white transition-colors rounded-md w-full sm:w-auto"
                  onClick={handleExportUsers}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
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
                        {user.year && user.semester && user.section
                          ? `${user.year}/${user.semester}/${user.section}`
                          : '-'}
                      </td>

                      <td className="p-3 text-sm text-gray-700">{user.rollNumber || '-'}</td>

                      <td className="p-3 text-sm text-gray-700">{user.phone || '-'}</td>

                      <td className="p-3">
                        <div className="flex gap-2 items-center">
                          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded" onClick={() => { /* view handler */ }}>
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>

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
                      <td colSpan={7} className="p-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Users Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#fff5f5' }}
                    >
                      <span className="text-sm font-medium text-[#8b0000]">
                        {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{user.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>

                  <Badge className={getRoleBadgeColor(user.role || '')}>
                    {(user.role || 'N/A').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  {user.year && user.semester && user.section && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year / Sem / Section</span>
                      <span>{user.year}/{user.semester}/{user.section}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">Roll No</span>
                    <span>{user.rollNumber || '-'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span>{user.phone || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { /* view */ }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-gray-600 py-6">No users to show.</div>
          )}
        </div>

        {/* Modals */}
        <UserModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingUser(null); setModalError(null); }}
          mode={editingUser ? 'edit' : 'add'}
          initialUser={editingUser ?? undefined}
          onSubmit={editingUser ? handleUpdateUser : handleAddUser}
          error={modalError}
        />

        <ImportUsersModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportUsers={handleImportUsers}
        />
      </div>
    </div>
  );
};

export default UserManagement;
