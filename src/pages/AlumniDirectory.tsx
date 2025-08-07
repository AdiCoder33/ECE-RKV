import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
}

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [graduationYearFilter, setGraduationYearFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockAlumni: Alumni[] = [
      {
        id: '1',
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91 9876543210',
        graduationYear: 2018,
        currentPosition: 'Senior Software Engineer',
        company: 'Google',
        location: 'Bangalore, India',
        expertise: ['Software Development', 'AI/ML', 'Cloud Computing'],
        isAvailableForMentoring: true
      },
      {
        id: '2',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@email.com',
        graduationYear: 2016,
        currentPosition: 'Product Manager',
        company: 'Microsoft',
        location: 'Hyderabad, India',
        expertise: ['Product Management', 'Data Analytics', 'Strategy'],
        isAvailableForMentoring: true
      },
      {
        id: '3',
        name: 'Anjali Patel',
        email: 'anjali.patel@email.com',
        phone: '+91 8765432109',
        graduationYear: 2019,
        currentPosition: 'Research Scientist',
        company: 'Tesla',
        location: 'California, USA',
        expertise: ['Autonomous Systems', 'Computer Vision', 'Research'],
        isAvailableForMentoring: false
      },
      {
        id: '4',
        name: 'Amit Singh',
        email: 'amit.singh@email.com',
        graduationYear: 2017,
        currentPosition: 'Entrepreneur',
        company: 'TechStart Solutions',
        location: 'Mumbai, India',
        expertise: ['Entrepreneurship', 'IoT', 'Business Development'],
        isAvailableForMentoring: true
      }
    ];
    
    setTimeout(() => {
      setAlumni(mockAlumni);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAlumni = alumni.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesYear = graduationYearFilter === 'all' || person.graduationYear.toString() === graduationYearFilter;
    
    return matchesSearch && matchesYear;
  });

  const handleStartChat = (alumniId: string, alumniName: string) => {
    // Navigate to private chat with this alumni
    navigate(`/dashboard/chat/private/${alumniId}`, { 
      state: { alumniName } 
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Alumni Directory</h1>
            <p className="text-muted-foreground">Loading alumni profiles...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-2 py-2 md:px-4 md:py-4 lg:px-6 lg:py-6">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Alumni Directory</h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect with successful ECE graduates</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={graduationYearFilter} onValueChange={setGraduationYearFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                  <SelectItem value="2019">2019</SelectItem>
                  <SelectItem value="2018">2018</SelectItem>
                  <SelectItem value="2017">2017</SelectItem>
                  <SelectItem value="2016">2016</SelectItem>
                  <SelectItem value="2015">2015</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs md:text-sm text-muted-foreground">
          {filteredAlumni.length} alumni found
        </p>
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredAlumni.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex items-start gap-3 md:gap-4">
                <Avatar className="w-12 h-12 md:w-16 md:h-16">
                  <AvatarImage src={person.profileImage} alt={person.name} />
                  <AvatarFallback className="text-sm md:text-lg">
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg leading-tight">{person.name}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">{person.currentPosition}</p>
                  {person.company && (
                    <div className="flex items-center gap-1 mt-1">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{person.company}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 md:space-y-4">
              {/* Graduation Info */}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm">Class of {person.graduationYear}</span>
              </div>

              {/* Location */}
              {person.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                  <span className="text-xs md:text-sm truncate">{person.location}</span>
                </div>
              )}

              {/* Expertise Tags */}
              <div>
                <p className="text-xs md:text-sm font-medium mb-2">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {person.expertise.slice(0, 2).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {person.expertise.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{person.expertise.length - 2}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mentoring Status */}
              {person.isAvailableForMentoring && (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  Available for Mentoring
                </Badge>
              )}

      {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  size="sm"
                  onClick={() => handleStartChat(person.id, person.name)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                <div className="flex gap-2">
                  {person.email && (
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                      <a href={`mailto:${person.email}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="sm:hidden">Email</span>
                      </a>
                    </Button>
                  )}
                  {person.phone && (
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild>
                      <a href={`tel:${person.phone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        <span className="sm:hidden">Call</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredAlumni.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alumni found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlumniDirectory;