import React, { useState, useEffect, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import loaderMp4 from '@/Assets/loader.mp4';

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

// --- THEME COLORS (matches dashboard, attendance, timetable) ---
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#b91c1c', // red-700
  accent2: '#2563eb', // blue-700
  indigo: '#6366f1',
  cardBg: '#fff',
  cardShadow: 'shadow-lg',
  textMuted: '#64748b',
  textPrimary: '#1e293b',
  textSecondary: '#334155',
  border: '#e5e7eb'
};

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

  const [newSkill, setNewSkill] = useState('');

  const resumeRef = useRef<HTMLDivElement>(null);

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

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
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

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
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
          skills: [...skills, newSkill].filter(Boolean)
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
    if (!resumeRef.current) return;
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) return;
    const styles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style')
    )
      .map(node => node.outerHTML)
      .join('');
    printWindow.document.write('<html><head><title>Resume</title>');
    printWindow.document.write(styles);
    printWindow.document.write('</head><body>');
    printWindow.document.write(resumeRef.current.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Loader for async actions
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-12" style={{ backgroundColor: THEME.bgBeige }}>
        <video
          src={loaderMp4}
          autoPlay
          loop
          muted
          playsInline
          className="w-24 h-24 object-contain rounded-lg shadow-lg"
          aria-label="Loading animation"
        />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  const resumeData = { personalInfo, education, experience, projects, skills };

  // --- MODERN TEMPLATE (DEFAULT) ---
  if (!isEditing) {
    return (
      <div className="min-h-screen px-2 py-6 sm:px-6 md:px-12" style={{ background: `linear-gradient(135deg, ${THEME.bgBeige} 0%, #eef2ff 100%)` }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 print:hidden mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: THEME.accent }}>
            <img
              src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f393.png"
              alt="Graduation cap"
              className="w-8 h-8 animate-bounce"
              style={{ display: 'inline-block' }}
            />
            Resume Preview
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="border border-[#2563eb] text-[#2563eb] hover:bg-[#eef2ff] w-full sm:w-auto"
              onClick={() => setIsEditing(true)}
            >
              <Code className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button
              onClick={downloadResume}
              className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold shadow w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
        <div
          ref={resumeRef}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-[#e5e7eb] p-8 print:p-0 print:shadow-none print:border-0 relative overflow-hidden"
        >
          {/* Decorative animated background image */}
          <img
            src="https://cdn.pixabay.com/photo/2017/01/31/13/14/animal-2023924_1280.png"
            alt="Decorative"
            className="absolute right-0 top-0 w-32 opacity-10 pointer-events-none animate-float"
            style={{ zIndex: 0 }}
          />
          {/* Animated avatar or icon */}
          <div className="flex flex-col items-center mb-8 relative z-10">
            <img
              src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f464.png"
              alt="Profile"
              className="w-20 h-20 rounded-full shadow-lg border-4 border-[#2563eb] mb-2 animate-fade-in"
            />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: THEME.accent }}>
              {personalInfo.name}
            </h1>
            <div className="flex flex-wrap gap-6 mt-2 text-base md:text-lg" style={{ color: THEME.accent2 }}>
              <span><Mail className="inline h-5 w-5 mr-1" style={{ color: THEME.indigo }} />{personalInfo.email}</span>
              <span><Phone className="inline h-5 w-5 mr-1" style={{ color: THEME.indigo }} />{personalInfo.phone}</span>
              <span><MapPin className="inline h-5 w-5 mr-1" style={{ color: THEME.indigo }} />{personalInfo.location}</span>
            </div>
            {(personalInfo.linkedIn || personalInfo.github) && (
              <div className="flex flex-col gap-2 items-center mt-2">
                {personalInfo.linkedIn && (
                  <a href={personalInfo.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline font-semibold">
                    LinkedIn
                  </a>
                )}
                {personalInfo.github && (
                  <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-[#6366f1] underline font-semibold">
                    GitHub
                  </a>
                )}
              </div>
            )}
          </div>
          {personalInfo.objective && (
            <div className="mb-8 relative z-10">
              <h2 className="text-xl font-bold mb-2" style={{ color: THEME.accent2 }}>
                <span className="inline-block animate-pulse">🎯</span> Objective
              </h2>
              <p className="text-gray-800 text-base leading-relaxed">{personalInfo.objective}</p>
            </div>
          )}
          {/* Education */}
          <div className="mb-8 relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: THEME.accent }}>
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f393.png" alt="Edu" className="w-6 h-6 animate-bounce" />
              Education
            </h2>
            <ul className="space-y-4">
              {education.map((edu, i) => (
                <li key={i} className="pl-4 border-l-4" style={{ borderColor: THEME.accent2 }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base md:text-lg">{edu.degree} in {edu.fieldOfStudy}</span>
                    <span className="italic text-gray-600">{edu.startYear} - {edu.endYear}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: THEME.indigo }}>
                    <span>{edu.institution}</span>
                    <span>Grade: <span className="font-bold">{edu.grade}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Experience */}
          <div className="mb-8 relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: THEME.accent2 }}>
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4bc.png" alt="Exp" className="w-6 h-6 animate-wiggle" />
              Experience
            </h2>
            <ul className="space-y-4">
              {experience.map((exp, i) => (
                <li key={i} className="pl-4 border-l-4" style={{ borderColor: THEME.accent }}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base md:text-lg">{exp.position}</span>
                    <span className="italic text-gray-600">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: THEME.indigo }}>
                    <span>{exp.company}</span>
                  </div>
                  <div className="text-gray-800 text-base leading-relaxed">{exp.description}</div>
                </li>
              ))}
            </ul>
          </div>
          {/* Projects */}
          <div className="mb-8 relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: THEME.accent }}>
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4c8.png" alt="Proj" className="w-6 h-6 animate-float" />
              Projects
            </h2>
            <ul className="space-y-4">
              {projects.map((proj, i) => (
                <li key={i} className="pl-4 border-l-4" style={{ borderColor: THEME.accent2 }}>
                  <span className="font-bold text-base md:text-lg">{proj.name}</span>
                  {proj.link && (
                    <a href={proj.link} className="ml-2 text-[#2563eb] underline font-semibold" target="_blank" rel="noopener noreferrer">[Link]</a>
                  )}
                  <div className="text-gray-800 text-base">{proj.description}</div>
                  <div className="text-xs" style={{ color: THEME.indigo, fontWeight: 600 }}>Tech: {proj.technologies.join(', ')}</div>
                </li>
              ))}
            </ul>
          </div>
          {/* Skills */}
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: THEME.accent2 }}>
              <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9ee.png" alt="Skills" className="w-6 h-6 animate-spin-slow" />
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, i) => (
                <span key={i} className="bg-[#eef2ff] border border-[#6366f1] rounded px-4 py-2 text-base font-semibold" style={{ color: THEME.accent2 }}>
                  <span className="inline-block animate-pulse">{skill}</span>
                </span>
              ))}
            </div>
          </div>
          {/* Simple CSS Animations */}
          <style>
            {`
              @keyframes float {
                0% { transform: translateY(0px);}
                50% { transform: translateY(-10px);}
                100% { transform: translateY(0px);}
              }
              .animate-float { animation: float 3s ease-in-out infinite; }
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fade-in { animation: fade-in 1.2s ease; }
              @keyframes wiggle {
                0%, 100% { transform: rotate(-3deg);}
                50% { transform: rotate(3deg);}
              }
              .animate-wiggle { animation: wiggle 1.5s infinite; }
              .animate-spin-slow { animation: spin 4s linear infinite; }
              @keyframes spin {
                100% { transform: rotate(360deg);}
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  // --- EDIT MODE ---
  return (
    <div className="min-h-screen space-y-6 px-2 py-6 sm:px-6 md:px-12" style={{ background: `linear-gradient(135deg, ${THEME.bgBeige} 0%, #eef2ff 100%)` }}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: THEME.accent }}>Resume Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border border-[#2563eb] text-[#2563eb] hover:bg-[#eef2ff]"
            onClick={() => setIsEditing(false)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={saveResume}
            disabled={saving}
            className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-semibold shadow"
          >
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

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={addSkill}>
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {skill}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => removeSkill(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeBuilder;
