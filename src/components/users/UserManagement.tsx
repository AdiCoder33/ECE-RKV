
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { User } from '@/types';
import AddUserModal from './AddUserModal';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Mock data - replace with actual API calls
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@college.edu',
      role: 'hod',
      phone: '+91 9876543210'
    },
    {
      id: '2',
      name: 'Prof. Priya Sharma',
      email: 'priya.sharma@college.edu',
      role: 'professor',
      phone: '+91 9876543211'
    },
    {
      id: '3',
      name: 'Aarav Patel',
      email: 'aarav.patel@student.edu',
      role: 'student',
      year: 3,
      section: 'A',
      rollNumber: '20ECE001',
      phone: '+91 9876543212'
    },
    {
      id: '4',
      name: 'Diya Singh',
      email: 'diya.singh@student.edu',
      role: 'student',
      year: 2,
      section: 'B',
      rollNumber: '21ECE045',
      phone: '+91 9876543213'
    }
  ]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'hod': return 'bg-blue-600 text-white';
      case 'professor': return 'bg-green-600 text-white';
      case 'student': return 'bg-purple-600 text-white';
      case 'alumni': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesYear = selectedYear === 'all' || user.year?.toString() === selectedYear;
    
    return matchesSearch && matchesRole && matchesYear;
  });

  const userStats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    professors: users.filter(u => u.role === 'professor').length,
    alumni: users.filter(u => u.role === 'alumni').length
  };

  const handleAddUser = (newUser: Omit<User, 'id'>) => {
    const user: User = {
      ...newUser,
      id: String(users.length + 1)
    };
    setUsers([...users, user]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users in ECE Department</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold">{userStats.students}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Professors</p>
                <p className="text-2xl font-bold">{userStats.professors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alumni</p>
                <p className="text-2xl font-bold">{userStats.alumni}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border rounded-md"
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
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Year/Section</th>
                  <th className="text-left p-3">Roll Number</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                     <td className="p-3">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                           <span className="text-sm font-medium text-primary-foreground">
                             {user.name.charAt(0)}
                           </span>
                         </div>
                         <div className="min-w-0 flex-1">
                           <span className="font-medium">{user.name}</span>
                         </div>
                       </div>
                     </td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {user.year && user.section ? `${user.year}-${user.section}` : '-'}
                    </td>
                    <td className="p-3">{user.rollNumber || '-'}</td>
                    <td className="p-3">{user.phone || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};

export default UserManagement;
