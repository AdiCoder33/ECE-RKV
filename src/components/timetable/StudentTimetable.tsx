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

const StudentTimetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center px-4 md:px-8">
        <Loader />
      </div>
    );
  }

  const todaySchedule = getTodaySchedule();
  const nextClass = getNextClass();

  return (
    <div className="min-h-screen space-y-6 px-2 py-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Add gap between sidebar and main content only on desktop */}
      <div className="hidden md:block" aria-hidden="true">
        <div className="h-0 w-0 md:w-8 lg:w-16 xl:w-24 2xl:w-32 float-left"></div>
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-purple-900">My Timetable</h1>
        <p className="text-purple-700">
          Class schedule for Year {studentYear}, Sem {studentSemester}, Section {studentSection}
        </p>
      </div>

      {/* Today's Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100 border-0 shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-900">
              <Calendar className="h-5 w-5 text-pink-600" />
              Today's Classes
            </CardTitle>
            <CardDescription className="text-pink-500">
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
                  <div key={slot.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 via-white to-purple-50 rounded-lg border border-pink-100">
                    <div className="w-2 h-12 bg-pink-400 rounded-full"></div>
                    <div className="flex-1">
                      <div className="font-medium text-pink-900">{slot.subject}</div>
                      <div className="text-sm text-pink-700 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {slot.time}
                        <MapPin className="h-3 w-3" />
                        {slot.room}
                      </div>
                      <div className="text-xs text-pink-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {slot.faculty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <GraduationCap className="h-12 w-12 mx-auto text-pink-200 mb-2" />
                <p className="text-pink-400">No classes today</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white via-green-50 to-teal-100 border-0 shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <Clock className="h-5 w-5 text-teal-600" />
              Next Class
            </CardTitle>
            <CardDescription className="text-teal-500">Upcoming class information</CardDescription>
          </CardHeader>
          <CardContent>
            {nextClass ? (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-teal-50 via-white to-green-50 border border-teal-100 rounded-lg">
                  <div className="font-medium text-teal-900 text-lg mb-2">{nextClass.subject}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-teal-700">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{nextClass.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-teal-600">
                      <MapPin className="h-4 w-4" />
                      {nextClass.room}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-teal-600">
                      <User className="h-4 w-4" />
                      {nextClass.faculty}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 mx-auto text-teal-200 mb-2" />
                <p className="text-teal-400">No more classes today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timetable Grid */}
      <Card className="bg-gradient-to-br from-white via-gray-50 to-blue-50 border-0 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Schedule
          </CardTitle>
          <CardDescription className="text-blue-500">Complete weekly class timetable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-blue-700 bg-blue-50">Time</th>
                  {days.map(day => (
                    <th key={day} className="text-left p-3 font-medium min-w-[120px] text-blue-700 bg-blue-50">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-b">
                    <td className="p-3 font-medium text-sm bg-blue-50 text-blue-800">
                      <Clock className="h-4 w-4 inline mr-2" />
                      {time}
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
                            <div className={`rounded-lg p-3 transition-colors border
                              ${isCurrentTime
                                ? 'border-blue-500 bg-gradient-to-r from-blue-100 via-indigo-50 to-white shadow-md'
                                : 'border-blue-100 bg-gradient-to-r from-white via-gray-50 to-blue-50 hover:bg-blue-50/60'
                              }`}>
                              <div className="font-medium text-blue-900 mb-1 flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {slot.subject}
                              </div>
                              <div className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                                <MapPin className="h-3 w-3" />
                                {slot.room}
                              </div>
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {slot.faculty}
                              </div>
                              {isCurrentTime && (
                                <div className="mt-2 text-xs font-medium text-blue-700 animate-pulse">
                                  ● Now
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="min-h-[70px] bg-gradient-to-r from-gray-50 via-white to-blue-50 rounded-lg border-2 border-dashed border-blue-100 flex items-center justify-center">
                              <span className="text-xs text-blue-300">Free</span>
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