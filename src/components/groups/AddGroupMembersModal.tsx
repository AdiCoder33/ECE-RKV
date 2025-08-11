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
  id: string;
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
  const [added, setAdded] = useState<Set<string>>(new Set());

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

  const handleAdd = async (userId: string) => {
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] p-6 flex flex-col">
        <DialogHeader className="p-0 pb-4">
          <DialogTitle>Add Members to {group.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <p className="font-medium leading-none">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                <Button
                  size="sm"
                  disabled={added.has(user.id)}
                  onClick={() => handleAdd(user.id)}
                >
                  {added.has(user.id) ? 'Added' : (
                    <><UserPlus className="h-4 w-4 mr-1" />Add</>
                  )}
                </Button>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center text-muted-foreground py-8">No users found</div>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupMembersModal;
