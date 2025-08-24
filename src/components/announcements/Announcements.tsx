import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useLocation } from 'react-router-dom';
import loaderMp2 from '@/Assets/loader.mp4';
import deleteAnimMp4 from '@/Assets/delete.mp4'; // Make sure this file exists

const apiBase = import.meta.env.VITE_API_URL || '/api';

// ECE-themed and extra accent colors
const ECE_COLORS = {
  accent: '#8b0000', // deep maroon
  accent2: '#a52a2a', // brownish red
  accent3: '#b86b2e', // amber
  accent4: '#345b7a', // blue
  accent5: '#0f766e', // teal
  accent6: '#e8f0fb', // light blue
  accent7: '#fde8e6', // light maroon
  accent8: '#fff6e6', // light amber
  accent9: '#e8fbf5', // light teal
};

const getTargetRoleLabel = (role?: string) => {
  switch (role) {
    case 'student':
      return 'Students';
    case 'professor':
      return 'Faculty';
    case 'alumni':
      return 'Alumni';
    case 'landing':
      return 'Landing Page';
    case 'all':
      return 'All';
    default:
      return role;
  }
};

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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAnim, setShowDeleteAnim] = useState(false);
  const { user } = useAuth();
  const canManage = ['admin', 'hod', 'professor'].includes(user?.role ?? '');
  const location = useLocation();

  // Loader component
  const EceVideoLoader: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp2}
        autoPlay
        loop
        muted
        playsInline
        className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">
        {message || "Loading Announcements..."}
      </div>
      <div className="text-[#a52a2a] text-sm mt-1">Please wait</div>
    </div>
  );

  // Delete animation overlay
  const DeleteAnimOverlay = () => (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <video
        src={deleteAnimMp4}
        autoPlay
        muted
        playsInline
        className="w-40 h-40 object-contain rounded-lg shadow-lg"
        aria-label="Delete animation"
        onEnded={() => setShowDeleteAnim(false)}
      />
      <span className="absolute bottom-12 text-white text-lg font-bold drop-shadow-lg">Deleting...</span>
    </div>
  );

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line
  }, [toast]);

  useEffect(() => {
    const state = location.state as { announcementId?: string } | null;
    if (state?.announcementId && announcements.length > 0) {
      const found = announcements.find((a) => a.id === String(state.announcementId));
      if (found) {
        setSelectedAnnouncement(found);
        setIsDetailOpen(true);
      }
    }
  }, [location.state, announcements]);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Info className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // ECE-themed priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-[#8b0000] text-white border-[#8b0000]';
      case 'medium': return 'bg-[#b86b2e] text-white border-[#b86b2e]';
      case 'low': return 'bg-[#0f766e] text-white border-[#0f766e]';
      default: return 'bg-gray-500 text-white border-gray-500';
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

  // --- PUBLISH HANDLER (fetches data after publish, no reload) ---
  const handlePublish = async () => {
    setPublishing(true);
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
      // Fetch announcements again after publish/update (no reload)
      await fetchAnnouncements();
      resetForm();
    } catch (error) {
      console.error('Failed to publish announcement', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: editingId ? 'Failed to update announcement.' : 'Failed to publish announcement.'
      });
    } finally {
      setPublishing(false);
    }
  };

  // --- DELETE HANDLER (shows animation, fetches after) ---
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    setDeleting(true);
    setShowDeleteAnim(true);
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
      // Wait for animation to finish (1.5s or video duration)
      setTimeout(async () => {
        setShowDeleteAnim(false);
        await fetchAnnouncements();
        setDeleting(false);
      }, 1500);
    } catch (error) {
      setShowDeleteAnim(false);
      setDeleting(false);
      console.error('Failed to delete announcement', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete announcement.'
      });
    }
  };

  // Loader while fetching data
  if (loading) {
    return <EceVideoLoader message="Loading Announcements..." />;
  }

  return (
    <div className="relative space-y-6 px-2 sm:px-4 md:px-0 max-w-3xl mx-auto">
      {/* Delete animation overlay */}
      {showDeleteAnim && <DeleteAnimOverlay />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] bg-clip-text text-transparent">
            Announcements
          </h1>
          <p className="text-[#a52a2a] font-medium">Manage ECE department announcements and notices</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] text-white font-bold rounded-md px-4 py-2 hover:from-[#a52a2a] hover:to-[#8b0000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </Button>
        )}
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && canManage && (
        <Card className="bg-[#fde8e6] border-[#8b0000]">
          <CardHeader>
            <CardTitle className="text-[#8b0000]">{editingId ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
            <CardDescription className="text-[#a52a2a]">Share important information with students and faculty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {publishing ? (
              <EceVideoLoader message={editingId ? "Updating Announcement..." : "Publishing Announcement..."} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-[#8b0000]">Title</label>
                    <Input
                      placeholder="Enter announcement title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="border-[#8b0000] bg-[#fff6e6] text-[#8b0000] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#b86b2e]">Priority</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold"
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
                    <label className="text-sm font-semibold text-[#345b7a]">Target Audience</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md border-[#345b7a] bg-[#e8f0fb] text-[#345b7a] font-semibold"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="student">Students</option>
                      <option value="professor">Faculty</option>
                      <option value="alumni">Alumni</option>
                      <option value="landing">Landing Page</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#0f766e]">Target Year (Optional)</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md border-[#0f766e] bg-[#e8fbf5] text-[#0f766e] font-semibold"
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
                  <label className="text-sm font-semibold text-[#a52a2a]">Content</label>
                  <Textarea
                    placeholder="Enter announcement content..."
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="border-[#a52a2a] bg-[#fde8e6] text-[#8b0000] font-semibold"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePublish}
                    className="bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] text-white font-bold rounded-md"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {editingId ? 'Update Announcement' : 'Publish Announcement'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-[#e8f0fb] border-[#345b7a]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#345b7a]" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#345b7a] bg-[#e8f0fb] text-[#345b7a] font-semibold"
                />
              </div>
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border rounded-md border-[#b86b2e] bg-[#fff6e6] text-[#b86b2e] font-semibold"
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
          <Card
            key={announcement.id}
            className="hover:shadow-lg transition-shadow border-l-4"
            style={{
              borderLeftColor:
                announcement.priority === 'high'
                  ? ECE_COLORS.accent
                  : announcement.priority === 'medium'
                  ? ECE_COLORS.accent3
                  : announcement.priority === 'low'
                  ? ECE_COLORS.accent5
                  : '#ccc'
            }}
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-[#8b0000]">{announcement.title}</h3>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {getPriorityIcon(announcement.priority)}
                      <span className="ml-1">{announcement.priority.toUpperCase()}</span>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#345b7a]">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{announcement.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    {announcement.targetRole && (
                      <Badge variant="outline" className="border-[#8b0000] text-[#8b0000]">
                        {getTargetRoleLabel(announcement.targetRole)}
                      </Badge>
                    )}
                    {announcement.targetYear && (
                      <Badge variant="outline" className="border-[#b86b2e] text-[#b86b2e]">
                        Year {announcement.targetYear}
                      </Badge>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-2 sm:mt-0">
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
              <p className="text-[#a52a2a] leading-relaxed line-clamp-3">
                {announcement.content}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#b86b2e]" />
                  <span className="text-sm text-[#b86b2e] font-semibold">
                    Active Announcement
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
                    onClick={() => {
                      setSelectedAnnouncement(announcement);
                      setIsDetailOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#b86b2e] text-[#b86b2e] hover:bg-[#fff6e6]"
                      onClick={() => handleEdit(announcement)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-12 w-12 text-[#b86b2e] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-[#8b0000]">No announcements found</h3>
            <p className="text-[#a52a2a]">
              {searchTerm || selectedPriority !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first announcement to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedAnnouncement(null);
        }}
      >
        {selectedAnnouncement && (
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#8b0000]">{selectedAnnouncement.title}</DialogTitle>
              <DialogDescription className="text-[#a52a2a]">
                Posted by {selectedAnnouncement.authorName} on {formatDate(selectedAnnouncement.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <p className="whitespace-pre-line text-[#345b7a] text-sm leading-relaxed">
                {selectedAnnouncement.content}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(selectedAnnouncement.priority)}>
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  <span className="ml-1">{selectedAnnouncement.priority.toUpperCase()}</span>
                </Badge>
                {selectedAnnouncement.targetRole && (
                  <Badge variant="outline" className="border-[#8b0000] text-[#8b0000]">
                    {getTargetRoleLabel(selectedAnnouncement.targetRole)}
                  </Badge>
                )}
                {selectedAnnouncement.targetYear && (
                  <Badge variant="outline" className="border-[#b86b2e] text-[#b86b2e]">
                    Year {selectedAnnouncement.targetYear}
                  </Badge>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Announcements;
