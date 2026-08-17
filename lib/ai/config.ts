import { groq } from '@ai-sdk/groq';

export const GROQ_FAST_MODEL = 'openai/gpt-oss-20b';
export const GROQ_CHAT_MODEL = 'openai/gpt-oss-120b';

export const DEFAULT_TEMPERATURE = 0.6;
export const EXTRACTION_TEMPERATURE = 0.2;

export function getGroqModel(model: string = GROQ_CHAT_MODEL) {
  return groq(model);
}

export const AI_PRESETS = {
  extraction: {
    model: groq(GROQ_FAST_MODEL),
    temperature: EXTRACTION_TEMPERATURE,
  },
  chat: {
    model: groq(GROQ_CHAT_MODEL),
    temperature: DEFAULT_TEMPERATURE,
  },
  analysis: {
    model: groq(GROQ_CHAT_MODEL),
    temperature: DEFAULT_TEMPERATURE,
  },
} as const;
