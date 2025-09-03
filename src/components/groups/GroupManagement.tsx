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
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AddGroupMembersModal from './AddGroupMembersModal';
import { useToast } from '@/components/ui/use-toast';
import { motion } from "framer-motion";

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Theme colors matching UserManagement
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
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

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
      setIsCreating(true);
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
      
      // Show success alert
      toast({
        title: "Success",
        description: "Group successfully created",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      console.error('Create group error', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create group. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditClick = (group: ChatGroup) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      setIsUpdating(true);
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
      
      // Show success alert
      toast({
        title: "Success",
        description: "Group successfully updated",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      console.error('Update group error', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update group. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setDeletingId(groupId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete group');
      await fetchGroups();
      
      // Show success alert
      toast({
        title: "Success",
        description: "Group successfully deleted",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      console.error('Delete group error', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete group. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    await handleDeleteGroup(confirmDeleteId);
    setConfirmDeleteId(null);
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
    <div 
      className="min-h-screen space-y-6 px-4 py-6 sm:px-6 md:px-8"
      style={{ backgroundColor: THEME.bgSoft }}
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: THEME.accent }}>
            Chat Groups
          </h1>
          <p className="text-lg text-gray-600 mt-2">Manage chat groups and communications</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-2 hover:bg-gray-50 transition-all duration-200"
            style={{ borderColor: THEME.accent, color: THEME.accent }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: THEME.accent }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = THEME.accent}
              >
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
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

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
                <Button onClick={handleUpdateGroup} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className={`${THEME.cardShadow} border-0`}>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search groups by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-2 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Groups Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredGroups.map((group) => (
          <Card key={group.id} className={`${THEME.cardShadow} hover:shadow-xl transition-all duration-300 border-0 overflow-hidden`}>
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
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
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
                  onClick={() => setConfirmDeleteId(group.id)}
                  disabled={deletingId === group.id}
                >
                  {deletingId === group.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {filteredGroups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className={`${THEME.cardShadow} border-0 text-center`}>
            <CardContent className="p-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3" style={{ color: THEME.accent }}>
                No groups found
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm ? 'No groups match your search criteria.' : 'Create your first chat group to get started with team communication.'}
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-lg hover:shadow-xl transition-all duration-200"
                style={{ backgroundColor: THEME.accent }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.accentHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = THEME.accent}
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Create Group
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {selectedGroup && (
        <AddGroupMembersModal
          group={selectedGroup}
          open={isMembersModalOpen}
          onClose={() => {
            setIsMembersModalOpen(false);
            setSelectedGroup(null);
            fetchGroups();
            
            // Show success alert for members added
            toast({
              title: "Success",
              description: "Members successfully added to the group",
              className: "bg-green-50 border-green-200 text-green-800",
            });
          }}
        />
      )}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deletingId !== null}>Cancel</Button>
            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={deletingId !== null}>
              {deletingId !== null && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;
