
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Edit,
  Save,
  Camera,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Award,
  BookOpen,
  GraduationCap,
  Building
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+91 9876543210',
    dateOfBirth: '1995-06-15',
    address: '123 Main Street, City, State - 560001',
    bloodGroup: 'O+'
  });
  const [academicData, setAcademicData] = useState({
    year: '',
    semester: '',
    section: '',
    rollNumber: '',
    cgpa: 0,
    attendance: 0,
    subjects: [] as {
      name: string;
      code: string;
      grade: string;
      credits: number;
    }[],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        let res: Response;
        if (user.role === 'student') {
          res = await fetch(`${apiBase}/students/${user.id}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            res = await fetch(`${apiBase}/students/${user.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
        } else {
          res = await fetch(`${apiBase}/professors/${user.id}/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          bloodGroup: data.bloodGroup || '',
        }));
        setDepartment(data.department || '');
        setProfileImage(data.profileImage || '');
        if (user.role === 'student') {
          setAcademicData({
            year: data.year || '',
            semester: data.semester || '',
            section: data.section || '',
            rollNumber: data.rollNumber || '',
            cgpa: data.cgpa || 0,
            attendance: data.attendance || 0,
            subjects: data.subjects || [],
          });
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, apiBase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const payload: Record<string, unknown> = {
        phone: formData.phone,
        profileImage,
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
      };
      if (user.role === 'student') {
        payload.rollNumber = academicData.rollNumber;
        payload.year = academicData.year;
        payload.semester = academicData.semester;
        payload.section = academicData.section;
      }
      const endpoint =
        user.role === 'student'
          ? `${apiBase}/students/${user.id}/profile`
          : `${apiBase}/professors/${user.id}/profile`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Failed to update profile');
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, ...data }));
      if (data.profileImage !== undefined) {
        setProfileImage(data.profileImage);
      }
      if (user.role === 'student') {
        setAcademicData((prev) => ({ ...prev, ...data }));
      }
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const updatedUser = { ...parsed, ...data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch {
          // ignore invalid stored user
        }
      }
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('image', file);
      const res = await fetch(`${apiBase}/uploads/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      const result = await res.json();
      if (result.url) {
        const endpoint =
          user.role === 'student'
            ? `${apiBase}/students/${user.id}/profile`
            : `${apiBase}/professors/${user.id}/profile`;
        const updateRes = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ profileImage: result.url })
        });
        if (!updateRes.ok) {
          throw new Error('Failed to update profile image');
        }
        const updated = await updateRes.json();
        setProfileImage(updated.profileImage || result.url);
        if (user.role === 'student') {
          setAcademicData((prev) => ({ ...prev, ...updated }));
        }
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            const updatedUser = { ...parsed, ...updated };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch {
            // ignore invalid stored user
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'hod': return 'bg-blue-600 text-white';
      case 'professor': return 'bg-green-600 text-white';
      case 'student': return 'bg-purple-600 text-white';
      case 'alumni': return 'bg-orange-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const achievements = [
    {
      title: 'Best Project Award 2023',
      description: 'IoT-based Smart Home Automation System',
      date: '2023-05-15',
      category: 'technical'
    },
    {
      title: 'Inter-college Quiz Competition',
      description: 'First Prize in Technical Quiz',
      date: '2023-03-20',
      category: 'academic'
    },
    {
      title: 'Hackathon Winner',
      description: 'Smart City Solutions Hackathon',
      date: '2023-01-10',
      category: 'technical'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 px-4 sm:px-6 md:px-0">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="relative mx-auto w-24 h-24 mb-4">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {formData.name?.charAt(0)}
                  </span>
                </div>
              )}
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <CardTitle className="text-xl">{formData.name}</CardTitle>
            <div className="flex justify-center">
              <Badge className={getRoleBadgeColor(user?.role || '')}>
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {user?.role === 'student' && (
              <>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Year & Section</p>
                    <p className="text-sm text-muted-foreground">{academicData.year}-{academicData.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Roll Number</p>
                    <p className="text-sm text-muted-foreground">{academicData.rollNumber}</p>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{department || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              {user?.role === 'student' && <TabsTrigger value="academic">Academic</TabsTrigger>}
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                      />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Blood Group</label>
                  <Input
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            {user?.role === 'student' && (
              <TabsContent value="academic">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>Your academic progress and performance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{academicData.cgpa}</p>
                        <p className="text-sm text-muted-foreground">CGPA</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{academicData.attendance}%</p>
                        <p className="text-sm text-muted-foreground">Attendance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{academicData.subjects.length}</p>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Current Semester Subjects</h4>
                      <div className="space-y-3">
                        {academicData.subjects.map((subject, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">{subject.name}</p>
                              <p className="text-sm text-muted-foreground">{subject.code}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">{subject.grade}</Badge>
                              <p className="text-sm text-muted-foreground mt-1">{subject.credits} credits</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle>Achievements & Awards</CardTitle>
                  <CardDescription>Your accomplishments and recognitions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <p className="text-muted-foreground">{achievement.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(achievement.date).toLocaleDateString()}
                              </span>
                              <Badge variant="outline">{achievement.category}</Badge>
                            </div>
                          </div>
                          <Award className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Award className="h-4 w-4 mr-2" />
                    Add Achievement
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
