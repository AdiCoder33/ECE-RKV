
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

const Analytics = () => {
  const [selectedYear, setSelectedYear] = useState('2024');

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

  return (
    <div className="space-y-6 px-4 sm:px-6 md:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">ECE Department Performance Analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change}
                </span>
                {' '}from last semester
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="academic">Academic Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Analysis</TabsTrigger>
          <TabsTrigger value="placement">Placement Statistics</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Year-wise Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Year-wise Academic Performance</CardTitle>
                <CardDescription>Average marks and pass rates by year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="avgMarks" fill="#8B0000" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
                <CardDescription>Average marks across subjects</CardDescription>
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
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
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
                      <span className="text-sm">{subject.subject}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Attendance Trends</CardTitle>
              <CardDescription>Department-wide attendance percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#001F54" 
                    fill="#001F54" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Placement Statistics</CardTitle>
              <CardDescription>Company-wise placement data</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={placementData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="company" type="category" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="placed" fill="#8B5E3C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faculty" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Faculty Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Professors</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Associate Professors</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assistant Professors</span>
                    <span className="font-bold">15</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Faculty</span>
                    <span className="font-bold">35</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Research Publications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>International Journals</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span>National Journals</span>
                    <span className="font-bold">32</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conference Papers</span>
                    <span className="font-bold">68</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Publications</span>
                    <span className="font-bold">145</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Faculty Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>PhD Holders</span>
                    <span className="font-bold">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span>M.Tech</span>
                    <span className="font-bold">7</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Industry Experience</span>
                    <span className="font-bold">18</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Qualified Faculty</span>
                    <span className="font-bold">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
