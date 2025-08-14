import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Code,
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ResumeView from './ResumeView';

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

const ResumeBuilder = () => {
  const { user } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('token');
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    linkedIn: '',
    github: '',
    objective: ''
  });

  const [education, setEducation] = useState<Education[]>([]);

  const [experience, setExperience] = useState<Experience[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);

  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchResume = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiBase}/resumes/${user.id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setPersonalInfo(data.personalInfo || {
            name: user?.name || '',
            email: user?.email || '',
            phone: '',
            location: '',
            linkedIn: '',
            github: '',
            objective: ''
          });
          setEducation(data.education || []);
          setExperience(data.experience || []);
          setProjects(data.projects || []);
          setSkills(data.skills || []);
        } else if (res.status !== 404) {
          throw new Error('Failed to load resume');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [user?.id, apiBase, token]);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      grade: ''
    };
    setEducation([...education, newEducation]);
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      current: false
    };
    setExperience([...experience, newExperience]);
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      link: ''
    };
    setProjects([...projects, newProject]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(proj => proj.id !== id));
  };

  const saveResume = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${apiBase}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          personalInfo,
          education,
          experience,
          projects,
          skills
        })
      });
      if (!res.ok) {
        throw new Error('Failed to save resume');
      }
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const downloadResume = () => {
    // Generate and download PDF
    console.log('Downloading resume...');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!isEditing) {
    // Resume Preview Mode - Use the standardized ResumeView component
    const resumeData = {
      personalInfo,
      education,
      experience,
      projects,
      skills
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Resume Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Code className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button onClick={downloadResume} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <ResumeView resumeData={resumeData} showDownload={false} />
      </div>
    );
  }

  // Resume Edit Mode
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resume Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveResume} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Resume'}
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input 
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input 
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input 
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Professional Objective</label>
            <Textarea 
              value={personalInfo.objective}
              onChange={(e) => setPersonalInfo({...personalInfo, objective: e.target.value})}
              placeholder="Brief description of your career goals..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addEducation}>
              <Plus className="h-4 w-4 mr-1" />
              Add Education
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.map((edu, index) => (
            <div key={edu.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Education {index + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input 
                  placeholder="Institution"
                  value={edu.institution}
                  onChange={(e) => {
                    const updated = education.map(item => 
                      item.id === edu.id ? {...item, institution: e.target.value} : item
                    );
                    setEducation(updated);
                  }}
                />
                <Input 
                  placeholder="Degree"
                  value={edu.degree}
                  onChange={(e) => {
                    const updated = education.map(item => 
                      item.id === edu.id ? {...item, degree: e.target.value} : item
                    );
                    setEducation(updated);
                  }}
                />
                <Input 
                  placeholder="Field of Study"
                  value={edu.fieldOfStudy}
                  onChange={(e) => {
                    const updated = education.map(item => 
                      item.id === edu.id ? {...item, fieldOfStudy: e.target.value} : item
                    );
                    setEducation(updated);
                  }}
                />
                <Input 
                  placeholder="Grade/CGPA"
                  value={edu.grade}
                  onChange={(e) => {
                    const updated = education.map(item => 
                      item.id === edu.id ? {...item, grade: e.target.value} : item
                    );
                    setEducation(updated);
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addExperience}>
              <Plus className="h-4 w-4 mr-1" />
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.map((exp, index) => (
            <div key={exp.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Experience {index + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input 
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => {
                    const updated = experience.map(item => 
                      item.id === exp.id ? {...item, company: e.target.value} : item
                    );
                    setExperience(updated);
                  }}
                />
                <Input 
                  placeholder="Position"
                  value={exp.position}
                  onChange={(e) => {
                    const updated = experience.map(item => 
                      item.id === exp.id ? {...item, position: e.target.value} : item
                    );
                    setExperience(updated);
                  }}
                />
              </div>
              <Textarea 
                placeholder="Job description and achievements..."
                value={exp.description}
                onChange={(e) => {
                  const updated = experience.map(item => 
                    item.id === exp.id ? {...item, description: e.target.value} : item
                  );
                  setExperience(updated);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Projects
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addProject}>
              <Plus className="h-4 w-4 mr-1" />
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project, index) => (
            <div key={project.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Project {index + 1}</h4>
                <Button variant="ghost" size="sm" onClick={() => removeProject(project.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <Input 
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => {
                    const updated = projects.map(item => 
                      item.id === project.id ? {...item, name: e.target.value} : item
                    );
                    setProjects(updated);
                  }}
                />
                <Textarea 
                  placeholder="Project description..."
                  value={project.description}
                  onChange={(e) => {
                    const updated = projects.map(item => 
                      item.id === project.id ? {...item, description: e.target.value} : item
                    );
                    setProjects(updated);
                  }}
                />
                <Input 
                  placeholder="Project link (optional)"
                  value={project.link}
                  onChange={(e) => {
                    const updated = projects.map(item => 
                      item.id === project.id ? {...item, link: e.target.value} : item
                    );
                    setProjects(updated);
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeBuilder;
