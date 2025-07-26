import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Edit3,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AlumniProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Priya Sharma',
    email: user?.email || 'priya.sharma@google.com',
    phone: '+91 9876543210',
    currentPosition: 'Senior Software Engineer',
    company: 'Google',
    location: 'Bangalore, India',
    graduationYear: 2020,
    linkedinProfile: 'https://linkedin.com/in/priyasharma',
    bio: 'Passionate software engineer with 4 years of experience in full-stack development. Currently working on AI-powered applications at Google.',
    isAvailableForMentoring: true,
    expertise: ['React', 'Node.js', 'Cloud Computing', 'AI/ML'],
    achievements: ['Technical Excellence Award 2023', 'Published 3 research papers', 'Led team of 8 developers']
  });

  const [newExpertise, setNewExpertise] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const handleSave = () => {
    // Save profile data to backend
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const addExpertise = () => {
    if (newExpertise.trim()) {
      setProfileData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setProfileData(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alumni Profile</h2>
          <p className="text-muted-foreground">Manage your profile information visible to students</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {profileData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="outline" size="sm">
                Upload Photo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              {isEditing ? (
                <Input
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              {isEditing ? (
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              {isEditing ? (
                <Input
                  value={profileData.location}
                  onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.location}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Position</label>
              {isEditing ? (
                <Input
                  value={profileData.currentPosition}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPosition: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.currentPosition}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              {isEditing ? (
                <Input
                  value={profileData.company}
                  onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.company}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Graduation Year</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={profileData.graduationYear}
                  onChange={(e) => setProfileData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.graduationYear}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Profile</label>
              {isEditing ? (
                <Input
                  value={profileData.linkedinProfile}
                  onChange={(e) => setProfileData(prev => ({ ...prev, linkedinProfile: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profileData.linkedinProfile}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            {isEditing ? (
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded">{profileData.bio}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Available for Mentoring</h4>
              <p className="text-sm text-muted-foreground">Allow students to contact you for guidance</p>
            </div>
            <Switch
              checked={profileData.isAvailableForMentoring}
              onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, isAvailableForMentoring: checked }))}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Areas of Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profileData.expertise.map((skill, index) => (
              <div key={index} className="flex items-center">
                <Badge variant="secondary" className="mr-1">
                  {skill}
                </Badge>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeExpertise(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add new expertise..."
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExpertise()}
              />
              <Button onClick={addExpertise}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {profileData.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{achievement}</span>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeAchievement(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                placeholder="Add new achievement..."
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
              />
              <Button onClick={addAchievement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlumniProfile;