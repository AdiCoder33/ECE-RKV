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

interface Conversation {
  id: string;
  title: string;
  avatar?: string | null;
  last_message?: string;
  last_activity?: string | null;
  unread_count?: number;
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
  const formatTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onOpenGroupDialog}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as any)}>
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="direct">DMs</TabsTrigger>
            <TabsTrigger value="group">Groups</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 h-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <ScrollArea className="flex-1">
        {search && (
          <div>
            {searchLoading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              searchResults.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => onStartChat(u)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.profileImage} alt={u.name} />
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {conversations.map(c => (
          <div
            key={`${c.type}-${c.id}`}
            className="flex items-center gap-2 px-4 py-2 hover:bg-muted cursor-pointer"
            onClick={() => onSelectConversation(c)}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                {c.title.charAt(0)}
              </div>
              {c.type === 'direct' && onlineUsers.has(Number(c.id)) && (
                <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{c.title}</p>
              <p className="text-xs text-muted-foreground truncate">{c.last_message || ''}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {formatTime(c.last_activity || null)}
              </span>
              {c.unread_count && c.unread_count > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {c.unread_count}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => onPin(e, c)}>
              <Pin className={`h-4 w-4 ${c.pinned ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        ))}
      </ScrollArea>
    </>
  );
};

export default ConversationList;

