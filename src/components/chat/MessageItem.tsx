import React, { useRef } from 'react';
import { ChatMessage, PrivateMessage } from '@/types';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';

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
    'sender_role' in message ? message.sender_role : message.senderRole;
  const profileImage =
    'sender_profile_image' in message
      ? message.sender_profile_image
      : message.senderProfileImage;
  const senderId =
    'sender_id' in message ? message.sender_id : message.senderId;

  const profileSrc = useProfileImageSrc(profileImage);

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

  // Avatar fallback
  const avatar = profileSrc ? (
    <img
      src={profileSrc}
      alt={senderName}
      className="w-9 h-9 rounded-full object-cover border border-gray-200"
    />
  ) : (
    <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold text-base select-none">
      {senderName?.[0]?.toUpperCase() || '?'}
    </div>
  );

  // Timestamp
  const time =
    'created_at' in message
      ? new Date(message.created_at)
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

  return (
    <div
      className={`flex flex-col ${align} mb-2 px-2 ${selected ? 'bg-green-100/40' : ''}`}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Avatar and name/role */}
      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {avatar}
        <div className={`flex items-center gap-1`}>
          <span className="text-xs font-semibold text-gray-700">{senderName}</span>
          {senderRole && (
            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
              {getShortRole(senderRole)}
            </span>
          )}
        </div>
      </div>
      {/* Message bubble */}
      <div className={`relative ${margin}`}>
        <div
          className={`${bubbleClass} ${bubbleColor} ${selected ? 'ring-2 ring-green-400' : ''}`}
        >
          {message.content}
        </div>
        <span
          className={`absolute -bottom-5 right-2 text-[10px] ${
            isOwn ? 'text-gray-200' : 'text-gray-500'
          }`}
        >
          {timeStr}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;

