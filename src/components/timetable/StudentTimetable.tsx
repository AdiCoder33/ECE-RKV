import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, BookOpen, MapPin, User, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import loaderMp4 from '@/Assets/loader.mp4';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface TimeSlot {
  id: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  faculty_id: number | null;
  room: string;
  year: number;
  semester: 1 | 2;
  section: string;
}

const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] py-12 px-4">
    <video
      src={loaderMp4}                   
      autoPlay
      loop
      muted
      playsInline
      className="w-32 h-32 object-contain mb-4 rounded-lg shadow-lg"
      aria-label="Loading animation"
    />
    <div className="text-indigo-700 font-semibold text-lg tracking-wide">Loading Timetable...</div>
    <div className="text-indigo-400 text-sm mt-1">Fetching your timetable, please wait</div>
  </div>
);

// Gradient helpers for consistency
const gradientBlue = "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50";
const gradientGreen = "bg-gradient-to-br from-green-100 via-teal-50 to-blue-50";
const gradientWhite = "bg-white/90";
const gradientTableCurrent = "border-[#b91c1c] bg-gradient-to-r from-red-100 via-orange-50 to-yellow-50 shadow-md";
const gradientTableNormal = "border-indigo-100 bg-gradient-to-r from-white via-gray-50 to-indigo-50 hover:bg-indigo-50/60";
const gradientFree = "bg-gradient-to-r from-gray-50 via-white to-indigo-50 border-2 border-dashed border-indigo-100";

const THEME = {
  bgBeige: '#fbf4ea', // Matches StudentDashboard, StudentSubjects, StudentAttendance
};

const StudentTimetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:30-09:30',
    '09:30-10:30',
    '10:40-11:40',
    '11:40-12:40',
    '13:30-14:30',
    '14:30-15:30',
    '15:40-16:40'
  ];

  const studentYear = user?.year || 3;
  const studentSemester = user?.semester || 1;
  const studentSection = user?.section || 'A';

  useEffect(() => {
    fetchTimetable();
    // eslint-disable-next-line
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await fetch(`${apiBase}/timetable?year=${studentYear}&semester=${studentSemester}&section=${studentSection}`, {
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
    } finally {
      setLoading(false);
    }
  };

  const getSlotForTime = (day: string, time: string) => {
    return timetable.find(slot => slot.day === day && slot.time === time);
  };

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return timetable.filter(slot => slot.day === today).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getNextClass = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const todayClasses = getTodaySchedule();
    return todayClasses.find(slot => {
      const classTime = slot.time.split('-')[0];
      return classTime > currentTime;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-8" style={{ backgroundColor: THEME.bgBeige }}>
        <Loader />
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const nextClass = getNextClass();

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-4 md:px-12" style={{ backgroundColor: THEME.bgBeige }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#b91c1c' }}>My Timetable</h1>
        <p className="text-indigo-700">
          Class schedule for Year {studentYear}, Sem {studentSemester}, Section {studentSection}
        </p>
      </div>

      {/* Today's Schedule & Next Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Classes */}
        <Card className={`${gradientBlue} border-0 shadow-lg rounded-2xl`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Classes
            </CardTitle>
            <CardDescription className="text-blue-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map(slot => (
                  <div key={slot.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-xl border border-blue-100">
                    <div className="w-2 h-12 bg-blue-400 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">{slot.subject}</div>
                      <div className="text-sm text-blue-700 flex items-center gap-2">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        <span className="font-semibold text-indigo-700">{slot.time}</span>
                        <MapPin className="h-3 w-3 text-indigo-400" />
                        <span className="text-indigo-600">{slot.room}</span>
                      </div>
                      <div className="text-xs text-blue-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {slot.faculty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <GraduationCap className="h-12 w-12 mx-auto text-blue-200 mb-2" />
                <p className="text-blue-400">No classes today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Class */}
        <Card className={`${gradientGreen} border-0 shadow-lg rounded-2xl`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Clock className="h-5 w-5 text-green-600" />
              Next Class
            </CardTitle>
            <CardDescription className="text-green-500">Upcoming class information</CardDescription>
          </CardHeader>
          <CardContent>
            {nextClass ? (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-green-50 via-white to-teal-50 border border-green-100 rounded-xl">
                  <div className="font-medium text-green-900 text-lg mb-2">{nextClass.subject}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{nextClass.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MapPin className="h-4 w-4" />
                      {nextClass.room}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <User className="h-4 w-4" />
                      {nextClass.faculty}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 mx-auto text-green-200 mb-2" />
                <p className="text-green-400">No more classes today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timetable Grid */}
      <Card className={`${gradientWhite} border-0 shadow-lg rounded-2xl`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#b91c1c' }}>
            <Calendar className="h-5 w-5 text-[#b91c1c]" />
            Weekly Schedule
          </CardTitle>
          <CardDescription className="text-indigo-500">Complete weekly class timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-indigo-700 bg-indigo-50">Time</th>
                  {days.map(day => (
                    <th key={day} className="text-left p-3 font-medium min-w-[120px] text-indigo-700 bg-indigo-50">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-b">
                    <td className="p-3 font-medium text-sm bg-indigo-50 text-indigo-800">
                      <Clock className="h-4 w-4 inline mr-2 text-indigo-500" />
                      <span className="font-semibold text-indigo-700">{time}</span>
                    </td>
                    {days.map(day => {
                      const slot = getSlotForTime(day, time);
                      const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      const isCurrentTime = isToday && (() => {
                        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                        const [startTime, endTime] = time.split('-');
                        return currentTime >= startTime && currentTime <= endTime;
                      })();

                      return (
                        <td key={`${day}-${time}`} className="p-2 align-top">
                          {slot ? (
                            <div className={`rounded-xl p-3 transition-colors border
                              ${isCurrentTime
                                ? gradientTableCurrent
                                : gradientTableNormal
                            }`}>
                              <div className="font-medium text-indigo-900 mb-1 flex items-center gap-1">
                                <BookOpen className="h-3 w-3 text-indigo-700" />
                                {slot.subject}
                              </div>
                              <div className="text-xs text-indigo-600 flex items-center gap-1 mb-1">
                                <MapPin className="h-3 w-3 text-indigo-400" />
                                {slot.room}
                              </div>
                              <div className="text-xs text-indigo-600 flex items-center gap-1">
                                <User className="h-3 w-3 text-indigo-400" />
                                {slot.faculty}
                              </div>
                              {isCurrentTime && (
                                <div className="mt-2 text-xs font-medium text-[#b91c1c] animate-pulse">
                                  ● Now
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`min-h-[70px] ${gradientFree} rounded-xl flex items-center justify-center`}>
                              <span className="text-xs text-indigo-300">Free</span>
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

export default StudentTimetable;