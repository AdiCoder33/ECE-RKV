import React from 'react';
import { X } from 'lucide-react';

interface AttachmentPreviewProps {
  preview?: string;
  filename: string;
  type: 'image' | 'file';
  progress?: number;
  onRemove?: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  preview,
  filename,
  type,
  progress,
  onRemove
}) => {
  const isImage = type === 'image';

  return (
    <div className="relative">
      {isImage ? (
        preview && (
          <img src={preview} alt={filename} className="max-w-xs rounded" />
        )
      ) : (
        <div className="flex items-center justify-between bg-background rounded px-2 py-1 text-xs">
          {preview ? (
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {filename}
            </a>
          ) : (
            <span>{filename}</span>
          )}
        </div>
      )}
      {progress !== undefined && progress < 100 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
          {progress}%
        </div>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 bg-black text-white rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default AttachmentPreview;

