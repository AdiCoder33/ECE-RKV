
import React, { useState } from 'react';
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
  Filter,
  Calendar,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  Send
} from 'lucide-react';
import { Announcement } from '@/types';

const Announcements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [announcements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Mid-Semester Examination Schedule',
      content: 'Mid-semester examinations for all years will be conducted from March 15-25, 2024. Please check the detailed timetable on the notice board.',
      authorId: '1',
      authorName: 'Dr. Rajesh Kumar',
      targetRole: 'student',
      createdAt: '2024-01-15T10:00:00Z',
      priority: 'high',
      isActive: true
    },
    {
      id: '2',
      title: 'Faculty Development Program',
      content: 'A 5-day Faculty Development Program on "Emerging Technologies in ECE" will be conducted from February 10-14, 2024.',
      authorId: '1',
      authorName: 'Dr. Rajesh Kumar',
      targetRole: 'professor',
      createdAt: '2024-01-10T14:30:00Z',
      priority: 'medium',
      isActive: true
    },
    {
      id: '3',
      title: 'Industry Visit - TCS Innovation Lab',
      content: 'Final year students are invited for an industry visit to TCS Innovation Lab on January 25, 2024. Registration deadline: January 20.',
      authorId: '2',
      authorName: 'Prof. Priya Sharma',
      targetYear: 4,
      createdAt: '2024-01-08T09:15:00Z',
      priority: 'high',
      isActive: true
    },
    {
      id: '4',
      title: 'Library Hours Extension',
      content: 'Library hours have been extended till 10 PM during examination period (March 1-31, 2024).',
      authorId: '1',
      authorName: 'Dr. Rajesh Kumar',
      createdAt: '2024-01-05T16:45:00Z',
      priority: 'low',
      isActive: true
    }
  ]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Manage department announcements and notices</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
            <CardDescription>Share important information with students and faculty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="Enter announcement title" />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="all">All</option>
                  <option value="student">Students</option>
                  <option value="professor">Faculty</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Year (Optional)</label>
                <select className="w-full px-3 py-2 border rounded-md">
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
              />
            </div>

            <div className="flex gap-2">
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Publish Announcement
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
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
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
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
