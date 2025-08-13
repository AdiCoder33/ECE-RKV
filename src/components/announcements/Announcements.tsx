
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  Send
} from 'lucide-react';
import { Announcement } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const mapAnnouncement = (a: Record<string, unknown>): Announcement => {
  const {
    author_id,
    author_name,
    created_at,
    target_role,
    target_section,
    target_year,
    is_active,
    ...rest
  } = a as Record<string, unknown>;
  return {
    ...(rest as Omit<Announcement, 'authorId' | 'authorName' | 'createdAt' | 'targetRole' | 'targetSection' | 'targetYear' | 'isActive'>),
    authorId: (a as Record<string, unknown>).authorId as string ?? (author_id as string),
    authorName: (a as Record<string, unknown>).authorName as string ?? (author_name as string),
    createdAt: (a as Record<string, unknown>).createdAt as string ?? (created_at as string),
    targetRole: (a as Record<string, unknown>).targetRole as string | undefined ?? (target_role as string | undefined),
    targetSection: (a as Record<string, unknown>).targetSection as string | undefined ?? (target_section as string | undefined),
    targetYear: (a as Record<string, unknown>).targetYear as number | undefined ?? (target_year as number | undefined),
    isActive: (a as Record<string, unknown>).isActive as boolean ?? (is_active as boolean),
  } as Announcement;
};

const Announcements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [targetRole, setTargetRole] = useState('all');
  const [targetYear, setTargetYear] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  const canManage = ['admin', 'hod', 'professor'].includes(user?.role ?? '');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/announcements`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        const data: Array<Record<string, unknown>> = await response.json();
        const mapped: Announcement[] = data.map(mapAnnouncement);
        setAnnouncements(mapped);
      } catch (error) {
        console.error('Failed to fetch announcements', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load announcements.'
        });
      }
    };

    fetchAnnouncements();
  }, [toast]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === 'all' || announcement.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('low');
    setTargetRole('all');
    setTargetYear('');
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handlePublish = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title,
        content,
        targetRole: targetRole === 'all' ? null : targetRole,
        targetSection: null,
        targetYear: targetYear ? Number(targetYear) : null,
        priority
      };
      const url = editingId ? `${apiBase}/announcements/${editingId}` : `${apiBase}/announcements`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(editingId ? 'Failed to update announcement' : 'Failed to publish announcement');
      }
      if (editingId) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  title,
                  content,
                  priority,
                  targetRole: targetRole === 'all' ? undefined : targetRole,
                  targetYear: targetYear ? Number(targetYear) : undefined
                }
              : a
          )
        );
      } else {
        const data: Record<string, unknown> = await response.json();
        const newAnnouncement = mapAnnouncement(data);
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to publish announcement', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: editingId ? 'Failed to update announcement.' : 'Failed to publish announcement.'
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setTargetRole(announcement.targetRole || 'all');
    setTargetYear(announcement.targetYear ? String(announcement.targetYear) : '');
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error('Failed to delete announcement', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete announcement.'
      });
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Manage department announcements and notices</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </Button>
        )}
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
            <CardDescription>Share important information with students and faculty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter announcement title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="professor">Faculty</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Year (Optional)</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Enter announcement content..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePublish}>
                <Send className="h-4 w-4 mr-2" />
                {editingId ? 'Update Announcement' : 'Publish Announcement'}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {getPriorityIcon(announcement.priority)}
                      <span className="ml-1">{announcement.priority.toUpperCase()}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{announcement.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    {announcement.targetRole && (
                      <Badge variant="outline">
                        {announcement.targetRole}
                      </Badge>
                    )}
                    {announcement.targetYear && (
                      <Badge variant="outline">
                        Year {announcement.targetYear}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {announcement.content}
              </p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Active Announcement
                  </span>
                </div>
                
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedPriority !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first announcement to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Announcements;
