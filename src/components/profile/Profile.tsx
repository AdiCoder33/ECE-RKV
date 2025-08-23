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

const THEME = {
  accent: '#8b0000',
  accent2: '#a52a2a',
  accent3: '#b86b2e',
  accent4: '#345b7a',
  accent5: '#2563eb',
  accent6: '#fff6e6',
  accent7: '#fde8e6',
  accent8: '#e0edff',
  accent9: '#fff8f3',
};

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

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const [prevFormData, setPrevFormData] = useState(formData);
  const [prevAcademicData, setPrevAcademicData] = useState(academicData);

  const handleEditClick = () => {
    setPrevFormData(formData);
    setPrevAcademicData(academicData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(prevFormData);
    setAcademicData(prevAcademicData);
    setIsEditing(false);
  };

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
    <div className="min-h-screen space-y-6 px-1 sm:px-2 md:px-4 py-3 sm:py-5 bg-[#fff8f3]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#8b0000] via-[#a52a2a] to-[#b86b2e] bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-[#a52a2a] text-sm sm:text-base">
            Manage your personal information and preferences
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {isEditing && (
              <Button
                variant="outline"
                className="font-semibold shadow border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
                onClick={handleCancelEdit}
                type="button"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => (isEditing ? handleSave() : handleEditClick())}
              variant={isEditing ? 'default' : 'outline'}
              className={`font-semibold shadow ${
                isEditing
                  ? 'bg-[#8b0000] text-white hover:bg-[#a52a2a]'
                  : 'border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]'
              }`}
              type="button"
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
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-[#e0edff] shadow-xl rounded-2xl border border-[#2563eb]">
          <CardHeader className="text-center">
            <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 mb-4 drop-shadow-lg">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Profile"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#8b0000] shadow"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#8b0000] rounded-full flex items-center justify-center shadow border-4 border-[#8b0000]">
                  <span className="text-3xl sm:text-4xl font-bold text-white select-none">
                    {getInitials(formData.name)}
                  </span>
                </div>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 sm:w-9 sm:h-9 p-0 bg-[#8b0000] text-white shadow"
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
            <CardTitle className="text-xl sm:text-2xl font-bold text-[#8b0000] break-words">{formData.name}</CardTitle>
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
                    <p className="text-xs sm:text-sm text-[#345b7a]">
                      {academicData.year}-{academicData.section}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[#8b0000]" />
                  <div>
                    <p className="font-medium">Roll Number</p>
                    <p className="text-xs sm:text-sm text-[#345b7a]">{academicData.rollNumber}</p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-[#2563eb]" />
              <div>
                <p className="font-medium">Department</p>
                <p className="text-xs sm:text-sm text-[#345b7a]">{department || 'ECE'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#8b0000]" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-xs sm:text-sm text-[#345b7a] break-all">{formData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList
              className="flex w-full bg-[#fde8e6] rounded-xl shadow overflow-x-auto no-scrollbar gap-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <TabsTrigger
                value="personal"
                className="flex-1 min-w-[120px] data-[state=active]:bg-[#8b0000] data-[state=active]:text-white data-[state=active]:shadow-lg text-center text-xs sm:text-base"
              >
                <User className="h-4 w-4 mr-1 text-[#8b0000] inline" />
                <span className="align-middle">Personal Info</span>
              </TabsTrigger>
              {viewedRole === 'student' && (
                <TabsTrigger
                  value="academic"
                  className="flex-1 min-w-[120px] data-[state=active]:bg-[#8b0000] data-[state=active]:text-white data-[state=active]:shadow-lg text-center text-xs sm:text-base"
                >
                  <BookOpen className="h-4 w-4 mr-1 text-[#8b0000] inline" />
                  <span className="align-middle">Academic</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="achievements"
                className="flex-1 min-w-[120px] data-[state=active]:bg-[#8b0000] data-[state=active]:text-white data-[state=active]:shadow-lg text-center text-xs sm:text-base"
              >
                <Trophy className="h-4 w-4 mr-1 text-[#8b0000] inline" />
                <span className="align-middle">Achievements</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card className="bg-[#fff8f3] rounded-xl shadow border border-[#e5e7eb]">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Personal Information</CardTitle>
                  <CardDescription className="text-[#345b7a]">
                    Your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Full Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Email</label>
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
                      <label className="text-xs sm:text-sm font-medium">Phone Number</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium">Date of Birth</label>
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
                    <label className="text-xs sm:text-sm font-medium">Address</label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      rows={3}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium">Blood Group</label>
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

            {/* Academic Tab */}
            {viewedRole === 'student' && (
              <TabsContent value="academic">
                <Card className="bg-[#fde8e6] rounded-xl shadow border border-[#8b0000]">
                  <CardHeader>
                    <CardTitle className="text-[#8b0000]">Academic Information</CardTitle>
                    <CardDescription className="text-[#345b7a]">
                      Your academic progress and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#8b0000]">{academicData.cgpa}</p>
                        <p className="text-xs sm:text-sm text-[#345b7a]">CGPA</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#345b7a]">{academicData.attendance}%</p>
                        <p className="text-xs sm:text-sm text-[#8b0000]">Attendance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#8b0000]">
                          {academicData.subjects.length}
                        </p>
                        <p className="text-xs sm:text-sm text-[#345b7a]">Subjects</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-[#8b0000]">Current Semester Subjects</h4>
                      <div className="space-y-3">
                        {academicData.subjects.map((subject, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#fff6e6] rounded-lg shadow-sm border border-[#8b0000]"
                          >
                            <div>
                              <p className="font-medium text-[#345b7a]">{subject.name}</p>
                              <p className="text-xs sm:text-sm text-[#8b0000]">{subject.code}</p>
                            </div>
                            <div className="text-right mt-2 sm:mt-0">
                              <Badge
                                variant="outline"
                                className="border-[#8b0000] text-[#8b0000] bg-[#fff8f3]"
                              >
                                {subject.grade}
                              </Badge>
                              <p className="text-xs sm:text-sm text-[#345b7a] mt-1">{subject.credits} credits</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Achievements Tab */}
            <TabsContent value="achievements">
              <Card className="bg-[#fff8f3] rounded-xl shadow border border-[#8b0000]">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Achievements & Awards</CardTitle>
                  <CardDescription className="text-[#345b7a]">
                    Your accomplishments and recognitions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {achievements.length > 0 ? (
                      achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-[#8b0000] pl-4 py-3 bg-[#fff6e6] rounded-lg shadow-sm border border-[#8b0000]"
                        >
                          <div className="flex flex-col sm:flex-row items-start justify-between">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2 text-[#8b0000]">
                                <Star className="h-4 w-4 text-[#345b7a]" />
                                {achievement.title}
                              </h4>
                              <p className="text-[#345b7a]">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="h-4 w-4 text-[#8b0000]" />
                                <span className="text-xs sm:text-sm text-[#8b0000]">
                                  {new Date(achievement.date).toLocaleDateString()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-[#345b7a] text-[#345b7a] bg-[#fff8f3]"
                                >
                                  {achievement.category}
                                </Badge>
                              </div>
                            </div>
                            <Trophy className="h-6 w-6 text-[#8b0000] mt-2 sm:mt-0" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-[#8b0000] py-6">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-[#345b7a]" />
                        No achievements added yet.
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]"
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
            .px-1, .sm\\:px-2, .md\\:px-4 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
