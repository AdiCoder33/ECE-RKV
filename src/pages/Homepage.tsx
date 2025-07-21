import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Award, BookOpen, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  const facultyMembers = [
    { name: 'Dr. John Smith', designation: 'Professor & HOD', specialization: 'VLSI Design', image: '/placeholder.svg' },
    { name: 'Dr. Sarah Johnson', designation: 'Associate Professor', specialization: 'Communication Systems', image: '/placeholder.svg' },
    { name: 'Dr. Michael Brown', designation: 'Assistant Professor', specialization: 'Signal Processing', image: '/placeholder.svg' },
    { name: 'Dr. Emily Davis', designation: 'Assistant Professor', specialization: 'Embedded Systems', image: '/placeholder.svg' },
    { name: 'Dr. David Wilson', designation: 'Professor', specialization: 'Control Systems', image: '/placeholder.svg' },
  ];

  const events = [
    { title: 'IEEE Conference 2024', date: '2024-03-15', location: 'Main Auditorium' },
    { title: 'Tech Fest Registration', date: '2024-02-20', location: 'Online' },
    { title: 'Guest Lecture on AI', date: '2024-02-25', location: 'Seminar Hall' },
    { title: 'Project Exhibition', date: '2024-04-10', location: 'ECE Labs' },
  ];

  const achievements = [
    { title: 'Best Research Paper Award', description: 'Dr. Smith received IEEE Best Paper Award', year: '2024' },
    { title: 'Student Innovation Prize', description: 'Final year students won national competition', year: '2023' },
    { title: 'Department Accreditation', description: 'NBA Accreditation received for 5 years', year: '2023' },
  ];

  const notices = [
    { title: 'Mid-term Exam Schedule Released', date: '2024-02-10', priority: 'high' },
    { title: 'Library Renovation Notice', date: '2024-02-08', priority: 'medium' },
    { title: 'Industry Visit Registration', date: '2024-02-05', priority: 'low' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">ECE Department</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="#about">About</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="#faculty">Faculty</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="#events">Events</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="#achievements">Achievements</Link>
              </Button>
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Department of Electronics & Communication Engineering
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Advancing technology through innovation, research, and excellence in education. 
            Shaping the future engineers of tomorrow.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <Link to="/login">Student Portal</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="#about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Department */}
      <section id="about" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">About Our Department</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The Department of Electronics & Communication Engineering was established in 1995 
              with a vision to provide quality education and foster research in cutting-edge technologies.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Academic Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  B.Tech in ECE with specializations in VLSI, Communication Systems, and Embedded Systems.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Expert Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  25+ experienced faculty members with Ph.D. qualifications and industry experience.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Research Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  State-of-the-art labs and research facilities for innovation and development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Faculty Section */}
      <section id="faculty" className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Faculty</h2>
            <p className="text-lg text-muted-foreground">
              Meet our distinguished faculty members who are leaders in their fields
            </p>
          </div>
          
          <div className="flex overflow-x-auto space-x-6 pb-4">
            {facultyMembers.map((faculty, index) => (
              <Card key={index} className="min-w-[300px] flex-shrink-0">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{faculty.name}</CardTitle>
                  <CardDescription>{faculty.designation}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="secondary">{faculty.specialization}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Events & Achievements */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Events */}
            <div id="events">
              <h2 className="text-3xl font-bold text-foreground mb-8">Upcoming Events</h2>
              <div className="space-y-4">
                {events.map((event, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <div className="flex items-center text-muted-foreground text-sm mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.date}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div id="achievements">
              <h2 className="text-3xl font-bold text-foreground mb-8">Recent Achievements</h2>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start">
                        <Award className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">{achievement.description}</p>
                          <Badge variant="outline" className="mt-2">{achievement.year}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Notices */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Important Notices</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {notices.map((notice, index) => (
              <Card key={index} className={notice.priority === 'high' ? 'border-destructive' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <Badge variant={notice.priority === 'high' ? 'destructive' : notice.priority === 'medium' ? 'default' : 'secondary'}>
                      {notice.priority}
                    </Badge>
                  </div>
                  <CardDescription>{notice.date}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Address</h3>
              <p className="text-muted-foreground">ECE Department, XYZ College, City, State - 123456</p>
            </div>
            <div className="flex flex-col items-center">
              <Phone className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Phone</h3>
              <p className="text-muted-foreground">+91 12345 67890</p>
            </div>
            <div className="flex flex-col items-center">
              <Mail className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">ece@college.edu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Department of Electronics & Communication Engineering. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;