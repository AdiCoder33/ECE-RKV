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

const ClassManagement = () => {
  const [classes, setClasses] = useState<Class[]>([
    { id: '1', name: 'ECE 1st Year', year: 1, section: 'A', totalStudents: 60 },
    { id: '2', name: 'ECE 2nd Year', year: 2, section: 'B', totalStudents: 55 },
    { id: '3', name: 'ECE 3rd Year', year: 3, section: 'C', totalStudents: 48 },
  ]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState(1);
  const [newClassSection, setNewClassSection] = useState('A');
  const { toast } = useToast()
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  const handleCreateClass = () => {
    if (newClassName && newClassYear && newClassSection) {
      const newClass: Class = {
        id: String(classes.length + 1),
        name: newClassName,
        year: newClassYear,
        section: newClassSection,
        totalStudents: 0,
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

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter(c => c.id !== classId));
    toast({
      variant: "destructive",
      title: "Class Deleted",
      description: "Your class has been deleted successfully",
    })
  };

  const handlePromoteStudents = () => {
    console.log('Students promoted successfully');
    // Logic to update student years would go here
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
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">{cls.year}</TableCell>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.section}</TableCell>
                  <TableCell className="text-right">{cls.totalStudents}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="outline" size="icon">
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
