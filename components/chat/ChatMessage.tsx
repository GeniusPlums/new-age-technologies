'use client';

import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand/BrandMark';
import { useMemo } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const formattedContent = useMemo(() => formatContent(content), [content]);
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <BrandMark size={32} />
        </div>
      )}

      <div className={cn('flex-1', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block px-4 py-3 max-w-[85%] text-left',
            isUser
              ? 'rounded-3xl rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-3xl rounded-tl-md bg-card border border-border/70 paper-shadow'
          )}
        >
          <div
            className="text-sm leading-relaxed max-w-none [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
          {isStreaming && (
            <span className="inline-flex ml-1 align-middle">
              <span className="w-1.5 h-1.5 bg-current rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-current rounded-full typing-dot ml-1" />
              <span className="w-1.5 h-1.5 bg-current rounded-full typing-dot ml-1" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
