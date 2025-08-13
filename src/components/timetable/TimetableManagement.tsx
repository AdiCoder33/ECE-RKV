import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

const apiBase = import.meta.env.VITE_API_URL || '/api';

// Define theme colors for consistency across components
const THEME = {
  bgBeige: '#fbf4ea', // original warm beige for background
  accent: '#8b0000', // deep-maroon for headings and primary accents
  accentHover: '#a52a2a', // lighter maroon for hover states
  cardBg: 'bg-white', // white background for cards
  cardShadow: 'shadow-lg', // subtle shadow for cards
  textMuted: 'text-gray-600', // muted text color
};

interface Option { id: string; name: string }

interface ProfessorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  professors: Option[];
  buttonClassName?: string;
  placeholder?: string;
}

const ProfessorCombobox = ({
  value,
  onChange,
  professors,
  buttonClassName,
  placeholder = 'Select faculty'
}: ProfessorComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = professors.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProfessor = professors.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between border-gray-300 focus:border-red-700 focus:ring-red-700', buttonClassName)}
          // Applied consistent border and focus styles
        >
          {selectedProfessor ? selectedProfessor.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search faculty..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No faculty found.</CommandEmpty>
            {filtered.map((prof) => (
              <CommandItem
                key={prof.id}
                value={prof.id}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === prof.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {prof.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  faculty_id: number | null;
  facultyId: string;
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
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [professors, setProfessors] = useState<Option[]>([]);
  const [newSlot, setNewSlot] = useState({
    day: '',
    time: '',
    subject: '',
    facultyId: '',
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
      const response = await fetch(
        `${apiBase}/timetable?year=${selectedYear}&semester=${selectedSemester}&section=${selectedSection}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((slot: any) => ({
          ...slot,
          facultyId: slot.faculty_id ? String(slot.faculty_id) : ''
        }));
        setTimetable(mapped);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load timetable data",
      });
      // Mock data for demo (removed in favor of actual API calls if they work)
      // setTimetable([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(
        `${apiBase}/subjects?year=${selectedYear}&semester=${selectedSemester}`,
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subjects data",
      });
      // Mock data (removed in favor of actual API calls if they work)
      // setSubjects([]);
    }
  };

  const fetchProfessors = async () => {
    try {
      const response = await fetch(`${apiBase}/users?role=professor`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
        setProfessors(mapped);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load professors data",
      });
      // Mock data (removed in favor of actual API calls if they work)
      // setProfessors([]);
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
    if (!newSlot.day || !newSlot.time || !newSlot.subject || !newSlot.facultyId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${apiBase}/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          day: newSlot.day,
          time: newSlot.time,
          subject: newSlot.subject,
          facultyId: newSlot.facultyId,
          room: newSlot.room,
          year: parseInt(selectedYear),
          semester: parseInt(selectedSemester) as 1 | 2,
          section: selectedSection
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: data.message || 'Failed to add timetable slot',
          variant: 'destructive'
        });
        return;
      }

      fetchTimetable();
      setNewSlot({ day: '', time: '', subject: '', facultyId: '', room: '', year: 3, semester: 1, section: 'A' });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Timetable slot added successfully",
      });
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
    if (!confirm('Are you sure you want to delete this timetable slot?')) return; // Confirmation for deletion
    try {
      const response = await fetch(`${apiBase}/timetable/${slotId}`, {
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
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete timetable slot',
          variant: 'destructive'
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

  const handleEditSlot = async (slotId: string, updatedData: Slot) => {
    const slot = timetable.find(s => s.id === slotId);
    if (!slot) return;

    try {
      const response = await fetch(`${apiBase}/timetable/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          day: slot.day,
          time: slot.time,
          year: slot.year,
          semester: slot.semester,
          section: slot.section,
          subject: updatedData.subject,
          facultyId: updatedData.facultyId,
          room: updatedData.room
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: data.message || 'Failed to update timetable slot',
          variant: 'destructive'
        });
        return;
      }

      fetchTimetable();
      setEditingSlot(null);
      toast({
        title: "Success",
        description: "Timetable slot updated successfully",
      });
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

  return (
    <div
      className="space-y-6 px-4 py-4 sm:px-6 md:px-8 min-h-screen" // Adjusted padding for consistency
      style={{ backgroundColor: THEME.bgBeige }} // Applied the consistent background color
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: THEME.accent }}>Timetable Management</h1> {/* Applied accent color to heading */}
          <p className="text-gray-700 mt-1">Manage class schedules and timetables for ECE Department</p> {/* Consistent muted text */}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200" // Styled to match other "Back" buttons
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {(user?.role === 'admin' || user?.role === 'hod') && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-red-700 text-white hover:bg-red-800 transition-colors duration-200"> {/* Styled to match other "Add" buttons */}
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white text-gray-900 rounded-lg shadow-xl"> {/* Consistent modal styling */}
                <DialogHeader className="p-4 border-b border-gray-200"> {/* Consistent modal header */}
                  <DialogTitle className="text-2xl font-bold">Add Time Slot</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Add a new class to the timetable
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 p-4"> {/* Added padding to modal content */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Day</label> {/* Adjusted label color */}
                    <Select value={newSlot.day} onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}>
                      <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {days.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Time</label>
                    <Select value={newSlot.time} onValueChange={(value) => setNewSlot({ ...newSlot, time: value })}>
                      <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <Select value={newSlot.subject} onValueChange={(value) => setNewSlot({ ...newSlot, subject: value })}>
                      <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Faculty</label>
                    <ProfessorCombobox
                      value={newSlot.facultyId}
                      onChange={(value) => setNewSlot({ ...newSlot, facultyId: value })}
                      professors={professors}
                      buttonClassName="border-gray-300 focus:border-red-700 focus:ring-red-700" // Consistent combobox styling
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Room</label>
                    <Input
                      value={newSlot.room}
                      onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                      placeholder="Room number"
                      className="border-gray-300 focus:border-red-700 focus:ring-red-700" // Consistent input styling
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200"> {/* Consistent modal footer */}
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                    Cancel
                  </Button>
                  <Button onClick={handleAddSlot} className="bg-red-700 text-white hover:bg-red-800">
                    Add Slot
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {user?.role !== 'professor' && (
        <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}> {/* Applied card styling */}
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Year</label> {/* Adjusted label color */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Semester</label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="1">Sem 1</SelectItem>
                    <SelectItem value="2">Sem 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="border-gray-300 focus:border-red-700 focus:ring-red-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
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

      <Card className={`${THEME.cardBg} ${THEME.cardShadow} rounded-lg`}> {/* Applied card styling */}
        <CardHeader className="px-4 pt-4 pb-0"> {/* Adjusted header padding */}
          <CardTitle className="flex items-center gap-2 text-gray-900"> {/* Adjusted text color */}
            <Calendar className="h-5 w-5 text-red-700" /> {/* Applied accent color to icon */}
            Timetable - Year {selectedYear}, Sem {selectedSemester}, Section {selectedSection}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4"> {/* Adjusted content padding */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-700">Time</th> {/* Adjusted text color */}
                  {days.map(day => (
                    <th key={day} className="text-left p-3 font-medium min-w-[120px] text-gray-700"> {/* Adjusted text color */}
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-b hover:bg-gray-50"> {/* Added hover effect for rows */}
                    <td className="p-3 font-medium text-sm bg-gray-50 text-gray-700"> {/* Applied light background and text color */}
                      {time}
                    </td>
                    {days.map(day => {
                      const slot = getSlotForTime(day, time);
                      const slotKey = `${day}-${time}`;
                      const isEditing = editingSlot === slotKey;
                      return (
                        <td key={slotKey} className="p-2 align-top"> {/* Align to top for better layout of content */}
                          {slot ? (
                            <div className="bg-red-50 rounded-lg p-2 min-h-[60px] relative group border border-red-200"> {/* Applied red-50 background and border */}
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
                                  <div className="text-xs font-medium text-red-800 mb-1 break-words"> {/* Dark red for subject */}
                                    {slot.subject}
                                  </div>
                                  <div className="text-xs text-gray-600 break-words"> {/* Muted for faculty */}
                                    {slot.faculty}
                                  </div>
                                  <div className="text-xs text-gray-600 break-words"> {/* Muted for room */}
                                    {slot.room}
                                  </div>
                                  {(user?.role === 'admin' || user?.role === 'hod') && (
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-100 rounded" // Adjusted edit button color
                                        onClick={() => setEditingSlot(slotKey)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-700 hover:bg-red-100 rounded" // Adjusted delete button color
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
                              className="min-h-[60px] bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center justify-center border border-gray-200" // Light gray background for empty slots
                              onClick={() => {
                                if (user?.role === 'admin' || user?.role === 'hod') {
                                  setNewSlot({ ...newSlot, day, time });
                                  setIsAddModalOpen(true);
                                }
                              }}
                            >
                              {(user?.role === 'admin' || user?.role === 'hod') && (
                                <Plus className="h-4 w-4 text-gray-500" />
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
    </div>
  );
};

// Inline edit form component
interface Slot {
  subject: string;
  facultyId: string;
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
    facultyId: slot.facultyId,
    room: slot.room
  });

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <div className="space-y-2">
      <Select value={editData.subject} onValueChange={(value) => setEditData({ ...editData, subject: value })}>
        <SelectTrigger className="h-6 text-xs border-gray-300 focus:border-red-700 focus:ring-red-700"> {/* Consistent styling */}
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ProfessorCombobox
        value={editData.facultyId}
        onChange={(value) => setEditData({ ...editData, facultyId: value })}
        professors={professors}
        buttonClassName="h-6 text-xs border-gray-300 focus:border-red-700 focus:ring-red-700" // Consistent styling
        placeholder="Faculty"
      />

      <Input
        value={editData.room}
        onChange={(e) => setEditData({ ...editData, room: e.target.value })}
        placeholder="Room"
        className="h-6 text-xs border-gray-300 focus:border-red-700 focus:ring-red-700" // Consistent styling
      />

      <div className="flex gap-1">
        <Button size="sm" onClick={handleSave} className="h-6 px-2 text-xs bg-red-700 text-white hover:bg-red-800"> {/* Consistent save button */}
          <Save className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-6 px-2 text-xs border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"> {/* Consistent cancel button */}
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default TimetableManagement;
