import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Edit,
  Save,
  Camera,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  School,
  UserCircle2,
  Building,
  Sparkles,
  Star,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import loaderMp4 from '@/Assets/loader.mp4';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';
import { cacheProfileImage } from '@/lib/profileImageCache';

const Profile = () => {
  const { user } = useAuth();
  const { userId, studentId } = useParams();

  const viewedId = studentId || userId || user?.id;
  const viewedRole =
    studentId || userId ? 'student' : user?.role === 'student' ? 'student' : 'professor';
  const canEdit = viewedId === user?.id || ['admin', 'hod', 'professor'].includes(user?.role || '');

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    bloodGroup: 'O+',
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

  const profileImageSrc = useProfileImageSrc(profileImage);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!viewedId) return;
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        let res: Response;

        if (viewedRole === 'student') {
          res = await fetch(`${apiBase}/students/${viewedId}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            res = await fetch(`${apiBase}/students/${viewedId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } else {
          res = await fetch(`${apiBase}/professors/${viewedId}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (!res.ok) throw new Error('Failed to load profile');

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

        if (viewedRole === 'student') {
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
  }, [viewedId, viewedRole, apiBase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!viewedId || !canEdit) return;
    try {
      setSaving(true);
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

      if (viewedRole === 'student') {
        payload.rollNumber = academicData.rollNumber;
        payload.year = academicData.year;
        payload.semester = academicData.semester;
        payload.section = academicData.section;
      }

      const endpoint =
        viewedRole === 'student'
          ? `${apiBase}/students/${viewedId}/profile`
          : `${apiBase}/professors/${viewedId}/profile`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      const data = await res.json();
      setFormData((prev) => ({ ...prev, ...data }));

      if (data.profileImage !== undefined) setProfileImage(data.profileImage);
      if (viewedRole === 'student') setAcademicData((prev) => ({ ...prev, ...data }));

      if (viewedId === user?.id) {
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
        if (data.profileImage) {
          await cacheProfileImage(data.profileImage);
        }
      }

      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !viewedId || !canEdit) return;

    try {
      setError(null);
      const token = localStorage.getItem('token');

      const data = new FormData();
      data.append('image', file);

      const res = await fetch(`${apiBase}/uploads/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error('Failed to upload image');

      const result = await res.json(); // { key, url }
      const profileValue = result.key;

      const endpoint =
        viewedRole === 'student'
          ? `${apiBase}/students/${viewedId}/profile`
          : `${apiBase}/professors/${viewedId}/profile`;

      const updateRes = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileImage: profileValue }),
      });

      if (!updateRes.ok) throw new Error('Failed to update profile image');

      const updated = await updateRes.json();
      setProfileImage(result.url);

      if (viewedRole === 'student') setAcademicData((prev) => ({ ...prev, ...updated }));

      if (viewedId === user?.id) {
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
        await cacheProfileImage(result.url);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-600 text-white';
      case 'hod':
        return 'bg-blue-600 text-white';
      case 'professor':
        return 'bg-green-600 text-white';
      case 'student':
        return 'bg-purple-600 text-white';
      case 'alumni':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const achievements = [
    {
      title: 'Best Project Award 2023',
      description: 'IoT-based Smart Home Automation System',
      date: '2023-05-15',
      category: 'technical',
    },
    {
      title: 'Inter-college Quiz Competition',
      description: 'First Prize in Technical Quiz',
      date: '2023-03-20',
      category: 'academic',
    },
    {
      title: 'Hackathon Winner',
      description: 'Smart City Solutions Hackathon',
      date: '2023-01-10',
      category: 'technical',
    },
  ];

  if (loading || saving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 bg-[#fff8f3]">
        <video
          src={loaderMp4}
          autoPlay
          loop
          muted
          playsInline
          className="w-24 h-24 object-contain rounded-lg shadow-lg mb-4"
          aria-label="Loading animation"
        />
        <div className="text-[#b91c1c] font-semibold text-lg tracking-wide">
          {saving ? 'Saving...' : 'Loading Profile...'}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-4 md:px-6 bg-[#fff8f3]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#b91c1c] via-[#2563eb] to-[#fbeee6] bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        {canEdit && (
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            variant={isEditing ? 'default' : 'outline'}
            className={`font-semibold shadow ${
              isEditing ? 'bg-[#b91c1c] text-white hover:bg-[#a31515]' : 'border-[#b91c1c] text-[#b91c1c] hover:bg-[#fbeee6]'
            }`}
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
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-[#e0edff] shadow-xl rounded-2xl border border-[#2563eb]">
          <CardHeader className="text-center">
            <div className="relative mx-auto w-28 h-28 mb-4 drop-shadow-lg">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#b91c1c] shadow"
                />
              ) : (
                <div className="w-28 h-28 bg-[#fbeee6] rounded-full flex items-center justify-center shadow border-4 border-[#b91c1c]">
                  <UserCircle2 className="h-16 w-16 text-[#b91c1c]" />
                </div>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-9 h-9 p-0 bg-[#b91c1c] text-white shadow"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <CardTitle className="text-2xl font-bold text-[#b91c1c]">{formData.name}</CardTitle>
            <div className="flex justify-center mt-2">
              <Badge className={getRoleBadgeColor(viewedRole) + ' px-3 py-1 text-xs rounded-full shadow'}>
                {viewedRole.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {viewedRole === 'student' && (
              <>
                <div className="flex items-center gap-3">
                  <School className="h-5 w-5 text-[#2563eb]" />
                  <div>
                    <p className="font-medium">Year & Section</p>
                    <p className="text-sm text-muted-foreground">
                      {academicData.year}-{academicData.section}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[#b91c1c]" />
                  <div>
                    <p className="font-medium">Roll Number</p>
                    <p className="text-sm text-muted-foreground">{academicData.rollNumber}</p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-[#2563eb]" />
              <div>
                <p className="font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{department || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#b91c1c]" />
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
            <TabsList
              className="flex w-full bg-[#fbeee6] rounded-xl shadow overflow-x-auto no-scrollbar gap-2 sm:gap-0"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <TabsTrigger
                value="personal"
                className="flex-1 min-w-[120px] data-[state=active]:bg-[#b91c1c] data-[state=active]:text-white data-[state=active]:shadow-lg text-center"
              >
                <User className="h-4 w-4 mr-1 text-[#b91c1c] inline" />
                <span className="align-middle">Personal Info</span>
              </TabsTrigger>

              {viewedRole === 'student' && (
                <TabsTrigger
                  value="academic"
                  className="flex-1 min-w-[120px] data-[state=active]:bg-[#b91c1c] data-[state=active]:text-white data-[state=active]:shadow-lg text-center"
                >
                  <BookOpen className="h-4 w-4 mr-1 text-[#b91c1c] inline" />
                  <span className="align-middle">Academic</span>
                </TabsTrigger>
              )}

              <TabsTrigger
                value="achievements"
                className="flex-1 min-w-[120px] data-[state=active]:bg-[#b91c1c] data-[state=active]:text-white data-[state=active]:shadow-lg text-center"
              >
                <Trophy className="h-4 w-4 mr-1 text-[#b91c1c] inline" />
                <span className="align-middle">Achievements</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="bg-[#fff8f3] rounded-xl shadow border border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-[#b91c1c]">Personal Information</CardTitle>
                  <CardDescription className="text-[#2563eb]">
                    Your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="rounded-lg"
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
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date of Birth</label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        disabled={!isEditing}
                        className="rounded-lg"
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
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Blood Group</label>
                    <Input
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      disabled={!isEditing}
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {viewedRole === 'student' && (
              <TabsContent value="academic">
                <Card className="bg-[#fbeee6] rounded-xl shadow border border-[#b91c1c]">
                  <CardHeader>
                    <CardTitle className="text-[#b91c1c]">Academic Information</CardTitle>
                    <CardDescription className="text-[#2563eb]">
                      Your academic progress and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#b91c1c]">{academicData.cgpa}</p>
                        <p className="text-sm text-[#2563eb]">CGPA</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#2563eb]">{academicData.attendance}%</p>
                        <p className="text-sm text-[#b91c1c]">Attendance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#b91c1c]">
                          {academicData.subjects.length}
                        </p>
                        <p className="text-sm text-[#2563eb]">Subjects</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-[#b91c1c]">Current Semester Subjects</h4>
                      <div className="space-y-3">
                        {academicData.subjects.map((subject, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-[#fbeee6] rounded-lg shadow-sm border border-[#2563eb]"
                          >
                            <div>
                              <p className="font-medium text-[#2563eb]">{subject.name}</p>
                              <p className="text-sm text-[#b91c1c]">{subject.code}</p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant="outline"
                                className="border-[#b91c1c] text-[#b91c1c] bg-[#fff8f3]"
                              >
                                {subject.grade}
                              </Badge>
                              <p className="text-sm text-[#2563eb] mt-1">{subject.credits} credits</p>
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
              <Card className="bg-[#fff8f3] rounded-xl shadow border border-[#b91c1c]">
                <CardHeader>
                  <CardTitle className="text-[#b91c1c]">Achievements & Awards</CardTitle>
                  <CardDescription className="text-[#2563eb]">
                    Your accomplishments and recognitions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.length > 0 ? (
                      achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-[#b91c1c] pl-4 py-3 bg-[#fff8f3] rounded-lg shadow-sm border border-[#b91c1c]"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2 text-[#b91c1c]">
                                <Star className="h-4 w-4 text-[#2563eb]" />
                                {achievement.title}
                              </h4>
                              <p className="text-[#2563eb]">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="h-4 w-4 text-[#b91c1c]" />
                                <span className="text-sm text-[#b91c1c]">
                                  {new Date(achievement.date).toLocaleDateString()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-[#2563eb] text-[#2563eb] bg-[#fff8f3]"
                                >
                                  {achievement.category}
                                </Badge>
                              </div>
                            </div>
                            <Trophy className="h-6 w-6 text-[#b91c1c]" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-[#b91c1c] py-6">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-[#2563eb]" />
                        No achievements added yet.
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-[#b91c1c] text-[#b91c1c] hover:bg-[#fbeee6]"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Add Achievement
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Responsive tweaks */}
      <style>
        {`
          @media (max-width: 640px) {
            .grid-cols-3 {
              grid-template-columns: 1fr !important;
            }
            .lg\\:col-span-2, .lg\\:col-span-1 {
              grid-column: span 1 / span 1 !important;
            }
            .rounded-xl, .rounded-2xl {
              border-radius: 1rem !important;
            }
            .px-2, .sm\\:px-4, .md\\:px-6 {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
