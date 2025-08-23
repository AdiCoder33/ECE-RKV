import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, UserPlus, X, Pin, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';
import { formatIST } from '@/utils/date';
import { useProfileImageSrc } from '@/hooks/useProfileImageSrc';

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
  tab: 'all' | 'direct' | 'group';
  onTabChange: (tab: 'all' | 'direct' | 'group') => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchResults: User[];
  searchLoading: boolean;
  conversations: Conversation[];
  onSelectConversation: (c: Conversation) => void;
  onPin: (e: React.MouseEvent, c: Conversation) => void;
  onlineUsers: Set<number>;
  onStartChat: (user: User) => void;
  onOpenGroupDialog: () => void;
  onClose: () => void;
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
}> = ({ conversation, onSelect, onPin, onlineUsers }) => {
  const src = useProfileImageSrc(conversation.avatar || undefined);
  return (
    <div
      key={`${conversation.type}-${conversation.id}`}
      className="flex items-center gap-2 px-4 py-2 hover:bg-[#f5e6e9] cursor-pointer transition shadow-sm mb-1 rounded-xl"
      onClick={() => onSelect(conversation)}
      style={{
        borderLeft: conversation.unreadCount && conversation.unreadCount > 0 ? '4px solid #8B1F2F' : '4px solid transparent',
        background: conversation.pinned ? 'linear-gradient(90deg, #fbeee6 0%, #f5e6e9 100%)' : undefined,
      }}
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
      <div className="flex-1 overflow-hidden text-left"> {/* <-- left align */}
        <p className="text-sm font-semibold truncate text-[#8B1F2F]">{conversation.title}</p>
        <p className="text-xs text-gray-500 truncate">
          {truncateMessage(conversation.lastMessage || '')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-gray-400">
          {formatTime(conversation.lastActivity || null)}
        </span>
        {conversation.unreadCount && conversation.unreadCount > 0 && (
          <Badge variant="destructive" className="text-xs bg-[#8B1F2F] text-white">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(e, conversation); }}>
        <Pin className={`h-4 w-4 ${conversation.pinned ? 'text-[#8B1F2F]' : 'text-gray-300'}`} />
      </Button>
    </div>
  );
};

const ConversationList: React.FC<ConversationListProps> = ({
  tab,
  onTabChange,
  search,
  onSearchChange,
  searchResults,
  searchLoading,
  conversations,
  onSelectConversation,
  onPin,
  onlineUsers,
  onStartChat,
  onOpenGroupDialog,
  onClose,
}) => {
  return (
    <div className="h-full flex flex-col bg-[#fbeee6] border-r border-gray-200 rounded-l-2xl">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-[#8B1F2F] via-[#a83246] to-[#8B1F2F] rounded-tl-2xl shadow-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow">
            <MessageSquare className="h-5 w-5" />
            Chat
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onOpenGroupDialog} className="hover:bg-[#f5e6e9]">
              <UserPlus className="h-4 w-4 text-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden hover:bg-[#f5e6e9]">
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
        <Tabs
          value={tab}
          onValueChange={(
            v: 'all' | 'direct' | 'group',
          ) => onTabChange(v)}
        >
          <TabsList className="grid grid-cols-3 mb-2 bg-[#fbeee6] rounded-lg mt-2 shadow">
            <TabsTrigger value="all" className="text-[#8B1F2F] font-semibold data-[state=active]:bg-[#8B1F2F] data-[state=active]:text-white transition">All</TabsTrigger>
            <TabsTrigger value="direct" className="text-[#8B1F2F] font-semibold data-[state=active]:bg-[#8B1F2F] data-[state=active]:text-white transition">DMs</TabsTrigger>
            <TabsTrigger value="group" className="text-[#8B1F2F] font-semibold data-[state=active]:bg-[#8B1F2F] data-[state=active]:text-white transition">Groups</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B1F2F]" />
          <Input
            placeholder="Search..."
            className="pl-10 h-9 bg-[#fbeee6] border-none focus:ring-2 focus:ring-[#8B1F2F] rounded-lg text-[#8B1F2F] font-medium"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardHeader>
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
          />
        ))}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;

