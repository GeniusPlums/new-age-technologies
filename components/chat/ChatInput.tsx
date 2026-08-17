'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  isLoading,
  voiceEnabled,
  onVoiceEnabledChange,
  placeholder = 'Describe a craving, a look, or a budget…',
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isTranscribing, error, start, stop, setError } =
    useVoiceRecorder();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicClick = async () => {
    setError(null);
    if (isRecording) {
      const text = await stop();
      if (text) {
        onVoiceEnabledChange(true);
        onSubmit(text);
      }
      return;
    }

    try {
      await start();
      onVoiceEnabledChange(true);
    } catch {
      setError('Microphone permission is needed for voice mode.');
    }
  };

  const busy = isLoading || isTranscribing;

  return (
    <form onSubmit={handleSubmit} className="relative px-4 pb-5 pt-2">
      <div
        className={cn(
          'flex items-end gap-2 rounded-full border bg-card p-1.5 pl-2 paper-shadow',
          isRecording ? 'border-primary' : 'border-border'
        )}
      >
        <button
          type="button"
          onClick={handleMicClick}
          disabled={busy}
          data-testid="voice-mic"
          className={cn(
            'h-11 w-11 rounded-full shrink-0 flex items-center justify-center transition-colors',
            isRecording
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
          aria-label={isRecording ? 'Stop listening' : 'Start voice mode'}
        >
          {isTranscribing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="chat-input"
          placeholder={
            isRecording
              ? 'Listening… tap the square when you are done'
              : isTranscribing
              ? 'Hearing that…'
              : placeholder
          }
          disabled={busy || isRecording}
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent py-3 pr-2 text-sm leading-relaxed',
            'focus-visible:outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'min-h-[44px] max-h-[120px]'
          )}
        />
        <button
          type="button"
          onClick={() => onVoiceEnabledChange(!voiceEnabled)}
          data-testid="voice-speaker"
          className={cn(
            'h-11 w-11 rounded-full shrink-0 flex items-center justify-center',
            voiceEnabled
              ? 'text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          )}
          aria-label={voiceEnabled ? 'Mute spoken replies' : 'Speak replies'}
        >
          {voiceEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </button>
        <button
          type="submit"
          disabled={!input.trim() || busy || isRecording}
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
      {error && (
        <p className="text-xs text-destructive text-center mt-2">{error}</p>
      )}
    </form>
  );
}
