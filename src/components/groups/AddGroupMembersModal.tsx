import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

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

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    if (role !== 'all') params.append('role', role);
    if (year !== 'all') params.append('year', year);
    if (section !== 'all') params.append('section', section);
    if (search) params.append('search', search);
    params.append('limit', '50');

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
    }
  }, [open]);

  const handleAddAll = async () => {
    for (const user of users) {
      if (!added.has(user.id)) {
        await handleAdd(user.id);
      }
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
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] p-6 flex flex-col bg-[#fbeee6] border-[#a83246]">
        <DialogHeader className="p-0 pb-4">
          <DialogTitle className="text-[#8B1F2F]">Add Members to {group.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-[#a83246] focus:ring-[#a83246]"
            />
            <div className="flex gap-2">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[110px] border-[#a83246] focus:ring-[#a83246]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-[#fbeee6] border-[#a83246]">
                  <SelectItem value="all" className="hover:bg-[#f5e6e9]">All</SelectItem>
                  <SelectItem value="admin" className="hover:bg-[#f5e6e9]">Admin</SelectItem>
                  <SelectItem value="hod" className="hover:bg-[#f5e6e9]">HOD</SelectItem>
                  <SelectItem value="professor" className="hover:bg-[#f5e6e9]">Professor</SelectItem>
                  <SelectItem value="student" className="hover:bg-[#f5e6e9]">Student</SelectItem>
                  <SelectItem value="alumni" className="hover:bg-[#f5e6e9]">Alumni</SelectItem>
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[90px] border-[#a83246] focus:ring-[#a83246]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-[#fbeee6] border-[#a83246]">
                  <SelectItem value="all" className="hover:bg-[#f5e6e9]">All</SelectItem>
                  <SelectItem value="1" className="hover:bg-[#f5e6e9]">1</SelectItem>
                  <SelectItem value="2" className="hover:bg-[#f5e6e9]">2</SelectItem>
                  <SelectItem value="3" className="hover:bg-[#f5e6e9]">3</SelectItem>
                  <SelectItem value="4" className="hover:bg-[#f5e6e9]">4</SelectItem>
                </SelectContent>
              </Select>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[100px] border-[#a83246] focus:ring-[#a83246]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent className="bg-[#fbeee6] border-[#a83246]">
                  <SelectItem value="all" className="hover:bg-[#f5e6e9]">All</SelectItem>
                  <SelectItem value="A" className="hover:bg-[#f5e6e9]">A</SelectItem>
                  <SelectItem value="B" className="hover:bg-[#f5e6e9]">B</SelectItem>
                  <SelectItem value="C" className="hover:bg-[#f5e6e9]">C</SelectItem>
                  <SelectItem value="D" className="hover:bg-[#f5e6e9]">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between border border-[#a83246] p-2 rounded bg-white">
                <div>
                  <p className="font-medium leading-none text-[#8B1F2F]">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.role}</p>
                </div>
                <Button
                  size="sm"
                  disabled={added.has(user.id)}
                  onClick={() => handleAdd(user.id)}
                  className="bg-[#a83246] hover:bg-[#c44558] text-white"
                >
                  {added.has(user.id) ? 'Added' : (
                    <><UserPlus className="h-4 w-4 mr-1" />Add</>
                  )}
                </Button>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center text-gray-600 py-8">No users found</div>
            )}
          </div>

          <div className="pt-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleAddAll} // New function to handle adding all users
              className="border-[#a83246] text-[#8B1F2F] hover:bg-[#f5e6e9]"
            >
              Add All
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-[#a83246] text-[#8B1F2F] hover:bg-[#f5e6e9]"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupMembersModal;
