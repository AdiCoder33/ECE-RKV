import React, { useMemo, useState, useContext, useRef, useEffect } from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Virtuoso } from 'react-virtuoso';
import { ArrowLeft, Loader2, Send, Pencil, Trash2 } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import MessageItem from './MessageItem';
import AttachmentPreview from './AttachmentPreview';
import { ChatMessage, PrivateMessage } from '@/types';
import { formatIST } from '@/utils/date';
import ChatContext from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProfileImageSrc } from '@/lib/profileImage';

type Message = ChatMessage | PrivateMessage;

interface ChatWindowProps {
  activeChat: { type: 'direct' | 'group'; id: string; title: string };
  messages: (PrivateMessage | ChatMessage)[];
  currentUserId?: number;
  typingUsers: Set<number>;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  message: string;
  setMessage: (msg: string) => void;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => Promise<void>;
  attachments: { file: File; preview: string }[];
  onFileSelect: (file: File, type?: 'image' | 'document') => void;
  onRemoveAttachment: (idx: number) => void;
  onEmojiSelect: (emoji: string) => void;
  onBack: () => void;
  onClose: () => void;
  onOpenGroupDialog: () => void;
}

type GroupedItem =
  | { type: 'date'; date: string }
  | { type: 'message'; message: PrivateMessage | ChatMessage };

const ChatWindow: React.FC<ChatWindowProps> = ({
  activeChat,
  messages,
  currentUserId,
  typingUsers,
  loading,
  hasMore,
  loadMore,
  message,
  setMessage,
  onMessageChange,
  onKeyPress,
  onSend,
  attachments,
  onFileSelect,
  onRemoveAttachment,
  onEmojiSelect,
  onBack,
  onClose: _onClose,
  onOpenGroupDialog: _onOpenGroupDialog,
}) => {
  const chat = useContext(ChatContext);
  const [selectedMsg, setSelectedMsg] =
    useState<ChatMessage | PrivateMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeChat.type === 'group') {
      chat?.fetchGroupMembers(activeChat.id);
    }
  }, [activeChat.id, activeChat.type, chat]);

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const lineHeight = parseInt(getComputedStyle(el).lineHeight || '20');
      const maxHeight = lineHeight * 5;
      el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    }
  }, [message]);

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const items: GroupedItem[] = [];
    let lastDate = '';
    messages
      .filter(m => m.content || m.attachments?.length)
      .forEach(msg => {
        const timestamp =
          activeChat.type === 'direct'
            ? (msg as PrivateMessage).created_at
            : (msg as ChatMessage).timestamp;
        const dateStr = formatIST(timestamp, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        if (dateStr !== lastDate) {
          items.push({ type: 'date', date: dateStr });
          lastDate = dateStr;
        }
        items.push({ type: 'message', message: msg });
      });
    return items;
  }, [messages, activeChat]);

  const isTyping =
    activeChat.type === 'direct' && typingUsers.has(Number(activeChat.id));

  const convo = chat?.conversations.find(
    c => c.id === activeChat.id && c.type === activeChat.type
  );
  const avatarSrc = getProfileImageSrc(convo?.avatar);
  const memberNames =
    activeChat.type === 'group'
      ? chat?.groupMembers[activeChat.id]?.map(u => u.name) ?? []
      : [];
  const statusText =
    activeChat.type === 'direct'
      ? isTyping
        ? 'Typing...'
        : chat?.onlineUsers.has(Number(activeChat.id))
          ? 'Online'
          : 'Offline'
      : memberNames.length
        ? (() => {
            const names = memberNames.slice(0, 3).join(', ');
            const remaining = memberNames.length - 3;
            return remaining > 0 ? `${names} +${remaining}` : names;
          })()
        : 'Group chat';

  const handleHold = (m: PrivateMessage | ChatMessage) => {
    setSelectedMsg(prev => (prev?.id === m.id ? null : m));
  };

  const handleDelete = () => {
    if (selectedMsg) {
      chat?.deleteMessage(selectedMsg);
      setSelectedMsg(null);
    }
  };


  const handleSend = async () => {
    if (editingMsg) {
      await chat?.updateMessage(editingMsg, message);
      setEditingMsg(null);
      setSelectedMsg(null);
    } else {
      await onSend();
    }
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyPress(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e);
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight || '20');
    const maxHeight = lineHeight * 5;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };

  return (
    <>
      <CardHeader className="h-16 px-4 py-0 flex flex-row items-center justify-between border-b bg-[#8B1F2F] space-y-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (editingMsg) {
                setEditingMsg(null);
                setSelectedMsg(null);
                setMessage('');
              } else if (selectedMsg) {
                setSelectedMsg(null);
              } else {
                onBack();
              }
            }}
            className="text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            {avatarSrc && <AvatarImage src={avatarSrc} alt={activeChat.title} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {activeChat.title.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-none">
            <CardTitle className="text-sm font-semibold text-white">{activeChat.title}</CardTitle>
            <span className="text-xs text-white/80">{statusText}</span>
          </div>
        </div>
        {selectedMsg && (
          <div className="flex items-center gap-2">
            {(
              'sender_id' in selectedMsg
                ? selectedMsg.sender_id
                : selectedMsg.senderId
            ) === currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditingMsg(selectedMsg);
                  setMessage(selectedMsg.content);
                  textareaRef.current?.focus();
                }}
                className="text-white"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-white"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col chat-bg-whatsapp">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <Virtuoso
              data={groupedItems}
              startReached={() => hasMore && loadMore()}
              followOutput="smooth"
              initialTopMostItemIndex={Math.max(groupedItems.length - 1, 0)}
              className="flex-1 px-0 py-3 overflow-x-hidden"
              itemContent={(index, item) => {
                if (item.type === 'date') {
                  return (
                    <div className="text-center text-xs text-muted-foreground my-2">
                      {item.date}
                    </div>
                  );
                }
                return (
                  <MessageItem
                    message={item.message}
                    isGroup={activeChat.type !== 'direct'}
                    currentUserId={currentUserId}
                    onHold={handleHold}
                    selected={selectedMsg?.id === item.message.id}
                  />
                );
              }}
            />
            {isTyping && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                User is typing…
              </div>
            )}
          </>
        )}
      </CardContent>
      <div className="border-t bg-[#fbeee6] px-4 py-3">
        {editingMsg && (
          <div className="flex items-center justify-between bg-[#fdf7f2] text-xs px-2 py-1 rounded mb-2">
            <span>Editing message</span>
            <button
              onClick={() => {
                setEditingMsg(null);
                setSelectedMsg(null);
                setMessage('');
              }}
              className="text-xs"
            >
              ✕
            </button>
          </div>
        )}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, idx) => (
              <AttachmentPreview
                key={idx}
                preview={att.preview}
                filename={att.file.name}
                type={att.file.type.startsWith('image/') ? 'image' : 'file'}
                onRemove={() => onRemoveAttachment(idx)}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#fdf7f2] rounded-full px-2 flex-1">
            <EmojiPicker onEmojiSelect={onEmojiSelect} />
            <FileUpload onFileSelect={onFileSelect} disabled={false} />
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={`Message ${activeChat.title}...`}
              className="flex-1 bg-transparent resize-none border-none focus:outline-none focus:ring-0 text-gray-900 max-h-[7.5rem] overflow-y-auto"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            className="bg-[#8B1F2F] text-white hover:bg-[#a83246] rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;

