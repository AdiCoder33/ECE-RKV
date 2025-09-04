import React, { useRef } from 'react';
import { ChatMessage, PrivateMessage } from '@/types';
import { Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: PrivateMessage | ChatMessage;
  isGroup?: boolean;
  currentUserId?: number;
  onHold?: (msg: PrivateMessage | ChatMessage) => void;
  selected?: boolean;
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
  const senderId =
    'sender_id' in message ? message.sender_id : message.senderId;

  // Base bubble styling. Limit width to 80% of the container to prevent overflow.
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const bubbleBaseClass =
    "whitespace-pre-wrap px-3 pt-2 pb-5 rounded-2xl shadow-sm max-w-[80%] min-w-[5rem] break-words break-all relative after:absolute after:-bottom-1 after:w-0 after:h-0";
  const orientationClass = hasAttachments || (isGroup && !isOwn)
    ? `flex flex-col ${isOwn ? 'items-end' : 'items-start'}`
    : 'inline-flex items-end';
  const bubbleClass = `${orientationClass} ${bubbleBaseClass}`;
  let bubbleColor = '';
  let nameTextColor = '';
  if (isOwn) {
    // Maroon/reddish for sender
    bubbleColor = 'bg-[#8B1F2F] text-white'; // WhatsApp's maroon theme
  } else {
    // Uniform bubble color for incoming messages
    bubbleColor = 'bg-white text-gray-900 border border-gray-200';
    if (isGroup) {
      const userColors = getUserBubbleColor(senderId);
      nameTextColor =
        userColors.split(' ').find((cls) => cls.startsWith('text-')) || '';
    }
  }

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

  // Tail class
  const tailClass = isOwn
    ? 'after:right-[-8px] after:border-l-[#8B1F2F] after:border-l-[8px] after:border-y-transparent after:border-y-[6px]'
    : 'after:left-[-8px] after:border-r-white after:border-r-[8px] after:border-y-transparent after:border-y-[6px]';

  // Alignment handled by flex container

  const isEdited = 'edited_at' in message && message.edited_at;

  return (
    // Outer wrapper intentionally has no horizontal padding so bubbles touch window edges
    <div
      className={`flex flex-col w-full mb-1 ${selected ? 'bg-green-100/40' : ''}`}
      onContextMenu={handleContext}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Message bubble */}
      <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`${bubbleClass} ${bubbleColor} ${tailClass} ${
            isOwn ? 'pr-12' : ''
          } ${selected ? 'ring-2 ring-green-400' : ''}`}
        >
          {isGroup && !isOwn && (
            <span
              className={`text-xs font-semibold ${nameTextColor} mb-1`}
            >
              {senderName}
            </span>
          )}
          {message.content && (
            <span className="flex-1">{message.content}</span>
          )}
          {message.attachments?.map((att, index) =>
            att.type === 'image' ? (
              <img
                key={index}
                src={att.url}
                alt={att.name}
                className="rounded-md max-w-[200px] mt-2"
              />
            ) : (
              <a
                key={index}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-sm mt-2 break-all"
              >
                {att.name}
              </a>
            )
          )}
          <span
            className={`absolute bottom-1 right-2 flex items-end text-[10px] ${
              isOwn ? 'text-gray-200' : 'text-gray-500'
            }`}
          >
            {timeStr}
            {isOwn && (
              message.status === 'read' ? (
                <CheckCheck className="w-3 h-3 ml-1 text-blue-500" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3 h-3 ml-1 text-gray-400" />
              ) : message.status === 'sent' ? (
                <Check className="w-3 h-3 ml-1 text-gray-400" />
              ) : null
            )}
          </span>
        </div>
      </div>
      {isEdited && (
        <div className={`w-full flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <div className="pl-2 pt-1 text-[11px] italic text-gray-400 text-left">
            edited
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;

