import { describe, expect, it } from 'vitest';
import {
  AI_PRESETS,
  DEFAULT_TEMPERATURE,
  EXTRACTION_TEMPERATURE,
  GROQ_CHAT_MODEL,
  GROQ_FAST_MODEL,
} from './config';

describe('AI config', () => {
  it('routes extraction to Groq gpt-oss-20b and chat to gpt-oss-120b', () => {
    expect(GROQ_FAST_MODEL).toBe('openai/gpt-oss-20b');
    expect(GROQ_CHAT_MODEL).toBe('openai/gpt-oss-120b');
    expect(AI_PRESETS.extraction.model.modelId).toBe(GROQ_FAST_MODEL);
    expect(AI_PRESETS.chat.model.modelId).toBe(GROQ_CHAT_MODEL);
    expect(AI_PRESETS.analysis.model.modelId).toBe(GROQ_CHAT_MODEL);
  });

  it('uses lower temperature for structured extraction than chat', () => {
    expect(EXTRACTION_TEMPERATURE).toBeLessThan(DEFAULT_TEMPERATURE);
    expect(AI_PRESETS.extraction.temperature).toBe(EXTRACTION_TEMPERATURE);
    expect(AI_PRESETS.chat.temperature).toBe(DEFAULT_TEMPERATURE);
  });
});
