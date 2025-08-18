import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, Users, Link2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { User } from '@/types';
import { getProfileImageSrc } from '@/lib/profileImage';

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    groups,
    fetchGroups,
    fetchConversations,
    searchUsers,
  } = useChat();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchGroups().catch(() => {});
    fetchConversations().catch(() => {});
  }, [fetchGroups, fetchConversations]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchUsers(search);
        setSearchResults(results);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [search, searchUsers]);

  const contacts = conversations
    .filter(c => c.type === 'direct')
    .map(c => ({
      id: Number(c.id),
      name: c.title,
      last: c.lastMessage || '',
      unread: c.unreadCount,
    }));

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const searchFilteredResults = searchResults.filter(
    u => u.id !== user?.id && !contacts.some(c => c.id === u.id),
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 px-4 sm:px-6 md:px-0">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chats</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/alumni')}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="space-y-1 px-3">
            {search && (
              <div className="mb-2">
                {searchLoading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  searchFilteredResults.map(result => (
                    <Button
                      key={result.id}
                      variant="ghost"
                      className="w-full justify-start h-12 px-3"
                      onClick={() => navigate(`/dashboard/chat/user/${result.id}`)}
                    >
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage src={getProfileImageSrc(result.profileImage) ?? '/placeholder.svg'} alt={result.name} />
                        <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{result.name}</p>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            )}
            {filteredGroups.map(group => (
              <Button
                key={group.id}
                variant="ghost"
                className="w-full justify-start h-12 px-3"
                onClick={() => navigate(`/dashboard/chat/group/${group.id}`)}
              >
                <Users className="h-4 w-4 mr-3" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{group.name}</p>
                </div>
              </Button>
            ))}
            {filteredContacts.length > 0 && (
              <div className="pt-2 mt-2 border-t space-y-1">
                {filteredContacts.map(contact => (
                  <Button
                    key={contact.id}
                    variant="ghost"
                    className="w-full justify-start h-12 px-3"
                    onClick={() => navigate(`/dashboard/chat/user/${contact.id}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-3" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.last}</p>
                    </div>
                    {contact.unread > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {contact.unread}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatList;

