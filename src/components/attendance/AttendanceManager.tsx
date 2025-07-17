
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  Search, 
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  present: boolean;
  attendancePercentage: number;
}

const AttendanceManager = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('CSE-3A-DS');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'John Doe', rollNumber: '20CS001', present: true, attendancePercentage: 85 },
    { id: '2', name: 'Jane Smith', rollNumber: '20CS002', present: false, attendancePercentage: 92 },
    { id: '3', name: 'Mike Johnson', rollNumber: '20CS003', present: true, attendancePercentage: 78 },
    { id: '4', name: 'Sarah Wilson', rollNumber: '20CS004', present: true, attendancePercentage: 95 },
    { id: '5', name: 'David Brown', rollNumber: '20CS005', present: false, attendancePercentage: 82 },
    { id: '6', name: 'Lisa Davis', rollNumber: '20CS006', present: true, attendancePercentage: 88 },
    { id: '7', name: 'Tom Miller', rollNumber: '20CS007', present: true, attendancePercentage: 91 },
    { id: '8', name: 'Anna Garcia', rollNumber: '20CS008', present: false, attendancePercentage: 76 },
  ]);

  const classes = [
    { id: 'CSE-3A-DS', name: 'Data Structures - CSE 3A', students: 45 },
    { id: 'CSE-3B-ALG', name: 'Algorithms - CSE 3B', students: 42 },
    { id: 'CSE-4A-DB', name: 'Database Systems - CSE 4A', students: 38 },
  ];

  const toggleAttendance = (studentId: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, present: !student.present }
        : student
    ));
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: true })));
  };

  const markAllAbsent = () => {
    setStudents(prev => prev.map(student => ({ ...student, present: false })));
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;
  const attendanceRate = Math.round((presentCount / students.length) * 100);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadge = (percentage: number) => {
    if (percentage >= 85) return { variant: 'default' as const, label: 'Good' };
    if (percentage >= 75) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'destructive' as const, label: 'Critical' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground">Mark and track student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Class and Date Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Select Class</Label>
              <select 
                id="class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-select">Date</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-select">Period</Label>
              <select 
                id="period-select"
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="1">Period 1 (9:00 AM)</option>
                <option value="2">Period 2 (10:00 AM)</option>
                <option value="3">Period 3 (11:00 AM)</option>
                <option value="4">Period 4 (2:00 PM)</option>
                <option value="5">Period 5 (3:00 PM)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <Progress value={attendanceRate} className="mt-2 h-2" />
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>Mark attendance for selected class and date</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                Mark All Absent
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const attendanceBadge = getAttendanceBadge(student.attendancePercentage);
              return (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={student.present}
                      onCheckedChange={() => toggleAttendance(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                        {student.attendancePercentage}%
                      </p>
                      <Badge variant={attendanceBadge.variant} className="text-xs">
                        {attendanceBadge.label}
                      </Badge>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${student.present ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Clock className="h-4 w-4 mr-2" />
          Save Attendance
        </Button>
      </div>
    </div>
  );
};

export default AttendanceManager;
