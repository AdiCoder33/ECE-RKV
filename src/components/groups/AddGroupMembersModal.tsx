import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from "framer-motion";

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Theme colors matching the main component
const THEME = {
  bgBeige: '#fbf4ea',
  bgSoft: '#fdfaf6',
  accent: '#8b0000',
  accentHover: '#a52a2a',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-600'
};

interface ChatGroup {
  id: string;
  name: string;
}

interface User {
  id: number;
  name: string;
  role: string;
  year?: number;
  section?: string;
}

interface AddGroupMembersModalProps {
  group: ChatGroup;
  open: boolean;
  onClose(): void;
}

const AddGroupMembersModal: React.FC<AddGroupMembersModalProps> = ({ group, open, onClose }) => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [year, setYear] = useState('all');
  const [section, setSection] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    if (role !== 'all') params.append('role', role);
    if (year !== 'all') params.append('year', year);
    if (section !== 'all') params.append('section', section);
    if (search) params.append('search', search);
    params.append('limit', '100');

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/users?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data: User[] = await res.json();
        setUsers(data);
        // Reset selections when users change
        setSelectedUsers(new Set());
        setSelectAll(false);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };

    fetchUsers();
  }, [search, role, year, section, open]);

  useEffect(() => {
    if (!open) return;
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/groups/${group.id}/members`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch group members');
        const members: User[] = await res.json();
        setAdded(new Set(members.map(m => m.id)));
      } catch (err) {
        console.error('Failed to load group members', err);
      }
    };

    fetchMembers();
  }, [open, group.id]);

  useEffect(() => {
    if (!open) {
      setAdded(new Set());
      setSearch('');
      setRole('all');
      setYear('all');
      setSection('all');
      setSelectedUsers(new Set());
      setSelectAll(false);
    }
  }, [open]);

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableUsers = users.filter(user => !added.has(user.id));
      setSelectedUsers(new Set(availableUsers.map(u => u.id)));
      setSelectAll(true);
    } else {
      setSelectedUsers(new Set());
      setSelectAll(false);
    }
  };

  // Handle individual user selection
  const handleUserSelection = (userId: number, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    
    // Update select all state
    const availableUsers = users.filter(user => !added.has(user.id));
    setSelectAll(newSelected.size === availableUsers.length);
  };

  // Add selected users to group
  const handleAddSelected = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      
      for (const userId of selectedUsers) {
        const res = await fetch(`${apiBase}/groups/${group.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ userId })
        });
        if (res.ok) {
          successCount++;
          setAdded(prev => new Set(prev).add(userId));
        }
      }
      
      // Clear selections
      setSelectedUsers(new Set());
      setSelectAll(false);
      
      // Show success message
      if (successCount > 0) {
        toast({
          title: "Success",
          description: `${successCount} member${successCount > 1 ? 's' : ''} successfully added to ${group.name}`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
    } catch (err) {
      console.error('Failed to add members', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add some members. Please try again.",
      });
    }
  };

  const handleAdd = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/groups/${group.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('Failed to add member');
      setAdded(prev => new Set(prev).add(userId));
      
      // Show success message
      toast({
        title: "Success",
        description: "Member successfully added",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      console.error('Failed to add member', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add member. Please try again.",
      });
    }
  };

  const availableUsers = users.filter(user => !added.has(user.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold" style={{ color: THEME.accent }}>
            Add Members to {group.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          {/* Filters and Search */}
          <div className="p-6 pb-4 space-y-4 flex-shrink-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search users by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 h-11 border-2 focus:border-blue-500 transition-all duration-200"
              />
              <div className="flex gap-2">
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-[120px] h-11 border-2">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hod">HOD</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[100px] h-11 border-2">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger className="w-[110px] h-11 border-2">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                    <SelectItem value="D">Section D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Select All and Add Selected */}
            {availableUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    className="h-5 w-5"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium text-blue-900">
                    Select All Available Users ({availableUsers.length})
                  </label>
                </div>
                {selectedUsers.size > 0 && (
                  <Button
                    onClick={handleAddSelected}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Selected ({selectedUsers.size})
                  </Button>
                )}
              </motion.div>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
            <div className="space-y-3">
              {availableUsers.map(user => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                      className="h-5 w-5"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="capitalize">{user.role}</span>
                        {user.year && <span>Year {user.year}</span>}
                        {user.section && <span>Section {user.section}</span>}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </motion.div>
              ))}
              
              {availableUsers.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-gray-400 mb-4">
                    <UserPlus className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No users available</h3>
                  <p className="text-gray-500">
                    {search || role !== 'all' || year !== 'all' || section !== 'all'
                      ? 'Try adjusting your filters to see more users.'
                      : 'All users are already members of this group.'}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {availableUsers.length > 0 && (
                  <span>
                    {selectedUsers.size} of {availableUsers.length} users selected
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-2 hover:bg-gray-100 transition-all duration-200"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupMembersModal;
