import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';
import { formatIST } from '@/utils/date';
import { getProfileImageSrc } from '@/lib/profileImage';

interface MessageItemProps {
  message: PrivateMessage | ChatMessage;
  isGroup: boolean;
  currentUserId?: number;
  onHold?: (m: PrivateMessage | ChatMessage) => void;
  selected?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isGroup, currentUserId, onHold, selected }) => {
  const isOwn = isGroup
    ? (message as ChatMessage).senderId === currentUserId
    : (message as PrivateMessage).sender_id === currentUserId;

  const senderName = isGroup
    ? (message as ChatMessage).senderName
    : (message as PrivateMessage).sender_name;

  const timestamp = isGroup
    ? (message as ChatMessage).timestamp
    : (message as PrivateMessage).created_at;

  const role = isGroup ? (message as ChatMessage).senderRole : null;
  const status = message.status || 'sent';
  const avatar = message.sender_profileImage;
  const avatarSrc = getProfileImageSrc(avatar);
  const initials = senderName
    ? senderName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
    : '?';

  const formatTime = (t: string) =>
    formatIST(t, { hour: '2-digit', minute: '2-digit', hour12: true });

  const timer = useRef<NodeJS.Timeout | null>(null);

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    onHold?.(message);
  };

  const handleTouchStart = () => {
    timer.current = setTimeout(() => onHold?.(message), 600);
  };

  const handleTouchEnd = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <div
      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {!isOwn && (avatarSrc || senderName) && (
        <div className="flex-shrink-0">
          <img
            src={avatarSrc ?? '/placeholder.svg'}
            alt={senderName || 'Avatar'}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
      <div className={`w-full pr-4 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
          {!isOwn && senderName && (
            <span className="text-sm font-medium">{senderName}</span>
          )}
          {isGroup && role && !isOwn && (
            <Badge variant="secondary" className="text-xs">
              {role.toUpperCase()}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
        </div>
        <div
          className={`inline-block max-w-[80%] break-words break-all p-3 rounded-lg ${
            isOwn ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
          } ${selected ? 'ring-2 ring-primary' : ''}`}
        >
          <p className="text-sm">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att, i) => (
                <AttachmentPreview
                  key={i}
                  preview={att.url}
                  filename={att.name}
                  type={att.type}
                  progress={att.progress}
                />
              ))}
            </div>
          )}
          {isOwn && (
            <div className="flex justify-end mt-1">
              {status === 'sending' && (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
              {status === 'sent' && <Check className="h-3 w-3" />}
              {status === 'delivered' && <CheckCheck className="h-3 w-3" />}
              {status === 'read' && (
                <CheckCheck className="h-3 w-3 text-primary" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

