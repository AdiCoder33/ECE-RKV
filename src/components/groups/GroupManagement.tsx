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
import AddGroupMembersModal from './AddGroupMembersModal';

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
  memberCount?: number;
  createdBy?: number;
  createdAt?: string;
}

const GroupManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'custom' as ChatGroup['type']
  });

  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<ChatGroup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ChatGroup | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);


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
        memberCount: g.memberCount || 0,
        createdBy: g.createdBy ? g.createdBy.toString() : '',
        createdAt: g.createdAt ? new Date(g.createdAt).toISOString().split('T')[0] : ''
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

const handleChat = (groupId: string) => {
  // Redirect to the specific chat
  window.location.href = `/chat/${groupId}`;
};

return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:px-0 bg-beige min-h-screen"> {/* Set background color to beige */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#8B1F2F] text-left pl-4">Chat Groups</h1>
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
              <Button className="w-full sm:w-auto bg-[#a83246] hover:bg-[#c44558] text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#fbeee6] border-[#a83246]">
              <DialogHeader>
                <DialogTitle className="text-[#8B1F2F]">Create New Group</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Create a new chat group for communication
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#8B1F2F]">Group Name</label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                    className="border-[#a83246] focus:ring-[#a83246]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8B1F2F]">Description</label>
                  <Textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Group description"
                    rows={3}
                    className="border-[#a83246] focus:ring-[#a83246]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#8B1F2F]">Type</label>
                  <Select value={newGroup.type} onValueChange={(value) => setNewGroup({ ...newGroup, type: value as ChatGroup['type'] })}>
                    <SelectTrigger className="border-[#a83246] focus:ring-[#a83246]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fbeee6] border-[#a83246]">
                      <SelectItem value="section" className="hover:bg-[#f5e6e9]">Section</SelectItem>
                      <SelectItem value="subject" className="hover:bg-[#f5e6e9]">Subject</SelectItem>
                      <SelectItem value="year" className="hover:bg-[#f5e6e9]">Year</SelectItem>
                      <SelectItem value="department" className="hover:bg-[#f5e6e9]">Department</SelectItem>
                      <SelectItem value="custom" className="hover:bg-[#f5e6e9]">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="border-[#a83246] text-[#8B1F2F] hover:bg-[#f5e6e9]">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} className="bg-[#a83246] hover:bg-[#c44558] text-white">
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
          <DialogContent className="sm:max-w-[425px] bg-[#fbeee6] border-[#a83246]">
            <DialogHeader>
              <DialogTitle className="text-[#8B1F2F]">Edit Group</DialogTitle>
              <DialogDescription className="text-gray-600">Update group details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#8B1F2F]">Group Name</label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Enter group name"
                  className="border-[#a83246] focus:ring-[#a83246]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8B1F2F]">Description</label>
                <Textarea
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  placeholder="Group description"
                  rows={3}
                  className="border-[#a83246] focus:ring-[#a83246]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#8B1F2F]">Type</label>
                <Select value={editingGroup.type} onValueChange={(value) => setEditingGroup(prev => prev ? { ...prev, type: value as ChatGroup['type'] } : prev)}>
                  <SelectTrigger className="border-[#a83246] focus:ring-[#a83246]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fbeee6] border-[#a83246]">
                    <SelectItem value="section" className="hover:bg-[#f5e6e9]">Section</SelectItem>
                    <SelectItem value="subject" className="hover:bg-[#f5e6e9]">Subject</SelectItem>
                    <SelectItem value="year" className="hover:bg-[#f5e6e9]">Year</SelectItem>
                    <SelectItem value="department" className="hover:bg-[#f5e6e9]">Department</SelectItem>
                    <SelectItem value="custom" className="hover:bg-[#f5e6e9]">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="border-[#a83246] text-[#8B1F2F] hover:bg-[#f5e6e9]">
                  Cancel
                </Button>
                <Button onClick={handleUpdateGroup} className="bg-[#a83246] hover:bg-[#c44558] text-white">
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
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                {/* Removed Chat Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedGroup(group);
                    setIsMembersModalOpen(true);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add Members
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditClick(group)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                      handleDeleteGroup(group.id);
                    }
                  }}
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
      {selectedGroup && (
        <AddGroupMembersModal
          group={selectedGroup}
          open={isMembersModalOpen}
          onClose={() => {
            setIsMembersModalOpen(false);
            setSelectedGroup(null);
            fetchGroups();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#fbeee6] border-[#a83246]">
          <DialogHeader>
            <DialogTitle className="text-[#8B1F2F]">Confirm Delete</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete the group "{groupToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="border-[#a83246] text-[#8B1F2F] hover:bg-[#f5e6e9]"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (groupToDelete) {
                  handleDeleteGroup(groupToDelete.id);
                  setIsDeleteModalOpen(false);
                  setGroupToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;
