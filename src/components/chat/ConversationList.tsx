import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Search, MoreVertical, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import { formatIST } from '@/utils/date';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  avatar?: string | null;
  lastMessage?: string;
  lastActivity?: string | null;
  unreadCount?: number;
  type: 'direct' | 'group';
  pinned?: boolean;
}

interface ConversationListProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchResults: User[];
  searchLoading: boolean;
  conversations: Conversation[];
  onSelectConversation: (c: Conversation) => void;
  onPin: (e: React.MouseEvent, c: Conversation) => void;
  onlineUsers: Set<number>;
  onStartChat: (user: User) => void;
  onNewChat: () => void;
  activeId?: string;
}
const formatTime = (timestamp: string | null | undefined) =>
  timestamp
    ? formatIST(timestamp, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

const SearchResultItem: React.FC<{ user: User; onClick: () => void }> = ({ user, onClick }) => {
  const src = useProfileImageSrc(user.profileImage);
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 hover:bg-[#f5e6e9] cursor-pointer transition"
      onClick={onClick}
      style={{ borderRadius: 12 }}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={src ?? '/placeholder.svg'} alt={user.name} />
        <AvatarFallback className="bg-[#8B1F2F] text-white font-medium">
          {user.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium truncate">{user.name}</p>
      </div>
    </div>
  );
};

// Utility to truncate message
function truncateMessage(msg: string, max = 32) {
  if (!msg) return '';
  return msg.length > max ? msg.slice(0, max - 1) + '…' : msg;
}

const ConversationRow: React.FC<{
  conversation: Conversation;
  onSelect: (c: Conversation) => void;
  onPin: (e: React.MouseEvent, c: Conversation) => void;
  onlineUsers: Set<number>;
  active?: boolean;
}> = ({ conversation, onSelect, onPin: _onPin, onlineUsers, active }) => {
  const src = useProfileImageSrc(conversation.avatar || undefined);
  return (
    <div
      key={`${conversation.type}-${conversation.id}`}
      className={cn(
        'flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer',
        active && 'bg-gray-200'
      )}
      onClick={() => onSelect(conversation)}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={src ?? '/placeholder.svg'} />
          <AvatarFallback className="bg-[#8B1F2F] text-white font-medium">
            {conversation.title.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {conversation.type === 'direct' && onlineUsers.has(Number(conversation.id)) && (
          <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 overflow-hidden text-left">
        <p className="text-sm font-semibold truncate text-[#8B1F2F]">{conversation.title}</p>
        <p className="text-xs text-gray-500 truncate">
          {truncateMessage(conversation.lastMessage || '')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 ml-auto">
        <span className="text-xs text-gray-400">
          {formatTime(conversation.lastActivity || null)}
        </span>
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <Badge variant="destructive" className="text-[10px] bg-[#8B1F2F] text-white">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
};

const ConversationList: React.FC<ConversationListProps> = ({
  search,
  onSearchChange,
  searchResults,
  searchLoading,
  conversations,
  onSelectConversation,
  onPin,
  onlineUsers,
  onStartChat,
  onNewChat,
  activeId,
}) => {
  const [showSearch, setShowSearch] = React.useState(false);

  const toggleSearch = () => {
    setShowSearch(prev => {
      if (prev) onSearchChange('');
      return !prev;
    });
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 rounded-l-2xl">
      <div className="flex items-center justify-between h-14 px-3 bg-[#8B1F2F]">
        <div className="text-lg flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5" />
          Chat
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleSearch}>
            <Search className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNewChat}>
            <MessageSquare className="h-4 w-4 text-white" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
      {showSearch && (
        <div className="relative px-3 py-2 bg-[#8B1F2F]">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B1F2F]" />
          <Input
            placeholder="Search..."
            className="pl-10 h-9 bg-[#fbeee6] border-none focus:ring-2 focus:ring-[#8B1F2F] rounded-lg text-[#8B1F2F] font-medium"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}
      <ScrollArea className="flex-1 py-2 pr-1">
        {search && (
          <div>
            {searchLoading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#8B1F2F]" />
              </div>
            ) : (
              searchResults.map(u => (
                <SearchResultItem
                  key={u.id}
                  user={u}
                  onClick={() => onStartChat(u)}
                />
              ))
            )}
          </div>
        )}
        {conversations.map(c => (
          <ConversationRow
            key={`${c.type}-${c.id}`}
            conversation={c}
            onSelect={onSelectConversation}
            onPin={onPin}
            onlineUsers={onlineUsers}
            active={activeId === `${c.type}-${c.id}`}
          />
        ))}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;

