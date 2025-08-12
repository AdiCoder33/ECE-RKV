import React from 'react';
import { X } from 'lucide-react';

type ComposerAttachment = { file: File; preview: string };

type MessageAttachment = {
  type: 'image' | 'file';
  url?: string;
  name: string;
  progress?: number;
};

interface AttachmentPreviewProps {
  attachment: ComposerAttachment | MessageAttachment;
  onRemove?: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onRemove }) => {
  if ('file' in attachment) {
    const isImage = attachment.file.type.startsWith('image/');
    return (
      <div className="relative">
        {isImage ? (
          <img
            src={attachment.preview}
            alt={attachment.file.name}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="flex items-center bg-muted rounded px-2 py-1 text-xs">
            {attachment.file.name}
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
  }

  const isImage = attachment.type === 'image';
  return (
    <div className="relative">
      {isImage ? (
        attachment.url && (
          <img src={attachment.url} alt={attachment.name} className="max-w-xs rounded" />
        )
      ) : (
        <div className="flex items-center justify-between bg-background rounded px-2 py-1 text-xs">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {attachment.name}
          </a>
        </div>
      )}
      {attachment.progress !== undefined && attachment.progress < 100 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
          {attachment.progress}%
        </div>
      )}
    </div>
  );
};

export default AttachmentPreview;

