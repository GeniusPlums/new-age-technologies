'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  isLoading,
  placeholder = 'Describe a craving, a look, or a budget…',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative px-4 pb-5 pt-2">
      <div className="flex items-end gap-2 rounded-full border border-border bg-card p-1.5 pl-5 paper-shadow">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent py-3 pr-2 text-sm leading-relaxed',
            'focus-visible:outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px] max-h-[120px]'
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="h-11 w-11 rounded-full shrink-0 bg-primary text-primary-foreground flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
}
