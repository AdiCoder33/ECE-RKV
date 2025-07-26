import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  year: number;
  section: string;
}

const TimetableManagement = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState('3');
  const [selectedSection, setSelectedSection] = useState('A');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: '',
    time: '',
    subject: '',
    faculty: '',
    room: '',
    year: 3,
    section: 'A'
  });

  // Mock timetable data
  const [timetable, setTimetable] = useState<TimeSlot[]>([
    {
      id: '1',
      day: 'Monday',
      time: '09:00-10:00',
      subject: 'Digital Signal Processing',
      faculty: 'Dr. Rajesh Kumar',
      room: 'ECE-301',
      year: 3,
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
      section: 'A'
    },
    {
      id: '3',
      day: 'Tuesday',
      time: '09:00-10:00',
      subject: 'Communication Systems',
      faculty: 'Dr. Suresh Patel',
      room: 'ECE-301',
      year: 3,
      section: 'A'
    },
    {
      id: '4',
      day: 'Wednesday',
      time: '09:00-10:00',
      subject: 'Digital Signal Processing',
      faculty: 'Dr. Rajesh Kumar',
      room: 'ECE-301',
      year: 3,
      section: 'A'
    },
    {
      id: '5',
      day: 'Thursday',
      time: '10:00-11:00',
      subject: 'Lab - DSP',
      faculty: 'Dr. Rajesh Kumar',
      room: 'ECE-Lab1',
      year: 3,
      section: 'A'
    }
  ]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const filteredTimetable = timetable.filter(slot => 
    slot.year === parseInt(selectedYear) && slot.section === selectedSection
  );

  const handleAddSlot = () => {
    if (!newSlot.day || !newSlot.time || !newSlot.subject) return;
    
    const slot: TimeSlot = {
      id: String(timetable.length + 1),
      ...newSlot,
      year: parseInt(selectedYear),
      section: selectedSection
    };
    
    setTimetable([...timetable, slot]);
    setNewSlot({ day: '', time: '', subject: '', faculty: '', room: '', year: 3, section: 'A' });
    setIsAddModalOpen(false);
  };

  const handleDeleteSlot = (slotId: string) => {
    setTimetable(timetable.filter(slot => slot.id !== slotId));
  };

  const getSlotForTime = (day: string, time: string) => {
    return filteredTimetable.find(slot => slot.day === day && slot.time === time);
  };

  // Faculty view - show only their subjects
  const facultyTimetable = user?.role === 'professor' 
    ? timetable.filter(slot => slot.faculty === user.name)
    : filteredTimetable;

  return (
    <div className="space-y-6 p-4">
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
                    <Input
                      value={newSlot.subject}
                      onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                      placeholder="Subject name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Faculty</label>
                    <Input
                      value={newSlot.faculty}
                      onChange={(e) => setNewSlot({ ...newSlot, faculty: e.target.value })}
                      placeholder="Faculty name"
                    />
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
                Timetable - Year {selectedYear}, Section {selectedSection}
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
                          return (
                            <td key={`${day}-${time}`} className="p-2">
                              {slot ? (
                                <div className="bg-primary/10 rounded-lg p-2 min-h-[60px] relative group">
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
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                </div>
                              ) : (
                                <div className="min-h-[60px] bg-gray-50 rounded-lg"></div>
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

export default TimetableManagement;