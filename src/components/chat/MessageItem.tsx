import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCheck } from 'lucide-react';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';

interface MessageItemProps {
  message: PrivateMessage | ChatMessage;
  isGroup: boolean;
  currentUserId?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isGroup, currentUserId }) => {
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
  const status = (message as any).status || 'sent';
  const avatar = (message as any).sender_profileImage;
  const initials = senderName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);

  const formatTime = (t: string) => {
    const date = new Date(t);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {initials}
              </span>
            </div>
          )}
        </div>
      )}
      <div className={`w-full pr-4 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
          {!isOwn && <span className="text-sm font-medium">{senderName}</span>}
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
          }`}
        >
          <p className="text-sm">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att, i) => (
                <AttachmentPreview key={i} attachment={att} />
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

