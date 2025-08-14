import React, { forwardRef, useRef, useImperativeHandle } from 'react';
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

const ResumeView = forwardRef<HTMLDivElement, ResumeViewProps>(({ resumeData, showDownload = true }, ref) => {
  const resumeRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => resumeRef.current as HTMLDivElement);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div ref={resumeRef} className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:bg-white">
      {showDownload && (
        <div className="flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Resume Preview
          </h2>
          <Button onClick={downloadResume} className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      )}

      <Card className="print:shadow-none print:border-none bg-gradient-to-br from-background to-background/95 border-primary/20">
        <CardContent className="p-10 print:p-8">
          {/* Header with gradient background */}
          <div className="relative mb-10 print:mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg -m-6 print:hidden" />
            <div className="relative text-center p-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-3 print:text-3xl print:text-foreground">
                {resumeData.personalInfo.name}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4 print:gap-2">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-medium">{resumeData.personalInfo.email}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-medium">{resumeData.personalInfo.phone}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{resumeData.personalInfo.location}</span>
                </div>
              </div>
              
              {(resumeData.personalInfo.linkedIn || resumeData.personalInfo.github) && (
                <div className="flex flex-wrap justify-center gap-6 text-sm print:gap-3">
                  {resumeData.personalInfo.linkedIn && (
                    <div className="flex items-center gap-2 text-primary">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">{resumeData.personalInfo.linkedIn}</span>
                    </div>
                  )}
                  {resumeData.personalInfo.github && (
                    <div className="flex items-center gap-2 text-primary">
                      <Code className="h-4 w-4" />
                      <span className="font-medium">{resumeData.personalInfo.github}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-8 print:mb-6 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

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
          <div className="mb-8 print:mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-primary print:text-xl">
              <div className="p-2 bg-primary/10 rounded-lg mr-3 print:bg-transparent print:p-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              Education
            </h2>
            <div className="space-y-6 print:space-y-4">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="relative bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border border-primary/20 print:bg-transparent print:border-l-2 print:border-primary print:pl-4 print:p-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-foreground">{edu.degree} in {edu.fieldOfStudy}</h3>
                    <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {edu.startYear} - {edu.endYear}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-medium mb-1">{edu.institution}</p>
                  <p className="text-sm font-semibold text-primary">Grade: {edu.grade}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          {resumeData.experience.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-primary print:text-xl">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 print:bg-transparent print:p-0">
                  <Briefcase className="h-6 w-6" />
                </div>
                Experience
              </h2>
              <div className="space-y-6 print:space-y-4">
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="relative bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border border-primary/20 print:bg-transparent print:border-l-2 print:border-primary print:pl-4 print:p-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-foreground">{exp.position}</h3>
                      <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-medium mb-3">{exp.company}</p>
                    <p className="text-sm leading-relaxed text-foreground/90">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.projects.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-primary print:text-xl">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 print:bg-transparent print:p-0">
                  <Code className="h-6 w-6" />
                </div>
                Projects
              </h2>
              <div className="space-y-6 print:space-y-4">
                {resumeData.projects.map((project, index) => (
                  <div key={index} className="relative bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border border-primary/20 print:bg-transparent print:border-l-2 print:border-primary print:pl-4 print:p-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-foreground">{project.name}</h3>
                      {project.link && (
                        <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                          <Globe className="h-3 w-3 mr-1" />
                          Link
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-4 text-foreground/90">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 print:bg-transparent print:border print:border-primary">
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
              <h2 className="text-2xl font-bold mb-6 flex items-center text-primary print:text-xl">
                <div className="p-2 bg-primary/10 rounded-lg mr-3 print:bg-transparent print:p-0">
                  <Code className="h-6 w-6" />
                </div>
                Technical Skills
              </h2>
              <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-lg border border-primary/20 print:bg-transparent print:border-none print:p-0">
                <div className="flex flex-wrap gap-3">
                  {resumeData.skills.map((skill, index) => (
                    <Badge key={index} variant="default" className="text-sm font-medium bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-2 print:bg-transparent print:border print:border-primary print:text-primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default ResumeView;