import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [isEditing, setIsEditing] = useState(true);
  
  // Mock data - replace with actual API calls
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || 'Aarav Patel',
    email: user?.email || 'aarav.patel@student.edu',
    phone: '+91 9876543210',
    location: 'Mumbai, Maharashtra',
    linkedIn: 'linkedin.com/in/aaravpatel',
    github: 'github.com/aaravpatel',
    objective: 'Passionate computer science student seeking internship opportunities in software development.'
  });

  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      institution: 'ABC Engineering College',
      degree: 'Bachelor of Technology',
      fieldOfStudy: 'Electronics and Communication Engineering',
      startYear: '2020',
      endYear: '2024',
      grade: '8.4 CGPA'
    }
  ]);

  const [experience, setExperience] = useState<Experience[]>([
    {
      id: '1',
      company: 'TechCorp Solutions',
      position: 'Software Development Intern',
      startDate: '2023-06',
      endDate: '2023-08',
      description: 'Developed web applications using React and Node.js. Improved application performance by 30%.',
      current: false
    }
  ]);

  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'E-Commerce Platform',
      description: 'Full-stack web application with React frontend and Node.js backend',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
      link: 'github.com/aaravpatel/ecommerce'
    }
  ]);

  const [skills] = useState([
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'MongoDB', 'MySQL', 'Git', 'Docker'
  ]);

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

  const saveResume = () => {
    // Save resume data to backend
    console.log('Saving resume...');
    setIsEditing(false);
  };

  const downloadResume = () => {
    // Generate and download PDF
    console.log('Downloading resume...');
  };

  if (!isEditing) {
    // Resume Preview Mode
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Resume Preview</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Code className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button onClick={downloadResume}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold text-foreground">{personalInfo.name}</h1>
              <div className="flex justify-center items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {personalInfo.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {personalInfo.phone}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {personalInfo.location}
                </div>
              </div>
              {personalInfo.objective && (
                <p className="mt-4 text-muted-foreground italic">{personalInfo.objective}</p>
              )}
            </div>

            {/* Education */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </h2>
              {education.map((edu) => (
                <div key={edu.id} className="mb-4">
                  <h3 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h3>
                  <p className="text-muted-foreground">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">{edu.startYear} - {edu.endYear} | Grade: {edu.grade}</p>
                </div>
              ))}
            </div>

            {/* Experience */}
            {experience.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </h2>
                {experience.map((exp) => (
                  <div key={exp.id} className="mb-4">
                    <h3 className="font-semibold">{exp.position}</h3>
                    <p className="text-muted-foreground">{exp.company}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    <p className="mt-2">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Projects
                </h2>
                {projects.map((project) => (
                  <div key={project.id} className="mb-4">
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-muted-foreground mb-2">{project.description}</p>
                    <div className="flex gap-1 mb-2">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    {project.link && (
                      <p className="text-sm text-primary">{project.link}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            <div>
              <h2 className="text-xl font-bold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
          <Button onClick={saveResume}>
            <Save className="h-4 w-4 mr-2" />
            Save Resume
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