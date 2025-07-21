import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, GraduationCap, MessageSquare, Calendar, MapPin, Phone, Mail, Users, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AlumniDashboard = () => {
  const { user } = useAuth();
  const [mentorshipStatus, setMentorshipStatus] = useState('Available');

  // Mock data for alumni
  const alumniProfile = {
    graduationYear: 2020,
    currentPosition: 'Senior Software Engineer',
    company: 'Tech Giants Inc.',
    location: 'Bangalore, India',
    specialization: 'Machine Learning & AI',
    experience: '4 years',
    achievements: [
      'Best Employee Award 2023',
      'Patent in ML Algorithm',
      'Speaker at Tech Conference'
    ]
  };

  const currentStudents = [
    { name: 'John Doe', year: 3, rollNo: '21EC001', query: 'Career guidance in AI/ML', lastMessage: '2 hours ago' },
    { name: 'Jane Smith', year: 2, rollNo: '22EC045', query: 'Internship opportunities', lastMessage: '1 day ago' },
    { name: 'Mike Johnson', year: 4, rollNo: '20EC023', query: 'Job interview tips', lastMessage: '3 days ago' },
  ];

  const upcomingEvents = [
    { title: 'Alumni Meetup 2024', date: '2024-04-15', type: 'networking', location: 'College Campus' },
    { title: 'Tech Talk on AI', date: '2024-03-25', type: 'webinar', location: 'Online' },
    { title: 'Career Guidance Session', date: '2024-03-30', type: 'mentorship', location: 'Online' },
  ];

  const departmentNews = [
    { title: 'New AI Lab Inaugurated', date: '2024-02-15', content: 'Department opens state-of-the-art AI research lab' },
    { title: 'Student Team Wins Hackathon', date: '2024-02-10', content: 'ECE students secure first place in national competition' },
    { title: 'Industry Collaboration', date: '2024-02-05', content: 'New partnership with leading tech companies announced' },
  ];

  const jobOpportunities = [
    { company: 'Tech Giants Inc.', position: 'ML Engineer', experience: '2-4 years', location: 'Bangalore' },
    { company: 'InnovateCorp', position: 'VLSI Designer', experience: '1-3 years', location: 'Hyderabad' },
    { company: 'StartupXYZ', position: 'IoT Developer', experience: '0-2 years', location: 'Remote' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Alumni | Batch of {alumniProfile.graduationYear} | {alumniProfile.currentPosition}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={mentorshipStatus === 'Available' ? 'default' : 'secondary'}>
            Mentorship: {mentorshipStatus}
          </Badge>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Student Messages ({currentStudents.length})
          </Button>
        </div>
      </div>

      {/* Alumni Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Alumni Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-muted-foreground">{alumniProfile.currentPosition}</p>
                <p className="text-sm text-muted-foreground">{alumniProfile.company}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{alumniProfile.experience} experience</span>
              </div>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{alumniProfile.location}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Specialization</h4>
              <Badge variant="outline">{alumniProfile.specialization}</Badge>
              <div className="mt-3">
                <h4 className="font-medium mb-2">Recent Achievements</h4>
                <div className="space-y-1">
                  {alumniProfile.achievements.slice(0, 2).map((achievement, index) => (
                    <p key={index} className="text-xs text-muted-foreground flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      {achievement}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Mentorship */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Student Mentorship
              </span>
              <Button size="sm" variant="outline">
                View All Chats
              </Button>
            </CardTitle>
            <CardDescription>Students seeking guidance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.rollNo} • Year {student.year}</p>
                      <p className="text-xs text-muted-foreground">{student.query}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{student.lastMessage}</p>
                    <Button size="sm" className="mt-1">
                      Reply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-lg bg-primary/10">
              <h4 className="font-medium mb-2">Quick Response Template</h4>
              <Textarea 
                placeholder="Share your career advice, tips, or guidance..."
                className="mb-2"
              />
              <Button size="sm" className="w-full">
                Send to All Active Conversations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alumni Events & News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Events & Department News
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Upcoming Events</h4>
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30 mb-2">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date} • {event.location}</p>
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Department News</h4>
              {departmentNews.map((news, index) => (
                <div key={index} className="p-2 rounded bg-muted/30 mb-2">
                  <p className="font-medium text-sm">{news.title}</p>
                  <p className="text-xs text-muted-foreground mb-1">{news.date}</p>
                  <p className="text-xs">{news.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Opportunities to Share */}
        <Card>
          <CardHeader>
            <CardTitle>Share Job Opportunities</CardTitle>
            <CardDescription>Help current students with job openings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Company Name" />
                <Input placeholder="Position" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Experience Required" />
                <Input placeholder="Location" />
              </div>
              <Textarea placeholder="Job description and requirements..." />
              <Button className="w-full">
                Post Job Opportunity
              </Button>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Recent Job Posts</h4>
              {jobOpportunities.map((job, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/50 mb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{job.position}</p>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                      <p className="text-xs text-muted-foreground">{job.experience} • {job.location}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alumni Network & Contributions */}
        <Card>
          <CardHeader>
            <CardTitle>Alumni Contributions</CardTitle>
            <CardDescription>Your impact on the department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">Students Mentored</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-sm text-muted-foreground">Job Referrals</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">3</p>
                  <p className="text-sm text-muted-foreground">Guest Lectures</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">2</p>
                  <p className="text-sm text-muted-foreground">Events Organized</p>
                </div>
              </Card>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Get Involved</h4>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Guest Lecture
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Organize Alumni Event
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Sponsor Student Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used alumni features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Student Chat</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Briefcase className="h-6 w-6" />
              <span className="text-sm">Post Jobs</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Event Calendar</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Users className="h-6 w-6" />
              <span className="text-sm">Alumni Network</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniDashboard;