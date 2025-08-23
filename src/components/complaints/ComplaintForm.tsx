import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { THEME } from '@/theme';
import type { Complaint } from '@/types';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ComplaintForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Complaint['type'] | ''>('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBase}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title,
          type: type as Complaint['type'],
          description,
          isAnonymous,
        })
      });
      if (!response.ok) throw new Error('Failed to submit complaint');
      toast({ description: 'Complaint submitted successfully' });
      setTitle('');
      setType('');
      setDescription('');
      setIsAnonymous(false);
    } catch (err) {
      console.error('Submit complaint error', err);
      toast({ description: 'Failed to submit complaint', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: THEME.bgBeige }}>
      <Card className="w-full max-w-xl shadow-lg" style={{ backgroundColor: THEME.cardBg }}>
        <CardHeader>
          <CardTitle style={{ color: THEME.accent }}>Complaint Box</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" style={{ color: THEME.textSecondary }}>Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 border border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c]"
              />
            </div>
            <div>
              <Label htmlFor="type" style={{ color: THEME.textSecondary }}>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="mt-1 border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facilities">Facilities</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description" style={{ color: THEME.textSecondary }}>Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1 border border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
              />
              <Label htmlFor="anonymous" style={{ color: THEME.textSecondary }}>Submit anonymously</Label>
            </div>
            <Button type="submit" style={{ backgroundColor: THEME.accent }} className="hover:brightness-110">Submit</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintForm;

