import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, BookOpen, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import loaderMp4 from '@/Assets/loader.mp4'; // <-- Add this import

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  faculty_id: number | null;
  room: string;
  year: number;
  section: string;
}

// Theme colors mirroring ClassManagement for a cohesive UI
const THEME = {
  bgBeige: '#fbf4ea',
  accent: '#8b0000',
};

const ProfessorTimetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await fetch(
        `${apiBase}/timetable?facultyId=${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTimetable(data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotForTime = (day: string, time: string) => {
    return timetable.find(slot => slot.day === day && slot.time === time);
  };

  const getSlotsByDay = (day: string) => {
    return timetable.filter(slot => slot.day === day).sort((a, b) => a.time.localeCompare(b.time));
  };

  // Loader component using loader.mp4
  const EceVideoLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-12">
      <video
        src={loaderMp4}
        autoPlay
        loop
        muted
        playsInline
        className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
        aria-label="Loading animation"
      />
      <div className="font-semibold text-lg tracking-wide" style={{ color: THEME.accent }}>
        Loading Timetable...
      </div>
      <div className="text-sm mt-1 text-[#a52a2a]">Fetching your timetable, please wait</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: THEME.bgBeige }}>
        <EceVideoLoader />
      </div>
    );
  }

  return (
    <div
      className="space-y-6 px-2 py-4 sm:px-6 md:px-0"
      style={{ backgroundColor: THEME.bgBeige }}
    >
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ color: THEME.accent }}
        >
          My Timetable
        </h1>
        <p className="text-muted-foreground">Your weekly class schedule</p>
      </div>

      {/* Weekly Timetable Grid */}
      <Card className="bg-white shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: THEME.accent }}
          >
            <Calendar
              className="h-5 w-5"
              style={{ color: THEME.accent }}
            />
            Weekly Schedule
          </CardTitle>
          <CardDescription>Your assigned classes for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left p-3 font-medium bg-[#fbf4ea] sticky left-0 z-20 min-w-[110px] w-[110px]"
                    style={{ background: THEME.bgBeige }}
                  >
                    Time
                  </th>
                  {days.map(day => (
                    <th key={day} className="text-left p-3 font-medium min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-b">
                    <td
                      className="p-3 font-medium text-sm bg-muted/30 sticky left-0 z-10 min-w-[110px] w-[110px] bg-[#fbf4ea]"
                      style={{ background: THEME.bgBeige }}
                    >
                      <Clock
                        className="h-4 w-4 inline mr-2"
                        style={{ color: THEME.accent }}
                      />
                      {time}
                    </td>
                    {days.map(day => {
                      const slot = getSlotForTime(day, time);
                      return (
                        <td key={`${day}-${time}`} className="p-2 min-w-[150px]">
                          {slot ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 hover:bg-red-100 transition-colors cursor-pointer">
                              <div className="font-medium text-red-800 mb-1 flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-red-800" />
                                {slot.subject}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <MapPin className="h-3 w-3 text-red-800" />
                                {slot.room}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3 text-red-800" />
                                Year {slot.year}, Section {slot.section}
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[80px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-400">Free</span>
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

      {/* Daily Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const daySlots = getSlotsByDay(day);
          return (
            <Card key={day} className="bg-white shadow-lg rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-lg"
                  style={{ color: THEME.accent }}
                >
                  {day}
                </CardTitle>
                <CardDescription>
                  {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {daySlots.length > 0 ? (
                  daySlots.map(slot => (
                    <div
                      key={slot.id}
                      className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-800"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-red-800" />
                        <span className="font-medium text-sm">{slot.time}</span>
                      </div>
                      <div className="text-sm font-medium mb-1">{slot.subject}</div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-red-800" />
                          {slot.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-red-800" />
                          {slot.year}-{slot.section}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No classes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessorTimetable;