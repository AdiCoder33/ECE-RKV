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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 px-4 md:px-12">
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

  // --- TEMPLATES ---
  // Template 1: Modern (default, as before)
  // Template 2: Elegant (LaTeX-like, serif font, minimal, for PDF/print)
  // Template 3: Colorful (subtle accent colors, for creative roles)

  // --- TABS FOR TEMPLATES ---
  const resumeData = { personalInfo, education, experience, projects, skills };

  if (!isEditing) {
    return (
      <div className="min-h-screen px-2 py-6 sm:px-6 md:px-12 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <div className="flex justify-between items-center print:hidden mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-700 via-yellow-600 to-orange-500 bg-clip-text text-transparent">Resume Preview</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-pink-600 text-pink-700 hover:bg-pink-50"
              onClick={() => setIsEditing(true)}
            >
              <Code className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button
              onClick={downloadResume}
              className="bg-gradient-to-r from-yellow-500 via-pink-500 to-orange-500 text-white font-semibold shadow hover:from-yellow-600 hover:to-orange-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
        <Tabs defaultValue="elegant" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="modern">Modern</TabsTrigger>
            <TabsTrigger value="elegant">Elegant (LaTeX)</TabsTrigger>
            <TabsTrigger value="colorful">Colorful</TabsTrigger>
          </TabsList>
          {/* Modern Template */}
          <TabsContent value="modern">
            <ResumeView ref={resumeRef} resumeData={resumeData} showDownload={false} />
          </TabsContent>
          {/* Elegant (LaTeX-like) Template */}
          <TabsContent value="elegant">
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl border border-gray-200 p-10 font-serif text-gray-900">
              <div className="flex flex-col items-center mb-10">
                <h1 className="text-5xl font-extrabold tracking-tight text-pink-700">{personalInfo.name}</h1>
                <div className="flex flex-wrap gap-6 mt-4 text-lg text-gray-700 font-medium">
                  <span><Mail className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.email}</span>
                  <span><Phone className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.phone}</span>
                  <span><MapPin className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.location}</span>
                </div>
              </div>
              {personalInfo.objective && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2 border-b-2 border-yellow-400 pb-1 text-yellow-700 tracking-wide">Objective</h2>
                  <p className="text-gray-800 text-lg leading-relaxed">{personalInfo.objective}</p>
                </div>
              )}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 border-b-2 border-pink-400 pb-1 text-pink-700 tracking-wide">Education</h2>
                <ul className="space-y-4">
                  {education.map((edu, i) => (
                    <li key={i} className="pl-4 border-l-4 border-yellow-400">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{edu.degree} in {edu.fieldOfStudy}</span>
                        <span className="italic text-gray-600">{edu.startYear} - {edu.endYear}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 font-medium">
                        <span>{edu.institution}</span>
                        <span>Grade: <span className="font-bold">{edu.grade}</span></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 border-b-2 border-yellow-400 pb-1 text-yellow-700 tracking-wide">Experience</h2>
                <ul className="space-y-4">
                  {experience.map((exp, i) => (
                    <li key={i} className="pl-4 border-l-4 border-pink-400">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{exp.position}</span>
                        <span className="italic text-gray-600">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 font-medium">
                        <span>{exp.company}</span>
                      </div>
                      <div className="text-gray-800 text-base leading-relaxed">{exp.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 border-b-2 border-pink-400 pb-1 text-pink-700 tracking-wide">Projects</h2>
                <ul className="space-y-4">
                  {projects.map((proj, i) => (
                    <li key={i} className="pl-4 border-l-4 border-yellow-400">
                      <span className="font-bold text-lg">{proj.name}</span>
                      {proj.link && (
                        <a href={proj.link} className="ml-2 text-pink-600 underline font-semibold" target="_blank" rel="noopener noreferrer">[Link]</a>
                      )}
                      <div className="text-gray-800 text-base">{proj.description}</div>
                      <div className="text-xs text-gray-600 font-semibold">Tech: {proj.technologies.join(', ')}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 border-b-2 border-yellow-400 pb-1 text-yellow-700 tracking-wide">Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, i) => (
                    <span key={i} className="bg-pink-50 border border-yellow-200 rounded px-4 py-2 text-base font-semibold text-pink-700">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          {/* Colorful Template */}
          <TabsContent value="colorful">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-yellow-50 via-pink-50 to-orange-50 shadow-xl rounded-xl border border-yellow-200 p-10">
              <div className="flex flex-col items-center mb-10">
                <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-700 via-yellow-600 to-orange-500">{personalInfo.name}</h1>
                <div className="flex flex-wrap gap-6 mt-4 text-lg text-pink-700 font-medium">
                  <span><Mail className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.email}</span>
                  <span><Phone className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.phone}</span>
                  <span><MapPin className="inline h-5 w-5 mr-1 text-yellow-600" />{personalInfo.location}</span>
                </div>
              </div>
              {personalInfo.objective && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2 text-yellow-700">Objective</h2>
                  <p className="text-pink-900 text-lg leading-relaxed">{personalInfo.objective}</p>
                </div>
              )}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 text-pink-700">Education</h2>
                <ul className="space-y-4">
                  {education.map((edu, i) => (
                    <li key={i} className="pl-4 border-l-4 border-yellow-400">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{edu.degree} in {edu.fieldOfStudy}</span>
                        <span className="italic text-gray-600">{edu.startYear} - {edu.endYear}</span>
                      </div>
                      <div className="flex justify-between text-pink-700 font-medium">
                        <span>{edu.institution}</span>
                        <span>Grade: <span className="font-bold">{edu.grade}</span></span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 text-yellow-700">Experience</h2>
                <ul className="space-y-4">
                  {experience.map((exp, i) => (
                    <li key={i} className="pl-4 border-l-4 border-pink-400">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">{exp.position}</span>
                        <span className="italic text-gray-600">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                      </div>
                      <div className="flex justify-between text-pink-700 font-medium">
                        <span>{exp.company}</span>
                      </div>
                      <div className="text-pink-900 text-base leading-relaxed">{exp.description}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 text-pink-700">Projects</h2>
                <ul className="space-y-4">
                  {projects.map((proj, i) => (
                    <li key={i} className="pl-4 border-l-4 border-yellow-400">
                      <span className="font-bold text-lg">{proj.name}</span>
                      {proj.link && (
                        <a href={proj.link} className="ml-2 text-pink-600 underline font-semibold" target="_blank" rel="noopener noreferrer">[Link]</a>
                      )}
                      <div className="text-pink-900 text-base">{proj.description}</div>
                      <div className="text-xs text-pink-700 font-semibold">Tech: {proj.technologies.join(', ')}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 text-yellow-700">Skills</h2>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, i) => (
                    <span key={i} className="bg-yellow-100 border border-pink-200 rounded px-4 py-2 text-base font-semibold text-pink-700">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // --- EDIT MODE ---
  return (
    <div className="min-h-screen space-y-6 px-2 py-6 sm:px-6 md:px-12 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-700 via-yellow-600 to-orange-500 bg-clip-text text-transparent">Resume Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-pink-600 text-pink-700 hover:bg-pink-50"
            onClick={() => setIsEditing(false)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={saveResume}
            disabled={saving}
            className="bg-gradient-to-r from-yellow-500 via-pink-500 to-orange-500 text-white font-semibold shadow hover:from-yellow-600 hover:to-orange-600"
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
    </div>
  );
};

export default ResumeBuilder;
