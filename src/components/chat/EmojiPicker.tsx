import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
    'Gestures': ['👍', '👎', '👌', '🤞', '✌️', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    'Objects': ['📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📚', '📖', '📝', '✏️', '🖊️', '🖋️', '✒️', '📄', '📋', '📊', '📈', '📉', '🗂️', '📁'],
    'Nature': ['🌱', '🌿', '🍀', '🌳', '🌲', '🌴', '🌵', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '💐', '🌹', '🥀', '🌪️', '🌈', '☀️', '⭐']
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => onEmojiSelect(emoji)}
                    >
                      <span className="text-lg">{emoji}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;