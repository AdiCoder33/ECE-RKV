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
import loaderMp2 from '@/Assets/loader.mp4';

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Define theme colors for consistency, matching UserManagement's background
const THEME = {
  bgBeige: '#fbf4ea', // original warm beige
  accent: '#8b0000', // deep-maroon, used for headings and primary buttons
};

const MIN_LOADER_TIME = 1500; // milliseconds

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Loader component using loader.mp4 video
  const EceVideoLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp2}
        autoPlay
        loop
        muted
        playsInline
        className="w-40 h-40 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">Loading ECE Subjects...</div>
      <div className="text-[#a52a2a] text-sm mt-1">Fetching subject data, please wait</div>
    </div>
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      const start = Date.now();
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
        setError('Failed to load subjects');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subjects",
        });
      } finally {
        // Ensure loader is visible for at least MIN_LOADER_TIME
        const elapsed = Date.now() - start;
        if (elapsed < MIN_LOADER_TIME) {
          setTimeout(() => setLoading(false), MIN_LOADER_TIME - elapsed);
        } else {
          setLoading(false);
        }
      }
    };
    fetchSubjects();
  }, [toast]);

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
      case 'theory': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'lab': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'elective': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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

  if (loading)
    return (
      <div className="p-0 flex items-center justify-center min-h-screen" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-600">{error}</div>
    );

  return (
    <div
      className="space-y-6 p-4 sm:p-6 md:p-8 text-gray-900 dark:text-stone-100 min-h-screen"
      style={{ backgroundColor: THEME.bgBeige }} // Applied the background color here
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-800 dark:text-red-400">Subject Management</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage subjects in ECE Department.</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-700 text-white hover:bg-red-800 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <BookOpen className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">{subjectStats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg dark:bg-amber-900">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Theory</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">{subjectStats.theory}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lab</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">{subjectStats.lab}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-fuchsia-100 rounded-lg dark:bg-fuchsia-900">
              <Award className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Elective</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">{subjectStats.elective}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-stone-100">{subjectStats.totalCredits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-lg bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-stone-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-stone-100 focus:ring-red-500"
              />
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-stone-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-stone-100"
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
              className="px-3 py-2 border border-stone-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-stone-100"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-stone-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-stone-100"
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
          <Card key={subject.id} className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border-stone-300 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight text-gray-900 dark:text-stone-100">{subject.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{subject.code}</p>
                </div>
                <Badge className={getTypeColor(subject.type)}>
                  {subject.type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Year/Sem</p>
                  <p className="font-medium text-gray-900 dark:text-stone-100">{subject.year}-{subject.semester}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Credits</p>
                  <p className="font-medium text-gray-900 dark:text-stone-100">{subject.credits}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
                  onClick={() => handleEditClick(subject)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
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
