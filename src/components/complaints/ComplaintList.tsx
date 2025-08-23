import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { THEME } from '@/theme';
import type { Complaint } from '@/types';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ComplaintList: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/complaints`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const data = await response.json();
        const complaintsData: Complaint[] = data.map((c: Record<string, unknown>) => ({
          id: c.id as number,
          studentId: c.student_id as number,
          studentName: c.student_name as string,
          type: c.type as Complaint['type'],
          title: c.title as string,
          description: c.description as string,
          isAnonymous: c.is_anonymous as boolean,
          createdAt: c.created_at as string,
        }));
        setComplaints(complaintsData);
      } catch (err) {
        console.error('Fetch complaints error', err);
      }
    };

    if (user && ['admin', 'hod'].includes(user.role)) {
      fetchComplaints();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!['admin', 'hod'].includes(user.role)) {
    const dashboardRoutes: Record<string, string> = {
      admin: '/dashboard',
      hod: '/dashboard',
      professor: '/dashboard/professor',
      student: '/dashboard/student',
      alumni: '/dashboard/alumni',
    };
    return (
      <Navigate
        to={dashboardRoutes[user.role] ?? '/dashboard'}
        replace
      />
    );
  }

  const toggleReveal = (id: number) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSnippet = (text: string) =>
    text.length > 30 ? `${text.slice(0, 30)}...` : text;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader style={{ color: THEME.accent }}>
        <CardTitle style={{ color: THEME.accent }}>Complaints</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reporter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.title}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{getSnippet(c.description)}</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {c.isAnonymous ? (
                    revealed[c.id] ? (
                      <>
                        {c.studentName}{' '}
                        <Button variant="link" size="sm" onClick={() => toggleReveal(c.id)}>
                          Hide
                        </Button>
                      </>
                    ) : (
                      <>
                        Anonymous{' '}
                        <Button variant="link" size="sm" onClick={() => toggleReveal(c.id)}>
                          Reveal
                        </Button>
                      </>
                    )
                  ) : (
                    c.studentName
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ComplaintList;

