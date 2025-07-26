import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
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
  Globe,
  Award,
  Eye
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [filteredAlumni, setFilteredAlumni] = useState<Alumni[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Demo alumni data
  const demoAlumni: Alumni[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya.sharma@google.com',
      phone: '+91 9876543210',
      graduationYear: 2020,
      currentPosition: 'Senior Software Engineer',
      company: 'Google',
      location: 'Bangalore, India',
      profileImage: '/placeholder.svg',
      expertise: ['React', 'Node.js', 'Cloud Computing', 'AI/ML'],
      isAvailableForMentoring: true,
      linkedinProfile: 'https://linkedin.com/in/priyasharma',
      bio: 'Passionate software engineer with 4 years of experience in full-stack development. Currently working on AI-powered applications at Google.',
      achievements: ['Technical Excellence Award 2023', 'Published 3 research papers', 'Led team of 8 developers']
    },
    {
      id: '2', 
      name: 'Rohit Kumar',
      email: 'rohit.kumar@microsoft.com',
      graduationYear: 2019,
      currentPosition: 'Product Manager',
      company: 'Microsoft',
      location: 'Hyderabad, India',
      expertise: ['Product Management', 'Strategy', 'Data Analytics'],
      isAvailableForMentoring: true,
      bio: 'Product manager passionate about building user-centric solutions. Leading Microsoft Teams mobile app development.',
      achievements: ['Shipped 5 major product features', 'MBA from IIM Bangalore', '40% user growth in Q3 2023']
    },
    {
      id: '3',
      name: 'Anita Desai',
      email: 'anita.desai@amazon.com', 
      graduationYear: 2021,
      currentPosition: 'DevOps Engineer',
      company: 'Amazon',
      location: 'Mumbai, India',
      expertise: ['AWS', 'Kubernetes', 'DevOps', 'Infrastructure'],
      isAvailableForMentoring: false,
      bio: 'DevOps engineer specializing in cloud infrastructure and automation. Working on Amazon Prime Video infrastructure.',
      achievements: ['AWS Certified Solutions Architect', 'Reduced deployment time by 60%', 'Mentored 12 junior engineers']
    },
    {
      id: '4',
      name: 'Vikram Singh',
      email: 'vikram.singh@uber.com',
      graduationYear: 2018, 
      currentPosition: 'Engineering Manager',
      company: 'Uber',
      location: 'Delhi, India',
      expertise: ['Leadership', 'Scalable Systems', 'Microservices'],
      isAvailableForMentoring: true,
      bio: 'Engineering manager with expertise in building scalable systems. Leading Uber Eats backend team in India.',
      achievements: ['Built team from 3 to 25 engineers', 'Launched Uber Eats in 15 Indian cities', 'Speaker at 8 tech conferences']
    },
    {
      id: '5',
      name: 'Meera Patel',
      email: 'meera.patel@flipkart.com',
      graduationYear: 2022,
      currentPosition: 'Data Scientist', 
      company: 'Flipkart',
      location: 'Bangalore, India',
      expertise: ['Machine Learning', 'Python', 'Data Analysis', 'Statistics'],
      isAvailableForMentoring: true,
      bio: 'Data scientist working on recommendation systems and customer analytics. PhD in Computer Science from IISc.',
      achievements: ['Published 8 ML research papers', 'Improved recommendation accuracy by 25%', 'Filed 2 patents']
    },
    {
      id: '6',
      name: 'Arjun Reddy',
      email: 'arjun.reddy@zomato.com',
      graduationYear: 2020,
      currentPosition: 'Frontend Architect',
      company: 'Zomato', 
      location: 'Gurgaon, India',
      expertise: ['React', 'JavaScript', 'UI/UX', 'Mobile Development'],
      isAvailableForMentoring: true,
      bio: 'Frontend architect passionate about creating exceptional user experiences. Leading Zomato web platform development.',
      achievements: ['Rebuilt entire Zomato web app', 'Improved page load speed by 50%', 'Open source contributor']
    },
    {
      id: '7',
      name: 'Kavya Nair', 
      email: 'kavya.nair@paytm.com',
      graduationYear: 2019,
      currentPosition: 'Security Engineer',
      company: 'Paytm',
      location: 'Noida, India', 
      expertise: ['Cybersecurity', 'Penetration Testing', 'Network Security'],
      isAvailableForMentoring: false,
      bio: 'Cybersecurity specialist ensuring secure payment systems. Certified Ethical Hacker with 5 years experience.',
      achievements: ['Prevented 15 major security breaches', 'CISSP Certified', 'Security researcher with 20+ CVEs']
    },
    {
      id: '8',
      name: 'Rahul Gupta',
      email: 'rahul.gupta@ola.com', 
      graduationYear: 2021,
      currentPosition: 'Mobile App Developer',
      company: 'Ola',
      location: 'Bangalore, India',
      expertise: ['React Native', 'iOS', 'Android', 'Mobile UI/UX'],
      isAvailableForMentoring: true,
      bio: 'Mobile developer creating seamless ride-booking experiences. Working on Ola consumer and driver apps.',
      achievements: ['Launched Ola Electric app', 'Reduced app crash rate by 80%', 'Featured in Google Play Store']
    }
  ];

  React.useEffect(() => {
    let filtered = demoAlumni;
    
    if (searchTerm) {
      filtered = filtered.filter(alumni => 
        alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.currentPosition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumni.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(alumni => alumni.graduationYear.toString() === selectedYear);
    }
    
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(alumni => alumni.company === selectedCompany);
    }
    
    setFilteredAlumni(filtered);
  }, [searchTerm, selectedYear, selectedCompany]);

  React.useEffect(() => {
    setFilteredAlumni(demoAlumni);
  }, []);

  const openAlumniProfile = (alumni: Alumni) => {
    setSelectedAlumni(alumni);
  };

  const sendMessage = (alumni: Alumni) => {
    navigate('/dashboard/chat', { 
      state: { 
        recipient: {
          id: alumni.id,
          name: alumni.name,
          email: alumni.email,
          type: 'alumni'
        }
      }
    });
  };

  const graduationYears = [...new Set(demoAlumni.map(a => a.graduationYear))].sort((a, b) => b - a);
  const companies = [...new Set(demoAlumni.map(a => a.company).filter(Boolean))].sort();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Contact Alumni</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Connect with alumni from ECE Department
          </p>
        </div>
        <Badge variant="outline" className="text-xs md:text-sm">
          {filteredAlumni.length} Alumni
        </Badge>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, role, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {graduationYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company} value={company!}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredAlumni.map((alumni) => (
          <Card key={alumni.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => openAlumniProfile(alumni)}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 md:h-14 md:w-14">
                    <AvatarImage src={alumni.profileImage} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {alumni.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                      {alumni.name}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Class of {alumni.graduationYear}
                    </p>
                  </div>
                </div>
                {alumni.isAvailableForMentoring && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Mentor
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="truncate">{alumni.currentPosition}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Building className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="truncate">{alumni.company}</span>
                </div>
                {alumni.location && (
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <span className="truncate">{alumni.location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {alumni.expertise.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {alumni.expertise.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{alumni.expertise.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAlumniProfile(alumni);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendMessage(alumni);
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card className="p-8 md:p-12 text-center">
          <div className="space-y-4">
            <GraduationCap className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">No Alumni Found</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Alumni Profile Dialog */}
      <Dialog open={!!selectedAlumni} onOpenChange={() => setSelectedAlumni(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedAlumni?.profileImage} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedAlumni?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{selectedAlumni?.name}</h2>
                <p className="text-sm text-muted-foreground">Class of {selectedAlumni?.graduationYear}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedAlumni && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAlumni.email}</span>
                  </div>
                  {selectedAlumni.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAlumni.phone}</span>
                    </div>
                  )}
                  {selectedAlumni.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAlumni.location}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAlumni.currentPosition}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAlumni.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Graduated {selectedAlumni.graduationYear}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedAlumni.bio && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedAlumni.bio}
                  </p>
                </div>
              )}

              {/* Expertise */}
              <div>
                <h3 className="font-semibold mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAlumni.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              {selectedAlumni.achievements && selectedAlumni.achievements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Achievements
                  </h3>
                  <ul className="space-y-2">
                    {selectedAlumni.achievements.map((achievement, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full mt-2 shrink-0"></span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mentoring */}
              {selectedAlumni.isAvailableForMentoring && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-300">Available for Mentoring</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    This alumni is open to mentoring students and sharing their experience.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    sendMessage(selectedAlumni);
                    setSelectedAlumni(null);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                {selectedAlumni.linkedinProfile && (
                  <Button variant="outline" asChild>
                    <a href={selectedAlumni.linkedinProfile} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactAlumni;