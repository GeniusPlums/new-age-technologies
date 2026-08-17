import { describe, expect, it } from 'vitest';
import { correctShoppingTranscript } from './correct-transcript';

describe('correctShoppingTranscript', () => {
  it('maps kirtan back to kurta', () => {
    expect(correctShoppingTranscript('kirtan under 500')).toBe('kurta under 500');
    expect(correctShoppingTranscript('show me kirtans')).toBe('show me kurtas');
  });

  it('maps curtain to kurta for this catalog', () => {
    expect(correctShoppingTranscript('cotton curtain under 500')).toBe(
      'cotton kurta under 500'
    );
  });

  it('maps makana back to makhana', () => {
    expect(correctShoppingTranscript('masala makana.')).toBe('masala makhana.');
  });

  it('leaves a real kurta query unchanged', () => {
    expect(correctShoppingTranscript('kurta under 500')).toBe('kurta under 500');
  });
});
