import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PrivateMessage, ChatMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface MessageActionsProps {
  message: PrivateMessage | ChatMessage | null;
  onEdit: (content: string) => void;
  onDelete: () => void;
  open: boolean;
  onClose: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onEdit,
  onDelete,
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (message) {
      setContent(message.content);
    }
    setEditing(false);
  }, [message, open]);

  if (!message) return null;

  const isOwn = 'sender_id' in message ? message.sender_id === user?.id : message.senderId === user?.id;

  const handleSave = () => {
    onEdit(content);
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        {!editing ? (
          <div className="flex flex-col gap-2">
            {isOwn && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <DialogHeader>
              <DialogTitle>Edit Message</DialogTitle>
            </DialogHeader>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MessageActions;

