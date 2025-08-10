
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  Award
} from 'lucide-react';
import { Subject } from '@/types';
import AddSubjectModal from './AddSubjectModal';
import EditSubjectModal from './EditSubjectModal';
import { useToast } from "@/hooks/use-toast";

const apiBase = import.meta.env.VITE_API_URL || '/api';

const SubjectManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${apiBase}/subjects`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }
        const data: Array<Record<string, unknown>> = await response.json();
        const mapped: Subject[] = data.map((s) => ({
          id: String(s.id ?? ''),
          name: (s.name ?? '') as string,
          code: (s.code ?? '') as string,
          year: Number(s.year ?? 0),
          semester: Number(s.semester ?? 1) as 1 | 2,
          credits: Number(s.credits ?? 0),
          type: (s.type ?? 'theory') as 'theory' | 'lab' | 'elective',
        }));
        setSubjects(mapped);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subjects",
        });
      }
    };
    fetchSubjects();
  }, []);

  const handleAddSubject = async (newSubject: Omit<Subject, 'id'>) => {
    try {
      const response = await fetch(`${apiBase}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newSubject),
      });
      if (!response.ok) {
        throw new Error('Failed to add subject');
      }
      const data = await response.json();
      const subject: Subject = {
        ...newSubject,
        id: String(data.id ?? ''),
      };
      setSubjects((prev) => [...prev, subject]);
      toast({
        title: "Subject Added",
        description: "Subject has been created successfully",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  };

  const handleEditSubject = async (id: string, updatedSubject: Omit<Subject, 'id'>) => {
    try {
      const response = await fetch(`${apiBase}/subjects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedSubject),
      });
      if (!response.ok) {
        throw new Error('Failed to update subject');
      }
      setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...updatedSubject, id } : subject)));
      toast({
        title: "Subject Updated",
        description: "Subject has been updated successfully",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`${apiBase}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete subject');
      }
      setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
      toast({
        variant: "destructive",
        title: "Subject Deleted",
        description: "Subject has been removed successfully",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  };

  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsEditModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'elective': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || subject.year.toString() === selectedYear;
    const matchesType = selectedType === 'all' || subject.type === selectedType;
    const matchesSemester = selectedSemester === 'all' || subject.semester.toString() === selectedSemester;

    return matchesSearch && matchesYear && matchesType && matchesSemester;
  });

  const subjectStats = {
    total: subjects.length,
    theory: subjects.filter(s => s.type === 'theory').length,
    lab: subjects.filter(s => s.type === 'lab').length,
    elective: subjects.filter(s => s.type === 'elective').length,
    totalCredits: subjects.reduce((sum, s) => sum + s.credits, 0)
  };

  return (
    <div className="space-y-6 bg-background text-foreground px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground">Manage subjects in ECE Department</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold">{subjectStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Theory</p>
                <p className="text-2xl font-bold">{subjectStats.theory}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lab</p>
                <p className="text-2xl font-bold">{subjectStats.lab}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Elective</p>
                <p className="text-2xl font-bold">{subjectStats.elective}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">{subjectStats.totalCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-foreground"
            >
              <option value="all">All Types</option>
              <option value="theory">Theory</option>
              <option value="lab">Lab</option>
              <option value="elective">Elective</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">{subject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{subject.code}</p>
                </div>
                <Badge className={getTypeColor(subject.type)}>
                  {subject.type}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Year/Sem</p>
                  <p className="font-medium">{subject.year}-{subject.semester}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Credits</p>
                  <p className="font-medium">{subject.credits}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditClick(subject)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteSubject(subject.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddSubjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSubject={handleAddSubject}
      />
      
      <EditSubjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditSubject={handleEditSubject}
        subject={selectedSubject}
      />
    </div>
  );
};

export default SubjectManagement;
