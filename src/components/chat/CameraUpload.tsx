import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CameraUploadProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

const CameraUpload: React.FC<CameraUploadProps> = ({ onCapture, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    e.target.value = '';
  };

  const triggerCapture = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Button variant="ghost" size="icon" disabled={disabled} onClick={triggerCapture}>
        <Camera className="h-4 w-4" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </>
  );
};

export default CameraUpload;
