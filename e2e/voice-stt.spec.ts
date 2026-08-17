import { expect, test } from '@playwright/test';
import { transcribePhrase } from './helpers';

test.describe('production voice transcription', () => {
  test.describe.configure({ timeout: 90_000 });

  test('kurta under 500 is not heard as kirtan', async ({ request }) => {
    const text = await transcribePhrase(request, 'kurta under 500');
    expect(text.toLowerCase()).not.toMatch(/\bkirtan\b/);
    expect(text.toLowerCase()).toMatch(/kurta/);
    expect(text).toMatch(/500/);
  });

  test('cotton kurti stays kurti, not curtain or kirtan', async ({ request }) => {
    const text = await transcribePhrase(request, 'cotton kurti');
    expect(text.toLowerCase()).not.toMatch(/\bkirtan\b|\bcurtain\b/);
    expect(text.toLowerCase()).toMatch(/kurti|kurta/);
  });

  test('vegan snacks under 300 keeps food words', async ({ request }) => {
    const text = await transcribePhrase(request, 'vegan snacks under 300');
    expect(text.toLowerCase()).toMatch(/vegan/);
    expect(text.toLowerCase()).toMatch(/snack/);
  });

  test('green tea is not transcribed as green tee', async ({ request }) => {
    const text = await transcribePhrase(request, 'herbal green tea');
    expect(text.toLowerCase()).toMatch(/tea/);
  });

  test('palazzo pants keeps palazzo', async ({ request }) => {
    const text = await transcribePhrase(request, 'palazzo pants');
    expect(text.toLowerCase()).toMatch(/palazzo/);
  });

  test('masala makhana keeps makhana', async ({ request }) => {
    const text = await transcribePhrase(request, 'masala makhana');
    expect(text.toLowerCase()).toMatch(/makhana|fox nut/);
  });
});
