import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ProfessorProfileData {
  name: string;
  email: string;
  department: string;
  phone: string;
  subjectsTaught: string[];
  profileImage?: string;
}

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ProfessorProfile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfessorProfileData | null>(null);
  const [formData, setFormData] = useState<ProfessorProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (typeof user?.id !== 'number') return;
        const res = await fetch(`${apiBase}/professors/${String(user.id)}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          data.subjectsTaught = data.subjectsTaught || [];
          setProfile(data);
          setFormData(data);
        } else {
          toast({ variant: 'destructive', title: 'Failed to load profile' });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({ variant: 'destructive', title: 'Failed to load profile' });
      }
    };
    fetchProfile();
  }, [user, toast]);

  const handleInputChange = (field: keyof ProfessorProfileData, value: string) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleSubjectsChange = (value: string) => {
    if (!formData) return;
    setFormData({ ...formData, subjectsTaught: value.split(',').map(s => s.trim()).filter(Boolean) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData) return;

    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${apiBase}/uploads/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, profileImage: data.url });
      } else {
        toast({ variant: 'destructive', title: 'Image upload failed' });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ variant: 'destructive', title: 'Image upload failed' });
    }
  };

  const handleSave = async () => {
    if (!formData || typeof user?.id !== 'number') return;
    try {
      const res = await fetch(`${apiBase}/professors/${String(user.id)}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          department: formData.department,
          phone: formData.phone,
          profileImage: formData.profileImage,
          subjectsTaught: formData.subjectsTaught
        })
      });
      if (res.ok) {
        const updated = await res.json();
        updated.subjectsTaught = updated.subjectsTaught || [];
        setProfile(updated);
        setFormData(updated);
        setIsEditing(false);
        toast({ title: 'Profile updated' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ variant: 'destructive', title: 'Failed to update profile' });
    }
  };

  if (!profile || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Professor Profile</h2>
        {isEditing ? (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => { setIsEditing(false); setFormData(profile); }}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {formData.profileImage ? (
                <AvatarImage src={formData.profileImage} alt={formData.name} />
              ) : (
                <AvatarFallback>{formData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              )}
            </Avatar>
            {isEditing && (
              <>
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Upload
                </Button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              {isEditing ? (
                <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profile.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profile.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              {isEditing ? (
                <Input value={formData.department} onChange={e => handleInputChange('department', e.target.value)} />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profile.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              {isEditing ? (
                <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{profile.phone}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Subjects Taught</label>
              {isEditing ? (
                <Textarea
                  value={formData.subjectsTaught.join(', ')}
                  onChange={e => handleSubjectsChange(e.target.value)}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.subjectsTaught.length > 0 ? (
                    profile.subjectsTaught.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-muted rounded text-sm">
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm p-2 bg-muted rounded">No subjects</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfessorProfile;

