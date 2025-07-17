
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  UserPlus,
  Calendar,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Class, User } from '@/types';

const ClassManagement = () => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newClassData, setNewClassData] = useState({
    year: 1,
    semester: 1,
    section: 'A'
  });

  // Generate classes for all 4 years with 5 sections each
  const [classes] = useState<Class[]>(() => {
    const generatedClasses: Class[] = [];
    const sections = ['A', 'B', 'C', 'D', 'E'];
    
    for (let year = 1; year <= 4; year++) {
      for (let section of sections) {
        const semester = year === 1 ? 1 : year === 2 ? 3 : year === 3 ? 5 : 7;
        generatedClasses.push({
          id: `${year}-${section}`,
          year,
          semester,
          section,
          hodId: '1',
          hodName: 'Dr. Rajesh Kumar',
          subjects: [],
          students: generateMockStudents(year, section),
          totalStrength: Math.floor(Math.random() * 20) + 50 // 50-70 students
        });
      }
    }
    return generatedClasses;
  });

  // Generate mock students for each class
  function generateMockStudents(year: number, section: string): User[] {
    const students: User[] = [];
    const count = Math.floor(Math.random() * 20) + 50;
    
    for (let i = 1; i <= count; i++) {
      const rollNumber = `20EC${year}${section}${i.toString().padStart(3, '0')}`;
      students.push({
        id: rollNumber,
        name: `Student ${i} ${section}${year}`,
        email: `${rollNumber.toLowerCase()}@student.college.edu`,
        role: 'student',
        department: 'ECE',
        year,
        section,
        rollNumber,
        phone: `+91 98765${Math.floor(Math.random() * 90000) + 10000}`
      });
    }
    return students;
  }

  const getYearColor = (year: number) => {
    switch (year) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      case 4: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateClass = () => {
    // Implementation for creating new class
    console.log('Creating class:', newClassData);
    setShowCreateDialog(false);
  };

  const handleBulkImport = () => {
    // Implementation for bulk student import
    console.log('Bulk importing students');
    setShowBulkImport(false);
  };

  const handlePromoteStudents = () => {
    // Implementation for promoting students
    console.log('Promoting students to next year');
  };

  const totalStudents = classes.reduce((sum, cls) => sum + cls.totalStrength, 0);
  const avgClassSize = Math.round(totalStudents / classes.length);

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedClass(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {selectedClass.year}-{selectedClass.section} Class Details
            </h1>
            <p className="text-muted-foreground">
              Year {selectedClass.year}, Semester {selectedClass.semester} • ECE Department
            </p>
          </div>
        </div>

        {/* Class Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Class Information</CardTitle>
                <CardDescription>
                  Class Coordinator: {selectedClass.hodName}
                </CardDescription>
              </div>
              <Badge className={getYearColor(selectedClass.year)}>
                Year {selectedClass.year}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{selectedClass.totalStrength}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity Utilization</p>
                <p className="text-2xl font-bold">{Math.round((selectedClass.totalStrength / 60) * 100)}%</p>
                <Progress value={(selectedClass.totalStrength / 60) * 100} className="mt-2 h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Attendance</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Students ({selectedClass.students.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Roll Number</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClass.students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{student.rollNumber}</td>
                      <td className="p-3">{student.name}</td>
                      <td className="p-3 text-muted-foreground">{student.email}</td>
                      <td className="p-3">{student.phone}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes and sections in ECE Department</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Students
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Import Students</DialogTitle>
                <DialogDescription>
                  Upload an Excel file to import multiple students at once
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select Excel File</Label>
                  <Input id="file" type="file" accept=".xlsx,.xls" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowBulkImport(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImport}>
                    Import Students
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Add a new class section to the ECE department
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <select
                    id="year"
                    value={newClassData.year}
                    onChange={(e) => setNewClassData({...newClassData, year: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <select
                    id="section"
                    value={newClassData.section}
                    onChange={(e) => setNewClassData({...newClassData, section: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass}>
                    Create Class
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Class Size</p>
                <p className="text-2xl font-bold">{avgClassSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sections Per Year</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-wise Classes Grid */}
      {[1, 2, 3, 4].map(year => (
        <div key={year} className="space-y-4">
          <h2 className="text-xl font-semibold">Year {year}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {classes.filter(cls => cls.year === year).map((classItem) => (
              <Card 
                key={classItem.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedClass(classItem)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {classItem.year}-{classItem.section}
                    </CardTitle>
                    <Badge className={getYearColor(classItem.year)}>
                      {classItem.section}
                    </Badge>
                  </div>
                  <CardDescription>
                    Semester {classItem.semester} • ECE
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="font-semibold">{classItem.totalStrength}</span>
                  </div>
                  
                  <Progress value={(classItem.totalStrength / 60) * 100} className="h-2" />

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common class management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleBulkImport}>
              <Upload className="h-6 w-6" />
              <span>Bulk Student Import</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={handlePromoteStudents}>
              <ArrowRight className="h-6 w-6" />
              <span>Promote Students</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>Export Class Lists</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassManagement;
