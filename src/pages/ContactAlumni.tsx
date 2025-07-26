import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Filter,
  GraduationCap,
  Briefcase,
  Linkedin,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Alumni {
  id: string;
  name: string;
  email: string;
  phone?: string;
  graduationYear: number;
  currentPosition?: string;
  company?: string;
  location?: string;
  profileImage?: string;
  expertise: string[];
  isAvailableForMentoring: boolean;
  linkedinProfile?: string;
  bio?: string;
  achievements?: string[];
}

const ContactAlumni = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [graduationYearFilter, setGraduationYearFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const response = await fetch('/api/students/alumni', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Add mock data for better demonstration
          const mockAlumni: Alumni[] = [
            {
              id: '1',
              name: 'Rajesh Kumar',
              email: 'rajesh.kumar@techcorp.com',
              phone: '+91 9876543210',
              graduationYear: 2020,
              currentPosition: 'Senior Software Engineer',
              company: 'Google India',
              location: 'Bangalore, India',
              profileImage: null,
              expertise: ['Machine Learning', 'Cloud Computing', 'Python'],
              isAvailableForMentoring: true,
              linkedinProfile: 'https://linkedin.com/in/rajeshkumar',
              bio: 'Passionate software engineer with 4+ years of experience in building scalable systems.',
              achievements: ['Published 3 research papers', 'Led team of 8 developers', 'Google Cloud Certified']
            },
            {
              id: '2',
              name: 'Priya Sharma',
              email: 'priya.sharma@microsoft.com',
              phone: '+1 415-555-0123',
              graduationYear: 2019,
              currentPosition: 'Product Manager',
              company: 'Microsoft',
              location: 'Seattle, USA',
              profileImage: null,
              expertise: ['Product Management', 'AI/ML', 'Strategy'],
              isAvailableForMentoring: true,
              linkedinProfile: 'https://linkedin.com/in/priyasharma',
              bio: 'Product manager driving innovation in AI-powered productivity tools.',
              achievements: ['Managed $50M product line', 'Launched 5 major features', 'MBA from IIM Bangalore']
            },
            {
              id: '3',
              name: 'Amit Patel',
              email: 'amit.patel@startup.com',
              graduationYear: 2018,
              currentPosition: 'Co-Founder & CTO',
              company: 'TechStart Solutions',
              location: 'Mumbai, India',
              profileImage: null,
              expertise: ['Entrepreneurship', 'Blockchain', 'Full Stack Development'],
              isAvailableForMentoring: false,
              bio: 'Serial entrepreneur building the next generation of fintech solutions.',
              achievements: ['Raised $2M in funding', 'Built team of 25+', 'Featured in Forbes 30 Under 30']
            }
          ];
          setAlumni([...data, ...mockAlumni]);
        }
      } catch (error) {
        console.error('Error fetching alumni:', error);
        // Fallback to mock data
        setAlumni([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch = alum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alum.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alum.currentPosition?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = graduationYearFilter === 'all' || alum.graduationYear.toString() === graduationYearFilter;
    const matchesCompany = companyFilter === 'all' || alum.company?.toLowerCase().includes(companyFilter.toLowerCase());
    
    return matchesSearch && matchesYear && matchesCompany;
  });

  const uniqueYears = [...new Set(alumni.map(a => a.graduationYear))].sort((a, b) => b - a);
  const uniqueCompanies = [...new Set(alumni.map(a => a.company).filter(Boolean))].sort();

  const handleMessageAlumni = (alumniMember: Alumni) => {
    // Here you would integrate with your chat system
    console.log('Starting chat with:', alumniMember.name);
    // For now, we'll just show an alert
    alert(`Starting chat with ${alumniMember.name}. This will integrate with the chat system.`);
  };

  const handleViewProfile = (alumniMember: Alumni) => {
    setSelectedAlumni(alumniMember);
    setShowProfile(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-0">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                  <div className="h-8 bg-muted rounded animate-pulse w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Contact Alumni</h1>
          <p className="text-muted-foreground">Connect with our graduate community</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="w-full md:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alumni by name, company, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-2">
              <Select value={graduationYearFilter} onValueChange={setGraduationYearFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {uniqueCompanies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredAlumni.map((alumniMember) => (
          <Card key={alumniMember.id} className="border-border hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 ring-2 ring-border group-hover:ring-primary transition-colors">
                  <AvatarImage src={alumniMember.profileImage} alt={alumniMember.name} />
                  <AvatarFallback className="text-base md:text-lg font-semibold bg-muted">
                    {alumniMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-1 md:space-y-2 w-full">
                  <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-1">{alumniMember.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{alumniMember.currentPosition}</p>
                  {alumniMember.company && (
                    <div className="flex items-center justify-center gap-1 text-xs md:text-sm text-muted-foreground">
                      <Building className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="truncate">{alumniMember.company}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 text-xs md:text-sm text-muted-foreground">
                    <GraduationCap className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>Class of {alumniMember.graduationYear}</span>
                  </div>
                  {alumniMember.location && (
                    <div className="flex items-center justify-center gap-1 text-xs md:text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="truncate">{alumniMember.location}</span>
                    </div>
                  )}
                </div>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-1 justify-center w-full">
                  {alumniMember.expertise.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {skill}
                    </Badge>
                  ))}
                  {alumniMember.expertise.length > 3 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{alumniMember.expertise.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Mentoring Badge */}
                {alumniMember.isAvailableForMentoring && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs px-2 py-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
                    Available for Mentoring
                  </Badge>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs md:text-sm h-8 md:h-9"
                    onClick={() => handleViewProfile(alumniMember)}
                  >
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs md:text-sm h-8 md:h-9"
                    onClick={() => handleMessageAlumni(alumniMember)}
                  >
                    <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card className="border-border">
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Alumni Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || graduationYearFilter !== 'all' || companyFilter !== 'all'
                ? 'No alumni match your search criteria.'
                : 'No alumni profiles are available at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alumni Profile Modal */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl md:text-2xl">Alumni Profile</DialogTitle>
          </DialogHeader>
          {selectedAlumni && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-border">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-2 ring-border">
                  <AvatarImage src={selectedAlumni.profileImage} alt={selectedAlumni.name} />
                  <AvatarFallback className="text-lg md:text-xl font-semibold bg-muted">
                    {selectedAlumni.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">{selectedAlumni.name}</h2>
                  <p className="text-base md:text-lg text-muted-foreground mb-2">{selectedAlumni.currentPosition}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      <Building className="h-4 w-4 flex-shrink-0" />
                      <span>{selectedAlumni.company}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-1">
                      <GraduationCap className="h-4 w-4 flex-shrink-0" />
                      <span>Class of {selectedAlumni.graduationYear}</span>
                    </div>
                  </div>
                  {selectedAlumni.isAvailableForMentoring && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-xs mt-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></span>
                      Available for Mentoring
                    </Badge>
                  )}
                </div>
              </div>

              {selectedAlumni.bio && (
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">About</h3>
                  <p className="text-muted-foreground">{selectedAlumni.bio}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 text-foreground">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAlumni.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {selectedAlumni.achievements && selectedAlumni.achievements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Achievements</h3>
                  <ul className="space-y-1">
                    {selectedAlumni.achievements.map((achievement, index) => (
                      <li key={index} className="text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="break-all">{selectedAlumni.email}</span>
                  </div>
                  {selectedAlumni.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{selectedAlumni.phone}</span>
                    </div>
                  )}
                  {selectedAlumni.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-muted/50">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{selectedAlumni.location}</span>
                    </div>
                  )}
                  {selectedAlumni.linkedinProfile && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                      <Linkedin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <a 
                        href={selectedAlumni.linkedinProfile} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline break-all"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Button 
                  className="flex-1 h-10"
                  onClick={() => handleMessageAlumni(selectedAlumni)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none sm:px-6 h-10"
                  onClick={() => setShowProfile(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactAlumni;