
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
  Save
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceStudent {
  id: string;
  name: string;
  rollNumber: number;
  collegeId: string;
  present: boolean;
  attendancePercentage: number;
}

const AttendanceManager = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate students based on selected year and section with sequential roll numbers
  const [students, setStudents] = useState<AttendanceStudent[]>(() => {
    const generatedStudents: AttendanceStudent[] = [];
    for (let i = 1; i <= 60; i++) {
      const collegeId = `20EC${selectedYear}${selectedSection}${i.toString().padStart(3, '0')}`;
      generatedStudents.push({
        id: collegeId,
        name: `Student ${i} ${selectedSection}${selectedYear}`,
        rollNumber: i,
        collegeId,
        present: Math.random() > 0.2, // 80% attendance by default
        attendancePercentage: Math.floor(Math.random() * 20) + 75 // 75-95% attendance
      });
    }
    return generatedStudents;
  });

  const years = ['1', '2', '3', '4'];
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const periods = [
    { value: '1', label: 'Period 1 (9:00 AM - 10:00 AM)' },
    { value: '2', label: 'Period 2 (10:00 AM - 11:00 AM)' },
    { value: '3', label: 'Period 3 (11:00 AM - 12:00 PM)' },
    { value: '4', label: 'Period 4 (2:00 PM - 3:00 PM)' },
    { value: '5', label: 'Period 5 (3:00 PM - 4:00 PM)' },
    { value: '6', label: 'Period 6 (4:00 PM - 5:00 PM)' }
  ];

  // Update students when year/section changes
  React.useEffect(() => {
    const newStudents: AttendanceStudent[] = [];
    for (let i = 1; i <= 60; i++) {
      const collegeId = `20EC${selectedYear}${selectedSection}${i.toString().padStart(3, '0')}`;
      newStudents.push({
        id: collegeId,
        name: `Student ${i} ${selectedSection}${selectedYear}`,
        rollNumber: i,
        collegeId,
        present: Math.random() > 0.2,
        attendancePercentage: Math.floor(Math.random() * 20) + 75
      });
    }
    setStudents(newStudents);
  }, [selectedYear, selectedSection]);

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
    student.collegeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toString().includes(searchTerm)
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

  const handleSaveAttendance = () => {
    console.log('Saving attendance for:', {
      year: selectedYear,
      section: selectedSection,
      date: selectedDate,
      period: selectedPeriod,
      attendance: students.map(s => ({ id: s.id, present: s.present }))
    });
    // Implementation for saving attendance
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select">Year</Label>
              <select 
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}st Year</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section-select">Section</Label>
              <select 
                id="section-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {sections.map(section => (
                  <option key={section} value={section}>Section {section}</option>
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
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                Load Class
              </Button>
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

      {/* Student Attendance Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Student Attendance - Year {selectedYear}, Section {selectedSection}
              </CardTitle>
              <CardDescription>
                {selectedDate} • {periods.find(p => p.value === selectedPeriod)?.label}
              </CardDescription>
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
          {/* Grid Layout for Students */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              const attendanceBadge = getAttendanceBadge(student.attendancePercentage);
              return (
                <Card 
                  key={student.id}
                  className={`p-4 border-2 transition-all cursor-pointer ${
                    student.present ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                  onClick={() => toggleAttendance(student.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Checkbox
                      checked={student.present}
                      onCheckedChange={() => toggleAttendance(student.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={`w-3 h-3 rounded-full ${student.present ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  
                  <div className="text-center space-y-2">
                    {/* Large Roll Number */}
                    <div className="text-4xl font-bold text-primary">
                      {student.rollNumber}
                    </div>
                    
                    {/* Student Name */}
                    <p className="font-medium text-sm text-foreground">{student.name}</p>
                    
                    {/* College ID */}
                    <p className="text-xs text-muted-foreground font-mono">{student.collegeId}</p>
                    
                    {/* Attendance Percentage and Badge */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                        {student.attendancePercentage}%
                      </span>
                      <Badge variant={attendanceBadge.variant} className="text-xs">
                        {attendanceBadge.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleSaveAttendance}>
          <Save className="h-4 w-4 mr-2" />
          Save Attendance
        </Button>
      </div>
    </div>
  );
};

export default AttendanceManager;
