import { describe, expect, it } from 'vitest';
import productsData from '@/data/products.json';
import { toSpokenText } from './speech';

describe('product photos', () => {
  it('uses Unsplash photos instead of placeholders', () => {
    const urls = productsData.products.map((p) => p.imageUrl);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.startsWith('https://images.unsplash.com/'))).toBe(
      true
    );
    expect(urls.some((url) => url.includes('placehold.co'))).toBe(false);
  });
});

describe('toSpokenText', () => {
  it('strips markdown and truncates long replies', () => {
    expect(toSpokenText('**Hello** from [Lumin](https://lumin.test)')).toBe(
      'Hello from Lumin'
    );
    const long = 'word '.repeat(200);
    const spoken = toSpokenText(long, 40);
    expect(spoken.endsWith('…')).toBe(true);
    expect(spoken.length).toBeLessThanOrEqual(41);
  });
});
