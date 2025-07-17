
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Calendar
} from 'lucide-react';
import { Class } from '@/types';

const ClassManagement = () => {
  const [classes] = useState<Class[]>([
    {
      id: '1',
      year: 1,
      semester: 1,
      section: 'A',
      hodId: '1',
      hodName: 'Dr. Rajesh Kumar',
      subjects: [],
      students: [],
      totalStrength: 60
    },
    {
      id: '2',
      year: 1,
      semester: 1,
      section: 'B',
      hodId: '1',
      hodName: 'Dr. Rajesh Kumar',
      subjects: [],
      students: [],
      totalStrength: 58
    },
    {
      id: '3',
      year: 2,
      semester: 3,
      section: 'A',
      hodId: '1',
      hodName: 'Dr. Rajesh Kumar',
      subjects: [],
      students: [],
      totalStrength: 55
    },
    {
      id: '4',
      year: 3,
      semester: 5,
      section: 'A',
      hodId: '1',
      hodName: 'Dr. Rajesh Kumar',
      subjects: [],
      students: [],
      totalStrength: 52
    }
  ]);

  const getYearColor = (year: number) => {
    switch (year) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      case 4: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalStudents = classes.reduce((sum, cls) => sum + cls.totalStrength, 0);
  const avgClassSize = Math.round(totalStudents / classes.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes and sections in ECE Department</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Students
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
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
                <p className="text-sm text-muted-foreground">Active Years</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {classItem.year}-{classItem.section}
                </CardTitle>
                <Badge className={getYearColor(classItem.year)}>
                  Year {classItem.year}
                </Badge>
              </div>
              <CardDescription>
                Semester {classItem.semester} • ECE Department
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Class Strength</span>
                <span className="font-semibold">{classItem.totalStrength} students</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Capacity Utilization</span>
                  <span>{Math.round((classItem.totalStrength / 60) * 100)}%</span>
                </div>
                <Progress value={(classItem.totalStrength / 60) * 100} className="h-2" />
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">Class Coordinator</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-foreground">
                      {classItem.hodName?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{classItem.hodName}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Students
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Class Card */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Create New Class</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a new class section to the department
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common class management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Upload className="h-6 w-6" />
              <span>Bulk Student Import</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
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
