import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
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

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ClassManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassYear, setNewClassYear] = useState(1);
  const [newClassSemester, setNewClassSemester] = useState(1);
  const [newClassSection, setNewClassSection] = useState('A');
  const { toast } = useToast()
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fetchClasses = async () => {
    try {
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load classes',
      });
    }
  };

  useEffect(() => {
    fetchClasses();
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
        variant: 'destructive',
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

  const handlePromoteStudents = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/classes/promote`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <div className="space-y-6 bg-background text-foreground px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes and students in ECE Department</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPromoteModalOpen(true)}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Promote Students
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            View, edit, and manage classes in the ECE Department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your classes.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Total Students</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow
                  key={cls.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleClassClick(cls)}
                >
                  <TableCell className="font-medium">{cls.year}</TableCell>
                  <TableCell>{cls.semester}</TableCell>
                  <TableCell>{`ECE ${cls.year}${cls.year === 1 ? 'st' : cls.year === 2 ? 'nd' : cls.year === 3 ? 'rd' : 'th'} Year`}</TableCell>
                  <TableCell>{cls.section}</TableCell>
                  <TableCell className="text-right">{cls.totalStrength}</TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditClick(cls)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteClass(cls.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>Total</TableCell>
                <TableCell className="text-right">{classes.length}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onPromote={handlePromoteStudents}
      />

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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Class</DialogTitle>
            <DialogDescription>
              Create a new class for the ECE Department.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Year
              </Label>
              <Select onValueChange={(value) => setNewClassYear(parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="semester" className="text-right">
                Semester
              </Label>
              <Select onValueChange={(value) => setNewClassSemester(parseInt(value))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section" className="text-right">
                Section
              </Label>
              <Input id="section" value={newClassSection} onChange={(e) => setNewClassSection(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateClass}>Create class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassManagement;
