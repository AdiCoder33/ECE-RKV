
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Users, AlertTriangle } from 'lucide-react';

interface PromoteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromote: () => Promise<void>;
}

const PromoteStudentsModal = ({ isOpen, onClose, onPromote }: PromoteStudentsModalProps) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionData, setPromotionData] = useState<
    { fromYear: number; toYear?: number; status?: string; students: number; sections: number }[]
  >([]);

  const apiBase = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchPromotionSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/classes/promotion-summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data: { year: number; students: number; sections: number }[] = await response.json();
        const mapped = data.map(item =>
          item.year === 4
            ? { fromYear: item.year, status: 'Graduate', students: item.students, sections: item.sections }
            : { fromYear: item.year, toYear: item.year + 1, students: item.students, sections: item.sections }
        );
        setPromotionData(mapped);
      } catch {
        // Ignore errors for now
      }
    };

    if (isOpen) {
      fetchPromotionSummary();
    }
  }, [isOpen, apiBase]);

  const handlePromote = async () => {
    setIsPromoting(true);
    await onPromote();
    setIsPromoting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Promote Students to Next Academic Year
          </DialogTitle>
          <DialogDescription>
            This will promote all students to the next year and graduate final year students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Promotion Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-blue-900 mb-2">Promotion Summary</h3>
            <div className="space-y-2">
              {promotionData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      {data.fromYear}
                      {data.fromYear === 1 ? 'st' : data.fromYear === 2 ? 'nd' : data.fromYear === 3 ? 'rd' : 'th'} Year
                      ({data.sections} sections)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{data.students} students</span>
                    <span className="text-sm">→</span>
                    {data.status === 'Graduate' ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Graduate
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {data.toYear}
                        {data.toYear === 1 ? 'st' : data.toYear === 2 ? 'nd' : data.toYear === 3 ? 'rd' : 'th'} Year
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Important Notice</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  This action cannot be undone. Students will be moved to their respective next year classes. 
                  Final year students will be marked as graduated and moved to alumni records.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar (shown during promotion) */}
          {isPromoting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Promoting students...</span>
                <span>Processing</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPromoting}>
            Cancel
          </Button>
          <Button 
            onClick={handlePromote} 
            disabled={isPromoting}
            className="bg-primary hover:bg-primary/90"
          >
            {isPromoting ? 'Promoting...' : 'Promote All Students'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteStudentsModal;
