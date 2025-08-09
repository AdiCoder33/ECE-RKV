import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  ArrowLeft,
  BookOpen,
  Save,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  year: number;
  semester: 1 | 2;
  section: string;
}

const TimetableManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState('3');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedSection, setSelectedSection] = useState('A');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  interface Option { id: string; name: string }
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [professors, setProfessors] = useState<Option[]>([]);
  const [newSlot, setNewSlot] = useState({
    day: '',
    time: '',
    subject: '',
    faculty: '',
    room: '',
    year: 3,
    semester: 1 as 1 | 2,
    section: 'A'
  });

  const [timetable, setTimetable] = useState<TimeSlot[]>([]);

  // Fetch timetable data
  useEffect(() => {
    fetchTimetable();
    fetchSubjects();
    fetchProfessors();
  }, [selectedYear, selectedSemester, selectedSection]);

  const fetchTimetable = async () => {
    try {
      const response = await fetch(`/api/timetable?year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTimetable(data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      // Mock data for demo
      setTimetable([
        {
          id: '1',
          day: 'Monday',
          time: '09:00-10:00',
          subject: 'Digital Signal Processing',
          faculty: 'Dr. Rajesh Kumar',
          room: 'ECE-301',
          year: 3,
          semester: 1,
          section: 'A'
        },
        {
          id: '2',
          day: 'Monday',
          time: '10:00-11:00',
          subject: 'Microprocessors',
          faculty: 'Prof. Priya Sharma',
          room: 'ECE-302',
          year: 3,
          semester: 1,
          section: 'A'
        }
      ]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(
        `/api/subjects?year=${selectedYear}&semester=${selectedSemester}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Mock data
      setSubjects([
        { id: '1', name: 'Digital Signal Processing', code: 'ECE301' },
        { id: '2', name: 'Microprocessors', code: 'ECE302' },
        { id: '3', name: 'Communication Systems', code: 'ECE303' }
      ]);
    }
  };

  const fetchProfessors = async () => {
    try {
      const response = await fetch('/api/users?role=professor', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProfessors(data);
      }
    } catch (error) {
      console.error('Error fetching professors:', error);
      // Mock data
      setProfessors([
        { id: '1', name: 'Dr. Rajesh Kumar' },
        { id: '2', name: 'Prof. Priya Sharma' },
        { id: '3', name: 'Dr. Suresh Patel' }
      ]);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const filteredTimetable = timetable.filter(slot =>
    slot.year === parseInt(selectedYear) &&
    slot.semester === parseInt(selectedSemester) &&
    slot.section === selectedSection
  );

  const handleAddSlot = async () => {
    if (!newSlot.day || !newSlot.time || !newSlot.subject || !newSlot.faculty) return;
    
    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newSlot,
          year: parseInt(selectedYear),
          semester: parseInt(selectedSemester) as 1 | 2,
          section: selectedSection
        })
      });

      if (response.ok) {
        fetchTimetable();
        setNewSlot({ day: '', time: '', subject: '', faculty: '', room: '', year: 3, semester: 1, section: 'A' });
        setIsAddModalOpen(false);
        toast({
          title: "Success",
          description: "Timetable slot added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding slot:', error);
      toast({
        title: "Error",
        description: "Failed to add timetable slot",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/timetable/${slotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchTimetable();
        toast({
          title: "Success",
          description: "Timetable slot deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({
        title: "Error",
        description: "Failed to delete timetable slot",
        variant: "destructive"
      });
    }
  };

  const handleEditSlot = async (slotId: string, updatedData: unknown) => {
    try {
      const response = await fetch(`/api/timetable/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        fetchTimetable();
        setEditingSlot(null);
        toast({
          title: "Success",
          description: "Timetable slot updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      toast({
        title: "Error",
        description: "Failed to update timetable slot",
        variant: "destructive"
      });
    }
  };

  const getSlotForTime = (day: string, time: string) => {
    return filteredTimetable.find(slot => slot.day === day && slot.time === time);
  };

  // Faculty view - show only their subjects
  const facultyTimetable = user?.role === 'professor' 
    ? timetable.filter(slot => slot.faculty === user.name)
    : filteredTimetable;

  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground">Manage class schedules and timetables</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {(user?.role === 'admin' || user?.role === 'hod') && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Time Slot</DialogTitle>
                  <DialogDescription>
                    Add a new class to the timetable
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Day</label>
                    <Select value={newSlot.day} onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <Select value={newSlot.time} onValueChange={(value) => setNewSlot({ ...newSlot, time: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Select value={newSlot.subject} onValueChange={(value) => setNewSlot({ ...newSlot, subject: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Faculty</label>
                    <Select value={newSlot.faculty} onValueChange={(value) => setNewSlot({ ...newSlot, faculty: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        {professors.map(professor => (
                          <SelectItem key={professor.id} value={professor.name}>{professor.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Room</label>
                    <Input
                      value={newSlot.room}
                      onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                      placeholder="Room number"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSlot}>
                      Add Slot
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue={user?.role === 'professor' ? 'my-schedule' : 'view'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">
            {user?.role === 'professor' ? 'All Schedules' : 'View Timetable'}
          </TabsTrigger>
          <TabsTrigger value="my-schedule">
            {user?.role === 'professor' ? 'My Schedule' : 'My Timetable'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          {user?.role !== 'professor' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Semester</label>
                    <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Sem 1</SelectItem>
                        <SelectItem value="2">Sem 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Section</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timetable - Year {selectedYear}, Sem {selectedSemester}, Section {selectedSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Time</th>
                      {days.map(day => (
                        <th key={day} className="text-left p-3 font-medium min-w-[120px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time} className="border-b">
                        <td className="p-3 font-medium text-sm bg-muted/30">
                          {time}
                        </td>
                        {days.map(day => {
                          const slot = getSlotForTime(day, time);
                          const slotKey = `${day}-${time}`;
                          const isEditing = editingSlot === slotKey;
                          return (
                            <td key={slotKey} className="p-2">
                              {slot ? (
                                <div className="bg-primary/10 rounded-lg p-2 min-h-[60px] relative group">
                                  {isEditing ? (
                                    <EditSlotForm 
                                      slot={slot}
                                      subjects={subjects}
                                      professors={professors}
                                      onSave={(data) => handleEditSlot(slot.id, data)}
                                      onCancel={() => setEditingSlot(null)}
                                    />
                                  ) : (
                                    <>
                                      <div className="text-xs font-medium text-primary mb-1 break-words">
                                        {slot.subject}
                                      </div>
                                      <div className="text-xs text-muted-foreground break-words">
                                        {slot.faculty}
                                      </div>
                                      <div className="text-xs text-muted-foreground break-words">
                                        {slot.room}
                                      </div>
                                      {(user?.role === 'admin' || user?.role === 'hod') && (
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                            onClick={() => setEditingSlot(slotKey)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="min-h-[60px] bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 flex items-center justify-center"
                                  onClick={() => {
                                    if (user?.role === 'admin' || user?.role === 'hod') {
                                      setNewSlot({ ...newSlot, day, time });
                                      setIsAddModalOpen(true);
                                    }
                                  }}
                                >
                                  {(user?.role === 'admin' || user?.role === 'hod') && (
                                    <Plus className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {facultyTimetable.map(slot => (
                  <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{slot.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {slot.day}, {slot.time} • Room: {slot.room}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Year {slot.year}, Section {slot.section}
                      </p>
                    </div>
                  </div>
                ))}
                {facultyTimetable.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No classes scheduled</h3>
                    <p className="text-muted-foreground">
                      Your schedule will appear here once classes are assigned.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Inline edit form component
interface Slot {
  subject: string;
  faculty: string;
  room: string;
}
interface EditSlotFormProps {
  slot: Slot;
  subjects: Option[];
  professors: Option[];
  onSave: (data: Slot) => void;
  onCancel: () => void;
}
const EditSlotForm = ({ slot, subjects, professors, onSave, onCancel }: EditSlotFormProps) => {
  const [editData, setEditData] = useState<Slot>({
    subject: slot.subject,
    faculty: slot.faculty,
    room: slot.room
  });

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <div className="space-y-2">
      <Select value={editData.subject} onValueChange={(value) => setEditData({ ...editData, subject: value })}>
        <SelectTrigger className="h-6 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={editData.faculty} onValueChange={(value) => setEditData({ ...editData, faculty: value })}>
        <SelectTrigger className="h-6 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {professors.map((professor) => (
            <SelectItem key={professor.id} value={professor.name}>{professor.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input 
        value={editData.room}
        onChange={(e) => setEditData({ ...editData, room: e.target.value })}
        placeholder="Room"
        className="h-6 text-xs"
      />
      
      <div className="flex gap-1">
        <Button size="sm" onClick={handleSave} className="h-6 px-2 text-xs">
          <Save className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-6 px-2 text-xs">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default TimetableManagement;