import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface ChatGroup {
  id: string;
  name: string;
  description: string;
  type: 'section' | 'subject' | 'year' | 'department' | 'custom';
  memberCount: number;
  createdBy: string;
  createdAt: string;
}

interface ApiGroup {
  id: number;
  name: string;
  description: string | null;
  type: ChatGroup['type'];
  member_count?: number;
  created_by?: number;
  created_at?: string;
}

const GroupManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'custom' as const
  });

  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<ChatGroup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data: ApiGroup[] = await response.json();
      const formatted: ChatGroup[] = data.map((g) => ({
        id: g.id.toString(),
        name: g.name,
        description: g.description || '',
        type: g.type,
        memberCount: g.member_count || 0,
        createdBy: g.created_by ? g.created_by.toString() : '',
        createdAt: g.created_at ? new Date(g.created_at).toISOString().split('T')[0] : ''
      }));
      setGroups(formatted);
    } catch (err) {
      console.error('Failed to load groups', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          type: newGroup.type
        })
      });
      if (!response.ok) throw new Error('Failed to create group');
      await fetchGroups();
      setNewGroup({ name: '', description: '', type: 'custom' });
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Create group error', err);
    }
  };

  const handleEditClick = (group: ChatGroup) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingGroup.name,
          description: editingGroup.description,
          type: editingGroup.type
        })
      });
      if (!response.ok) throw new Error('Failed to update group');
      await fetchGroups();
      setIsEditModalOpen(false);
      setEditingGroup(null);
    } catch (err) {
      console.error('Update group error', err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete group');
      await fetchGroups();
    } catch (err) {
      console.error('Delete group error', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'section': return 'bg-blue-100 text-blue-800';
      case 'subject': return 'bg-green-100 text-green-800';
      case 'year': return 'bg-purple-100 text-purple-800';
      case 'department': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Chat Groups</h1>
          <p className="text-muted-foreground">Manage chat groups and communications</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new chat group for communication
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Group description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newGroup.type} onValueChange={(value) => setNewGroup({ ...newGroup, type: value as ChatGroup['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="section">Section</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup}>
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setEditingGroup(null); }}>
        {editingGroup && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>Update group details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  placeholder="Group description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={editingGroup.type} onValueChange={(value) => setEditingGroup(prev => prev ? { ...prev, type: value as ChatGroup['type'] } : prev)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section">Section</SelectItem>
                    <SelectItem value="subject">Subject</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateGroup}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg break-words">{group.name}</CardTitle>
                  <Badge className={`${getTypeColor(group.type)} mt-2 text-xs`}>
                    {group.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 break-words">
                {group.description}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {group.memberCount} members
                </span>
                <span>{group.createdAt}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditClick(group)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No groups match your search.' : 'Create your first chat group to get started.'}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupManagement;
