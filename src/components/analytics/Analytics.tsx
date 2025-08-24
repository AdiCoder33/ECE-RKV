import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap,
  Award,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

// Theme colors (reuse from THEME or define here)
const THEME = {
  accent: '#8b0000',
  bgBeige: '#fbf4ea',
  cardBg: 'bg-white',
  cardShadow: 'shadow-lg',
  textMuted: 'text-gray-500',
};

const Analytics = () => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [loading, setLoading] = useState(false);

  // Mock data for analytics
  const performanceData = [
    { year: '1st Year', avgMarks: 78, attendance: 85, passRate: 92 },
    { year: '2nd Year', avgMarks: 82, attendance: 80, passRate: 88 },
    { year: '3rd Year', avgMarks: 85, attendance: 78, passRate: 85 },
    { year: '4th Year', avgMarks: 88, attendance: 75, passRate: 95 }
  ];

  const attendanceData = [
    { month: 'Jan', percentage: 88 },
    { month: 'Feb', percentage: 85 },
    { month: 'Mar', percentage: 82 },
    { month: 'Apr', percentage: 87 },
    { month: 'May', percentage: 84 },
    { month: 'Jun', percentage: 89 }
  ];

  const subjectPerformance = [
    { subject: 'DSP', avgMarks: 78, color: '#8B0000' },
    { subject: 'VLSI', avgMarks: 82, color: '#001F54' },
    { subject: 'Microprocessors', avgMarks: 75, color: '#8B5E3C' },
    { subject: 'Control Systems', avgMarks: 80, color: '#4A5568' },
    { subject: 'Communication', avgMarks: 85, color: '#2D7D32' }
  ];

  const placementData = [
    { company: 'TCS', placed: 45 },
    { company: 'Infosys', placed: 38 },
    { company: 'Wipro', placed: 32 },
    { company: 'Tech Mahindra', placed: 28 },
    { company: 'Others', placed: 67 }
  ];

  const kpiData = [
    {
      title: 'Overall Pass Rate',
      value: '89.5%',
      change: '+2.3%',
      trend: 'up',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Average Attendance',
      value: '83.2%',
      change: '-1.2%',
      trend: 'down',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Placement Rate',
      value: '78.5%',
      change: '+5.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Faculty Ratio',
      value: '1:15',
      change: 'Optimal',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  // Loader (simple spinner)
  const Loader = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] py-12">
      <svg className="animate-spin h-10 w-10 text-[#8b0000]" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#8b0000" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="#8b0000" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <span className="mt-4 text-[#8b0000] font-semibold">Loading Analytics...</span>
    </div>
  );

  return (
    <div
      className="space-y-6 px-2 sm:px-4 md:px-8 py-4 min-h-screen"
      style={{ background: THEME.bgBeige }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#8b0000]">Analytics Dashboard</h1>
          <p className="text-base text-[#b86b2e]">ECE Department Performance Analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-[#8b0000] text-[#8b0000] hover:bg-[#fde8e6]">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="rounded-lg shadow bg-[#fff6e6] border border-[#fde8e6] w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#8b0000]">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#8b0000]">{kpi.value}</div>
              <p className="text-xs flex items-center">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change}
                </span>
                {' '}<span className="text-[#b86b2e]">from last semester</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loader */}
      {loading ? (
        <Loader />
      ) : (
        <Tabs defaultValue="academic" className="space-y-4">
          {/* Scrollable TabsList on mobile */}
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-[#b86b2e]/60 scrollbar-track-[#fde8e6]/40">
            <TabsList className="flex w-max min-w-full bg-[#fde8e6] rounded-lg shadow mb-2">
              <TabsTrigger value="academic" className="text-[#8b0000] data-[state=active]:bg-[#fff6e6] data-[state=active]:text-[#8b0000]">
                Academic Performance
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-[#8b0000] data-[state=active]:bg-[#fff6e6] data-[state=active]:text-[#8b0000]">
                Attendance Analysis
              </TabsTrigger>
              <TabsTrigger value="placement" className="text-[#8b0000] data-[state=active]:bg-[#fff6e6] data-[state=active]:text-[#8b0000]">
                Placement Statistics
              </TabsTrigger>
              <TabsTrigger value="faculty" className="text-[#8b0000] data-[state=active]:bg-[#fff6e6] data-[state=active]:text-[#8b0000]">
                Faculty Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="academic" className="space-y-4">
            {/* Two cards side by side on md+, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Year-wise Academic Performance</CardTitle>
                  <CardDescription className="text-[#b86b2e]">Average marks and pass rates by year</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fde8e6" />
                      <XAxis dataKey="year" stroke="#b86b2e" />
                      <YAxis stroke="#b86b2e" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff6e6',
                          border: '1px solid #fde8e6',
                          borderRadius: '6px',
                          color: '#8b0000'
                        }}
                      />
                      <Bar dataKey="avgMarks" fill="#8B0000" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Subject-wise Performance</CardTitle>
                  <CardDescription className="text-[#b86b2e]">Average marks across subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subjectPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="avgMarks"
                      >
                        {subjectPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff6e6',
                          border: '1px solid #fde8e6',
                          borderRadius: '6px',
                          color: '#8b0000'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {subjectPerformance.map((subject, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="text-sm text-[#8b0000]">{subject.subject}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
              <CardHeader>
                <CardTitle className="text-[#8b0000]">Monthly Attendance Trends</CardTitle>
                <CardDescription className="text-[#b86b2e]">Department-wide attendance percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fde8e6" />
                    <XAxis dataKey="month" stroke="#b86b2e" />
                    <YAxis stroke="#b86b2e" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff6e6',
                        border: '1px solid #fde8e6',
                        borderRadius: '6px',
                        color: '#8b0000'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#001F54" 
                      fill="#8B0000" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placement" className="space-y-4">
            <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
              <CardHeader>
                <CardTitle className="text-[#8b0000]">Placement Statistics</CardTitle>
                <CardDescription className="text-[#b86b2e]">Company-wise placement data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={placementData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#fde8e6" />
                    <XAxis type="number" stroke="#b86b2e" />
                    <YAxis dataKey="company" type="category" stroke="#b86b2e" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff6e6',
                        border: '1px solid #fde8e6',
                        borderRadius: '6px',
                        color: '#8b0000'
                      }}
                    />
                    <Bar dataKey="placed" fill="#8B5E3C" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Faculty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">Professors</span>
                      <span className="font-bold text-[#8b0000]">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">Associate Professors</span>
                      <span className="font-bold text-[#8b0000]">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">Assistant Professors</span>
                      <span className="font-bold text-[#8b0000]">15</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-[#b86b2e]">Total Faculty</span>
                      <span className="font-bold text-[#8b0000]">35</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Research Publications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">International Journals</span>
                      <span className="font-bold text-[#8b0000]">45</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">National Journals</span>
                      <span className="font-bold text-[#8b0000]">32</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">Conference Papers</span>
                      <span className="font-bold text-[#8b0000]">68</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-[#b86b2e]">Total Publications</span>
                      <span className="font-bold text-[#8b0000]">145</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg shadow bg-white border border-[#fde8e6] w-full">
                <CardHeader>
                  <CardTitle className="text-[#8b0000]">Faculty Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">PhD Holders</span>
                      <span className="font-bold text-[#8b0000]">28</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">M.Tech</span>
                      <span className="font-bold text-[#8b0000]">7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b86b2e]">Industry Experience</span>
                      <span className="font-bold text-[#8b0000]">18</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-[#b86b2e]">Qualified Faculty</span>
                      <span className="font-bold text-[#8b0000]">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Analytics;
