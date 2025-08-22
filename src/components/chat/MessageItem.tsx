import React, { useRef } from 'react';
import { ChatMessage, PrivateMessage } from '@/types';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';
import { Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: PrivateMessage | ChatMessage;
  isGroup?: boolean;
  currentUserId?: number;
  onHold?: (msg: PrivateMessage | ChatMessage) => void;
  selected?: boolean;
}

// Short role mapping
function getShortRole(role?: string) {
  if (!role) return '';
  const map: Record<string, string> = {
    student: 'Stu',
    professor: 'Prof',
    teacher: 'Tch',
    admin: 'Admin',
    alumni: 'Alum',
  };
  return map[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1, 3);
}

// Deterministic color for group bubbles based on user id or name
function getUserBubbleColor(userId: number | string | undefined) {
  // WhatsApp-like pastel palette
  const palette = [
    'bg-blue-100 text-blue-900',
    'bg-green-100 text-green-900',
    'bg-purple-100 text-purple-900',
    'bg-yellow-100 text-yellow-900',
    'bg-pink-100 text-pink-900',
    'bg-orange-100 text-orange-900',
    'bg-teal-100 text-teal-900',
    'bg-indigo-100 text-indigo-900',
  ];
  if (!userId) return palette[0];
  let hash = 0;
  const str = String(userId);
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isGroup,
  currentUserId,
  onHold,
  selected,
}) => {
  // Sender check
  const isOwn =
    'sender_id' in message
      ? message.sender_id === currentUserId
      : message.senderId === currentUserId;

  // Sender info
  const senderName =
    'sender_name' in message ? message.sender_name : message.senderName;
  const senderRole =
    'sender_role' in message ? message.sender_role : ('senderRole' in message ? message.senderRole : undefined);
  const profileImage =
    'sender_profile_image' in message
      ? message.sender_profile_image
      : ('senderProfileImage' in message ? message.senderProfileImage : undefined);
  const senderId =
    'sender_id' in message ? message.sender_id : message.senderId;

  const profileSrc = useProfileImageSrc(profileImage as string | undefined);

  // Bubble color logic
  let bubbleClass =
    'inline-block whitespace-pre-wrap px-4 py-2 rounded-xl shadow-sm max-w-[80vw] min-w-[3rem] break-words transition-colors';
  let bubbleColor = '';
  if (isOwn) {
    // Maroon/reddish for sender
    bubbleColor = 'bg-[#8B1F2F] text-white'; // WhatsApp's maroon theme
  } else if (isGroup) {
    // Group: assign color per user
    bubbleColor = getUserBubbleColor(senderId);
  } else {
    // Personal chat: light gray
    bubbleColor = 'bg-white text-gray-900 border border-gray-200';
  }

  // Avatar fallback - smaller size
  const avatar = profileSrc ? (
    <img
      src={profileSrc}
      alt={senderName}
      className="w-7 h-7 rounded-full object-cover border border-gray-200"
    />
  ) : (
    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-sm select-none">
      {senderName?.[0]?.toUpperCase() || '?'}
    </div>
  );

  // Timestamp
  const time =
    'created_at' in message
      ? new Date(message.created_at as string)
      : new Date(message.timestamp);
  const timeStr = time
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    .replace(/^0/, '');

  // Touch/hold logic
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

  // Alignment
  const align = isOwn ? 'items-end justify-end' : 'items-start justify-start';
  const margin = isOwn ? 'ml-auto' : 'mr-auto';

  const isEdited =
    'updated_at' in message &&
    message.updated_at &&
    ('created_at' in message 
      ? message.updated_at !== message.created_at
      : message.updated_at !== message.timestamp);

  // Message status
  const messageStatus = 'status' in message ? message.status : 'sent';

  // Status tick component - white double ticks for delivered, brown for read
  const StatusIndicator = () => {
    if (!isOwn) return null;
    
    switch (messageStatus) {
      case 'sent':
        return <Check className="h-3 w-3 text-white/80" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-white/80" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-3 ${selected ? 'bg-green-100/40' : ''}`}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar only for group chats on left side */}
      {isGroup && !isOwn && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          {avatar}
        </div>
      )}
      
      {/* Message bubble with name and time inside */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Sender name for group chats - smaller size */}
        {isGroup && !isOwn && (
          <span className="text-[11px] font-medium text-gray-600 mb-1 pl-1">
            {senderName}
          </span>
        )}
        
        <div
          className={`${bubbleClass} ${bubbleColor} ${selected ? 'ring-2 ring-green-400' : ''} text-left pr-4`}
        >
          {message.content}
          
          {/* Time and status at bottom right */}
          <div className="flex items-center justify-end gap-1 mt-1">
            {isEdited && (
              <span className="text-[10px] italic text-gray-400 mr-1">
                edited
              </span>
            )}
            <span className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
              {timeStr}
            </span>
            <StatusIndicator />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

