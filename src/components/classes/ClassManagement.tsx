import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { Class } from '@/types';
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PromoteStudentsModal from './PromoteStudentsModal';
import ClassStudentsModal from './ClassStudentsModal';
import EditClassModal from './EditClassModal';
import { useNavigate } from 'react-router-dom';
import loaderMp2 from '@/Assets/loader.mp4'; // <-- Add this import at the top
import { useAuth } from '@/contexts/AuthContext';

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Define theme colors for consistency, matching UserManagement's background
const THEME = {
  bgBeige: '#fbf4ea', // original warm beige
  accent: '#8b0000', // deep-maroon, used for headings and primary buttons
};

const ClassManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessor = user?.role === 'professor';
  const [classes, setClasses] = useState<Class[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassYear, setNewClassYear] = useState(1);
  const [newClassSemester, setNewClassSemester] = useState<1 | 2>(1);
  const [newClassSection, setNewClassSection] = useState('A');
  const { toast } = useToast()
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Loader component using loader.mp2 video
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
      <div className="text-[#8b0000] font-semibold text-lg tracking-wide">Loading ECE Classes...</div>
      <div className="text-[#a52a2a] text-sm mt-1">Fetching class data, please wait</div>
    </div>
  );

  // Add loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data: Class[] = await response.json();
      setClasses(data);
    } catch {
      setError('Failed to load classes');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load classes',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleCreateClass = async () => {
    if (newClassYear && newClassSemester && newClassSection) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/classes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            year: newClassYear,
            semester: newClassSemester,
            section: newClassSection,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create class');
        }

        const createdClass: Class = await response.json();
        setClasses(prev => [...prev, createdClass]);
        setIsCreateModalOpen(false);
        setNewClassYear(1);
        setNewClassSemester(1);
        setNewClassSection('A');
        toast({
          title: "Class Created",
          description: "Your class has been created successfully",
        });
      } catch {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create class',
        });
      }
    }
  };

  const handleEditClass = async (id: string, updatedClass: Omit<Class, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedClass),
      });

      if (!response.ok) {
        throw new Error('Failed to update class');
      }

      const updatedClassData: Class = await response.json();
      setClasses(prev =>
        prev.map(cls => (cls.id === id ? updatedClassData : cls))
      );
      toast({
        title: "Class Updated",
        description: "Class has been updated successfully",
      });
    } catch {
      toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update class',
        });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || 'Failed to delete class';
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
        return;
      }

      setClasses(prev => prev.filter(c => c.id !== classId));
      toast({
        title: 'Class Deleted',
        description: 'Your class has been deleted successfully',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete class',
      });
    }
  };

  const handleEditClick = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditModalOpen(true);
  };

  const handlePromoteStudents = async (currentSemester: 1 | 2): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentSemester }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || 'Failed to promote students';
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
        return false;
      }

      const data = await response.json();
      toast({
        title: 'Promotion Complete',
        description: `${data.promoted} students promoted, ${data.graduated} students graduated`,
      });
      await fetchClasses();
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to promote students',
      });
      return false;
    }
  };

  const handleClassClick = (cls: Class) => {
    navigate(`/dashboard/classes/${cls.id}/students`);
  };

  const handleStudentClick = (studentId: string) => {
    setIsStudentsModalOpen(false);
    navigate(`/dashboard/profile/student/${studentId}`);
  };

  const getSemesterColor = (semester: number) => {
    return semester === 1
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  };

  // Show loader or error if needed
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
    <div className="space-y-6 p-4 sm:p-6 md:p-8 min-h-screen text-gray-900 dark:text-stone-100"
         style={{ backgroundColor: THEME.bgBeige }} // Applied the background color here
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-800 dark:text-red-400">Class Management</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Manage classes and students in the ECE Department.</p>
        </div>
        {!isProfessor && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPromoteModalOpen(true)}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Promote Students
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-red-700 text-white hover:bg-red-800 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-lg border-stone-300 dark:border-gray-700">
        <CardHeader className="bg-red-700 dark:bg-red-800 rounded-t-lg p-4">
          <CardTitle className="text-xl font-semibold text-white">Classes</CardTitle>
          <CardDescription className="text-red-100 dark:text-red-200">
            View, edit, and manage classes in the ECE Department.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-stone-200 dark:bg-gray-800">
              <TableRow>
                <TableHead className="w-[80px] font-bold text-gray-800 dark:text-gray-300">Year</TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-300">Semester</TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-300">Name</TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-300">Section</TableHead>
                <TableHead className="text-right font-bold text-gray-800 dark:text-gray-300">Total Students</TableHead>
                {!isProfessor && (
                  <TableHead className="text-center font-bold text-gray-800 dark:text-gray-300">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isProfessor ? 5 : 6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {isProfessor ? 'No classes found.' : 'No classes found. Click "Create Class" to add one.'}
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="cursor-pointer hover:bg-stone-200 dark:hover:bg-gray-800 transition-colors duration-150"
                    onClick={() => handleClassClick(cls)}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-stone-100">{cls.year}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getSemesterColor(cls.semester)}`}>
                        Semester {cls.semester}
                      </span>
                    </TableCell>
                    <TableCell>{`ECE ${cls.year}${cls.year === 1 ? 'st' : cls.year === 2 ? 'nd' : cls.year === 3 ? 'rd' : 'th'} Year`}</TableCell>
                    <TableCell>{cls.section}</TableCell>
                    <TableCell className="text-right">{cls.totalStrength}</TableCell>
                    {!isProfessor && (
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(cls)}
                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
            {classes.length > 0 && (
              <TableFooter className="bg-stone-200 dark:bg-gray-800">
                <TableRow>
                  <TableCell colSpan={isProfessor ? 4 : 5} className="font-bold text-gray-900 dark:text-stone-100">Total Classes</TableCell>
                  <TableCell className="text-right font-bold text-gray-900 dark:text-stone-100">{classes.length}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>

      {!isProfessor && (
        <PromoteStudentsModal
          isOpen={isPromoteModalOpen}
          onClose={() => setIsPromoteModalOpen(false)}
          onPromote={handlePromoteStudents}
        />
      )}

      <ClassStudentsModal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        classData={selectedClass}
        onStudentClick={handleStudentClick}
      />

      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditClass={handleEditClass}
        classData={selectedClass}
      />

      {!isProfessor && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl">
            <DialogHeader className="p-4 border-b border-stone-200 dark:border-gray-700">
              <DialogTitle className="text-2xl font-bold">Create Class</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Create a new class for the ECE Department.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 p-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right font-medium">
                  Year
                </Label>
                <Select onValueChange={(value) => setNewClassYear(parseInt(value))} defaultValue="1">
                  <SelectTrigger className="col-span-3 border-stone-300 dark:border-gray-600">
                    <SelectValue placeholder="Select a year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="semester" className="text-right font-medium">
                  Semester
                </Label>
                <Select onValueChange={(value) => setNewClassSemester(parseInt(value) as 1 | 2)} defaultValue="1">
                  <SelectTrigger className="col-span-3 border-stone-300 dark:border-gray-600">
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="section" className="text-right font-medium">
                  Section
                </Label>
                <Input
                  id="section"
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  className="col-span-3 border-stone-300 dark:border-gray-600"
                />
              </div>
            </div>
            <DialogFooter className="bg-stone-100 dark:bg-gray-800 p-4 rounded-b-lg">
              <Button
                type="submit"
                onClick={handleCreateClass}
                className="bg-red-700 text-white hover:bg-red-800 transition-colors duration-200"
              >
                Create class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClassManagement;
