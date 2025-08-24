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
import { Info, ShieldCheck, AlertTriangle } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || '/api';

const ComplaintForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Complaint['type'] | ''>('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [charCount, setCharCount] = useState(0);
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
      setCharCount(0);
    } catch (err) {
      console.error('Submit complaint error', err);
      toast({ description: 'Failed to submit complaint', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: THEME.bgBeige }}>
      <Card className="w-full max-w-xl shadow-lg" style={{ backgroundColor: THEME.cardBg }}>
        <CardHeader>
          <CardTitle style={{ color: THEME.accent }} className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#b91c1c]" />
            Complaint Box
          </CardTitle>
          <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm" style={{ color: THEME.textSecondary }}>
            <Info className="h-4 w-4 text-[#b86b2e]" />
            Your complaint will be reviewed confidentially.
          </div>
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
                maxLength={80}
                className="mt-1 border border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c] bg-[#fff8f3]"
                style={{ color: THEME.textPrimary }}
                placeholder="Short summary of your complaint"
              />
            </div>
            <div>
              <Label htmlFor="type" style={{ color: THEME.textSecondary }}>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type" className="mt-1 border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c] bg-[#fff8f3]" style={{ color: THEME.textPrimary }}>
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
                onChange={(e) => {
                  setDescription(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                required
                rows={5}
                maxLength={1000}
                className="mt-1 border border-gray-300 focus:border-[#b91c1c] focus:ring-1 focus:ring-[#b91c1c] bg-[#fff8f3]"
                style={{ color: THEME.textPrimary }}
                placeholder="Describe your issue in detail..."
              />
              <div className="flex justify-between mt-1 text-xs">
                <span style={{ color: THEME.textSilver }}>
                  {charCount}/1000 characters
                </span>
                {charCount > 900 && (
                  <span className="text-[#b91c1c] font-semibold">Approaching limit</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
                className="accent-[#b91c1c]"
              />
              <Label htmlFor="anonymous" style={{ color: THEME.textSecondary }}>Submit anonymously</Label>
            </div>
            <Button
              type="submit"
              style={{ backgroundColor: THEME.accent, color: '#fff' }}
              className="hover:brightness-110 font-semibold w-full sm:w-auto"
            >
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintForm;

