import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Image, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'document') => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled = false }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file, type);
    }
    // Reset input
    event.target.value = '';
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const triggerDocumentUpload = () => {
    documentInputRef.current?.click();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={disabled}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={triggerImageUpload}>
            <Image className="h-4 w-4 mr-2" />
            Upload Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={triggerDocumentUpload}>
            <FileText className="h-4 w-4 mr-2" />
            Upload Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.docx,.xlsx"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'document')}
      />
    </>
  );
};

export default FileUpload;