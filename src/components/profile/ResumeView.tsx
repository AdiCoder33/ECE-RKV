import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  Globe,
  Calendar
} from 'lucide-react';

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
    objective: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
    grade: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    current: boolean;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  skills: string[];
}

interface ResumeViewProps {
  resumeData: ResumeData;
  showDownload?: boolean;
}

const ResumeView: React.FC<ResumeViewProps> = ({ resumeData, showDownload = true }) => {
  const downloadResume = () => {
    // Create a downloadable PDF version
    window.print();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
      {showDownload && (
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold">Resume Preview</h2>
          <Button onClick={downloadResume} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}

      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 print:p-6">
          {/* Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">
              {resumeData.personalInfo.name}
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-4 print:gap-2">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {resumeData.personalInfo.email}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {resumeData.personalInfo.phone}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {resumeData.personalInfo.location}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm print:gap-2">
              {resumeData.personalInfo.linkedIn && (
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>{resumeData.personalInfo.linkedIn}</span>
                </div>
              )}
              {resumeData.personalInfo.github && (
                <div className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  <span>{resumeData.personalInfo.github}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-6 print:mb-4" />

          {/* Objective */}
          {resumeData.personalInfo.objective && (
            <div className="mb-6 print:mb-4">
              <h2 className="text-xl font-semibold mb-3 flex items-center print:text-lg">
                <User className="h-5 w-5 mr-2" />
                Objective
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {resumeData.personalInfo.objective}
              </p>
            </div>
          )}

          {/* Education */}
          <div className="mb-6 print:mb-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center print:text-lg">
              <GraduationCap className="h-5 w-5 mr-2" />
              Education
            </h2>
            <div className="space-y-4 print:space-y-2">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h3>
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {edu.startYear} - {edu.endYear}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{edu.institution}</p>
                  <p className="text-sm font-medium">Grade: {edu.grade}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          {resumeData.experience.length > 0 && (
            <div className="mb-6 print:mb-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center print:text-lg">
                <Briefcase className="h-5 w-5 mr-2" />
                Experience
              </h2>
              <div className="space-y-4 print:space-y-2">
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold">{exp.position}</h3>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">{exp.company}</p>
                    <p className="text-sm leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects.length > 0 && (
            <div className="mb-6 print:mb-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center print:text-lg">
                <Code className="h-5 w-5 mr-2" />
                Projects
              </h2>
              <div className="space-y-4 print:space-y-2">
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="border-l-2 border-primary pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold">{project.name}</h3>
                      {project.link && (
                        <span className="text-sm text-muted-foreground">{project.link}</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="outline" className="text-xs print:text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resumeData.skills.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center print:text-lg">
                <Code className="h-5 w-5 mr-2" />
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="print:text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeView;