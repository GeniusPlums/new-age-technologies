import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const FOOD_PRODUCTS = [
  'Plant-Based Protein Cookies',
  'Oats & Chia Seed Energy Bars',
  'Quinoa Energy Bites',
  'Masala Roasted Makhana',
  'Organic Granola Mix',
  'Peanut Butter Protein Spread',
  'Mixed Dry Fruits Trail Mix',
  'Herbal Green Tea Collection',
];

export const FASHION_PRODUCTS = [
  'Handblock Print Cotton Kurta',
  'Everyday Cotton Kurta',
  'Oversized Cotton Tee',
  'Linen Blend Formal Shirt',
  'Embroidered Chikankari Kurti',
  'Athletic Dry-Fit Track Pants',
  'Classic Denim Jacket',
  'Printed Palazzo Pants',
  'Slim Fit Chinos',
  'Woolen Ethnic Stole',
  'Relaxed Fit Joggers',
];

export const KURTA_NAMES = [
  'Handblock Print Cotton Kurta',
  'Everyday Cotton Kurta',
  'Embroidered Chikankari Kurti',
];

export async function gotoShop(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Find what feels right.')).toBeVisible();
  await expect(page.getByTestId('voice-mic')).toBeVisible();
}

export async function askShop(page: Page, query: string) {
  const input = page.getByTestId('chat-input').or(page.locator('textarea')).first();
  await input.fill(query);

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/chat') && response.request().method() === 'POST',
    { timeout: 90_000 }
  );

  await page.getByRole('button', { name: 'Send message' }).click();
  const response = await responsePromise;
  expect(response.ok(), `chat API failed for "${query}": ${response.status()}`).toBeTruthy();

  await expect(page.locator('.typing-dot')).toHaveCount(0, { timeout: 90_000 });
  await expect(page.getByText(query, { exact: false }).first()).toBeVisible();
}

export async function productNames(page: Page): Promise<string[]> {
  const cards = page.getByTestId('product-card');
  if ((await cards.count()) > 0) {
    return cards.evaluateAll((elements) =>
      elements.map((el) => el.getAttribute('data-product-name') || '').filter(Boolean)
    );
  }
  return page.locator('h3').allTextContents();
}

export async function productCards(page: Page) {
  const cards = page.getByTestId('product-card');
  if ((await cards.count()) > 0) return cards;
  return page.locator('h3');
}

export async function waitForProductsOrReply(page: Page) {
  await expect
    .poll(async () => {
      const names = await productNames(page);
      const body = await page.locator('body').innerText();
      return names.length > 0 || body.length > 80;
    }, { timeout: 20_000 })
    .toBeTruthy();
}

export function expectNoFood(names: string[]) {
  const foodHits = names.filter((name) => FOOD_PRODUCTS.includes(name));
  expect(foodHits, `food products leaked into a fashion search: ${foodHits.join(', ')}`).toEqual([]);
}

export function expectNoFashion(names: string[]) {
  const fashionHits = names.filter((name) => FASHION_PRODUCTS.includes(name));
  expect(
    fashionHits,
    `fashion products leaked into a food search: ${fashionHits.join(', ')}`
  ).toEqual([]);
}

export function expectNoKirtan(text: string, names: string[]) {
  expect(text, 'reply mentioned kirtan instead of kurta').not.toMatch(/\bkirtan\b/i);
  expect(names.join(' '), 'product names mentioned kirtan').not.toMatch(/\bkirtan\b/i);
}

export async function loadedProductImages(page: Page) {
  const images = page.getByTestId('product-image').or(page.locator('article img, [data-testid="product-card"] img, img[alt]'));
  const count = await images.count();
  const details: Array<{ alt: string; width: number; src: string }> = [];
  const catalog = new Set(FOOD_PRODUCTS.concat(FASHION_PRODUCTS));

  for (let i = 0; i < count; i += 1) {
    const image = images.nth(i);
    const alt = (await image.getAttribute('alt')) || '';
    if (!catalog.has(alt)) continue;

    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          image.evaluate((el) => (el as HTMLImageElement).naturalWidth || 0),
        { timeout: 15_000 }
      )
      .toBeGreaterThan(0);

    const info = await image.evaluate((el) => {
      const img = el as HTMLImageElement;
      return { width: img.naturalWidth, src: img.currentSrc || img.src };
    });
    details.push({ alt, ...info });
  }

  return details;
}

export async function transcribePhrase(request: APIRequestContext, phrase: string) {
  const spoken = await request.post('/api/voice/speak', {
    data: { text: phrase },
  });
  expect(spoken.ok(), `TTS failed for "${phrase}": ${spoken.status()}`).toBeTruthy();
  const audio = await spoken.body();
  expect(audio.byteLength).toBeGreaterThan(1000);

  const transcribed = await request.post('/api/voice/transcribe', {
    multipart: {
      file: {
        name: 'speech.wav',
        mimeType: 'audio/wav',
        buffer: audio,
      },
    },
  });
  expect(
    transcribed.ok(),
    `STT failed for "${phrase}": ${transcribed.status()}`
  ).toBeTruthy();
  const payload = (await transcribed.json()) as { text?: string };
  return (payload.text || '').trim();
}
