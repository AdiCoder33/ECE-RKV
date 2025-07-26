import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Upload, 
  Download, 
  Save, 
  FileSpreadsheet,
  GraduationCap,
  Calculator,
  Users,
  Plus,
  Trash2
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  marks?: number;
}

interface MarkEntry {
  studentId: string;
  marks: number;
}

const MarksUpload = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examType, setExamType] = useState('');
  const [maxMarks, setMaxMarks] = useState('40');
  const [examDate, setExamDate] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const classes = [
    { value: '1', label: 'Class 1' },
    { value: '2', label: 'Class 2' },
    { value: '3', label: 'Class 3' },
    { value: '4', label: 'Class 4' }
  ];

  const sections = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' }
  ];

  const subjects = [
    { id: 'ece301', name: 'Digital Signal Processing' },
    { id: 'ece302', name: 'VLSI Design' },
    { id: 'ece303', name: 'Communication Systems' },
    { id: 'ece304', name: 'Microprocessors' }
  ];

  const examTypes = [
    { value: 'mid1', label: 'Mid Term 1' },
    { value: 'mid2', label: 'Mid Term 2' },
    { value: 'internal1', label: 'Internal Assessment 1' },
    { value: 'internal2', label: 'Internal Assessment 2' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'quiz', label: 'Quiz' }
  ];

  // Fetch students when class and section are selected
  const fetchStudents = async () => {
    if (!selectedClass || !selectedSection) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/students?year=${selectedClass}&section=${selectedSection}`);
      if (response.ok) {
        const studentsData = await response.json();
        setStudents(studentsData);
        setMarkEntries([]);
        toast.success(`Loaded ${studentsData.length} students`);
      } else {
        toast.error('Failed to fetch students');
      }
    } catch (error) {
      toast.error('Error fetching students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection]);

  const initializeMarks = () => {
    if (!selectedClass || !selectedSection || !selectedSubject || !examType) {
      toast.error('Please select class, section, subject and exam type first');
      return;
    }
    
    const initialEntries = students.map(student => ({
      studentId: student.id,
      marks: 0
    }));
    setMarkEntries(initialEntries);
    toast.success('Marks sheet initialized for all students');
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        // Parse CSV and extract marks
        const markData: MarkEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length >= 3) {
            const rollNumber = row[0].trim();
            const marks = parseFloat(row[2].trim());
            
            // Find student by roll number
            const student = students.find(s => s.rollNumber === rollNumber);
            if (student && !isNaN(marks)) {
              markData.push({ studentId: student.id, marks });
            }
          }
        }
        
        setMarkEntries(markData);
        toast.success(`Uploaded marks for ${markData.length} students`);
      } catch (error) {
        toast.error('Error parsing Excel file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const updateMarks = (studentId: string, marks: number) => {
    setMarkEntries(prev => {
      const existing = prev.find(entry => entry.studentId === studentId);
      if (existing) {
        return prev.map(entry => 
          entry.studentId === studentId ? { ...entry, marks } : entry
        );
      } else {
        return [...prev, { studentId, marks }];
      }
    });
  };

  const getStudentMarks = (studentId: string) => {
    const entry = markEntries.find(e => e.studentId === studentId);
    return entry ? entry.marks : '';
  };

  const submitMarks = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject || !examType || !maxMarks || markEntries.length === 0) {
      toast.error('Please fill all required fields and enter marks');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/marks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          type: examType,
          maxMarks: parseInt(maxMarks),
          date: examDate || new Date().toISOString().split('T')[0],
          marksData: markEntries,
          enteredBy: JSON.parse(localStorage.getItem('user') || '{}').id
        })
      });

      if (response.ok) {
        toast.success('Marks submitted successfully!');
        
        // Reset form
        setMarkEntries([]);
        setSelectedSubject('');
        setExamType('');
        setMaxMarks('40');
        setExamDate('');
      } else {
        toast.error('Failed to submit marks');
      }
    } catch (error) {
      console.error('Submit marks error:', error);
      toast.error('Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = "Roll Number,Student Name,Marks\n" + 
      students.map(s => `${s.rollNumber},${s.name},`).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marks_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateStats = () => {
    if (markEntries.length === 0) return null;
    
    const validMarks = markEntries.filter(e => e.marks > 0).map(e => e.marks);
    if (validMarks.length === 0) return null;
    
    const total = validMarks.reduce((sum, mark) => sum + mark, 0);
    const average = total / validMarks.length;
    const highest = Math.max(...validMarks);
    const lowest = Math.min(...validMarks);
    
    return { average, highest, lowest, submitted: validMarks.length };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Marks Upload
          </h1>
          <p className="text-muted-foreground mt-2">Upload and manage student marks for internal assessments</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Exam Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Students</label>
              <div className="flex items-center h-10 px-3 py-2 text-sm bg-muted rounded-md">
                {loading ? 'Loading...' : students.length > 0 ? `${students.length} students loaded` : 'Select class & section'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Exam Type</label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Max Marks</label>
              <Input 
                type="number"
                placeholder="Enter max marks"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Exam Date</label>
              <Input 
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={initializeMarks} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Initialize Marks Sheet
            </Button>
            <div className="relative">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleExcelUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="excel-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Excel
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.submitted}</div>
                <div className="text-sm text-muted-foreground">Submitted</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.average.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Average</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.highest}</div>
                <div className="text-sm text-muted-foreground">Highest</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.lowest}</div>
                <div className="text-sm text-muted-foreground">Lowest</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Entry Table */}
      {markEntries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Marks Entry
              </CardTitle>
              <Badge variant="outline">
                {students.length} Students
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Marks (out of {maxMarks})</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const marks = getStudentMarks(student.id);
                    const percentage = marks && maxMarks ? ((Number(marks) / Number(maxMarks)) * 100).toFixed(1) : '0';
                    const grade = Number(percentage) >= 90 ? 'A+' : 
                                 Number(percentage) >= 80 ? 'A' : 
                                 Number(percentage) >= 70 ? 'B+' : 
                                 Number(percentage) >= 60 ? 'B' : 
                                 Number(percentage) >= 50 ? 'C' : 'F';
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.rollNumber}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={marks}
                            onChange={(e) => updateMarks(student.id, Number(e.target.value))}
                            className="w-24"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${Number(percentage) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {percentage}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={grade === 'F' ? 'destructive' : 'default'}>
                            {grade}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMarkEntries([])}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={submitMarks} className="bg-gradient-to-r from-primary to-primary/80">
                <Save className="h-4 w-4 mr-2" />
                Submit Marks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarksUpload;