import React, { useState } from 'react';
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

const ClassManagement = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([
    { id: '1', year: 1, semester: 1, section: 'A', subjects: [], students: [], totalStrength: 60 },
    { id: '2', year: 2, semester: 3, section: 'B', subjects: [], students: [], totalStrength: 55 },
    { id: '3', year: 3, semester: 5, section: 'C', subjects: [], students: [], totalStrength: 48 },
  ]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState(1);
  const [newClassSection, setNewClassSection] = useState('A');
  const { toast } = useToast()
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCreateClass = () => {
    if (newClassYear && newClassSection) {
      const newClass: Class = {
        id: String(classes.length + 1),
        year: newClassYear,
        semester: newClassYear * 2 - 1, // Calculate semester based on year
        section: newClassSection,
        subjects: [],
        students: [],
        totalStrength: 0,
      };
      setClasses([...classes, newClass]);
      setIsCreateModalOpen(false);
      setNewClassName('');
      setNewClassYear(1);
      setNewClassSection('A');
      toast({
        title: "Class Created",
        description: "Your class has been created successfully",
      })
    }
  };

  const handleEditClass = (id: string, updatedClass: Omit<Class, 'id'>) => {
    setClasses(prev => prev.map(cls => 
      cls.id === id ? { ...updatedClass, id } : cls
    ));
    toast({
      title: "Class Updated",
      description: "Class has been updated successfully",
    });
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter(c => c.id !== classId));
    toast({
      variant: "destructive",
      title: "Class Deleted",
      description: "Your class has been deleted successfully",
    })
  };

  const handleEditClick = (cls: Class) => {
    setSelectedClass(cls);
    setIsEditModalOpen(true);
  };

  const handlePromoteStudents = () => {
    console.log('Students promoted successfully');
    // Logic to update student years would go here
  };

  const handleClassClick = (cls: Class) => {
    navigate(`/dashboard/classes/${cls.id}/students`);
  };

  const handleStudentClick = (studentId: string) => {
    setIsStudentsModalOpen(false);
    navigate(`/dashboard/profile/student/${studentId}`);
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
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
                <TableHead>Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Total Students</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                 <TableRow key={cls.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleClassClick(cls)}>
                   <TableCell className="font-medium">{cls.year}</TableCell>
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
                       <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClass(cls.id)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total</TableCell>
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="col-span-3" />
            </div>
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
