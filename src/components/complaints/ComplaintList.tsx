import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const apiBase = import.meta.env.VITE_API_URL || '/api';

interface Complaint {
  id: number;
  type: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  student_name: string;
}

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
        const data: Complaint[] = await response.json();
        setComplaints(data);
      } catch (err) {
        console.error('Fetch complaints error', err);
      }
    };

    if (user && ['admin', 'hod'].includes(user.role)) {
      fetchComplaints();
    }
  }, [user]);

  if (!user || !['admin', 'hod'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleReveal = (id: number) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getSnippet = (text: string) =>
    text.length > 30 ? `${text.slice(0, 30)}...` : text;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Complaints</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reporter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.type}</TableCell>
                <TableCell>{getSnippet(c.content)}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {c.is_anonymous ? (
                    revealed[c.id] ? (
                      <>
                        {c.student_name}{' '}
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
                    c.student_name
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

