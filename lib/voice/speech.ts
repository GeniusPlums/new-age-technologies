export const GROQ_WHISPER_MODEL = 'whisper-large-v3-turbo';
export const GROQ_TTS_MODEL = 'canopylabs/orpheus-v1-english';
export const GROQ_TTS_VOICE = 'hannah';

export function toSpokenText(content: string, maxLength = 480): string {
  const spoken = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[*_#`>]+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (spoken.length <= maxLength) return spoken;
  return `${spoken.slice(0, maxLength).trim()}…`;
}

export function groqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return key;
}
