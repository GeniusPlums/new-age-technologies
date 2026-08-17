import { expect, test } from '@playwright/test';
import {
  FOOD_PRODUCTS,
  KURTA_NAMES,
  askShop,
  expectNoFashion,
  expectNoFood,
  expectNoKirtan,
  gotoShop,
  loadedProductImages,
  productNames,
  waitForProductsOrReply,
} from './helpers';

test.describe('production shopping scenarios', () => {
  test.describe.configure({ timeout: 120_000 });

  test('voice controls and composer are on the home screen', async ({ page }) => {
    await gotoShop(page);
    await expect(page.getByTestId('voice-speaker')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
  });

  test('kurta under 500 returns kurtas, not kirtan or food photos', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'kurta under 500');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    const body = await page.locator('body').innerText();
    expectNoKirtan(body, names);
    expectNoFood(names);

    expect(names.length, 'expected at least one kurta/ethnic match').toBeGreaterThan(0);
    expect(names.some((name) => KURTA_NAMES.includes(name) || /kurta|kurti/i.test(name))).toBe(
      true
    );

    const prices = await page.getByTestId('product-card').evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-product-price') || '0'))
    );
    if (prices.length > 0) {
      expect(prices.every((price) => price <= 500)).toBe(true);
    }

    const images = await loadedProductImages(page);
    expect(images.length, 'product images should render').toBeGreaterThan(0);
    for (const image of images) {
      expect(image.width, `broken image for ${image.alt}`).toBeGreaterThan(0);
      expect(image.alt).not.toMatch(/kirtan|cookie|granola|makhana|tea collection/i);
      expect(KURTA_NAMES.concat(names)).toContain(image.alt);
    }
  });

  test('misheard kirtan is treated as kurta, not random catalog photos', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'kirtan under 500');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    const body = await page.locator('body').innerText();
    expectNoFood(names);
    expect(body).not.toMatch(/kirtan playlist|devotional|bhajan/i);

    if (names.length > 0) {
      expect(names.some((name) => /kurta|kurti/i.test(name))).toBe(true);
      const images = await loadedProductImages(page);
      for (const image of images) {
        expect(image.width).toBeGreaterThan(0);
        expect(image.alt).toMatch(/kurta|kurti/i);
      }
    } else {
      expect(body).toMatch(/kurta|couldn't find|no match|don't have/i);
    }
  });

  test('plain kirtan does not dump unrelated product images', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'kirtan');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names.every((name) => !FOOD_PRODUCTS.includes(name))).toBe(true);
    if (names.length > 0) {
      expect(names.some((name) => /kurta|kurti|ethnic/i.test(name))).toBe(true);
    }
  });

  test('cotton kurta shows the cotton kurta with a real photo', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'cotton kurta');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names.some((name) => /cotton kurta/i.test(name))).toBe(true);

    const images = await loadedProductImages(page);
    const kurtaImage = images.find((image) => /kurta/i.test(image.alt));
    expect(kurtaImage, 'kurta card is missing an image').toBeTruthy();
    expect(kurtaImage!.width).toBeGreaterThan(0);
  });

  test('chikankari kurti stays on the embroidered kurti', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'chikankari kurti');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names).toContain('Embroidered Chikankari Kurti');
  });

  test('palazzo pants do not return track pants or snacks', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'palazzo pants');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names).toContain('Printed Palazzo Pants');
    expect(names).not.toContain('Athletic Dry-Fit Track Pants');
  });

  test('oversized tee is a t-shirt, not tea', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'oversized tee');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names).toContain('Oversized Cotton Tee');
    expect(names).not.toContain('Herbal Green Tea Collection');
  });

  test('green tea is tea, not a tee', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'green tea');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFashion(names);
    expect(names).toContain('Herbal Green Tea Collection');
    expect(names).not.toContain('Oversized Cotton Tee');
  });

  test('vegan snacks under 300 stay food, vegan, and in budget', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'vegan snacks under 300');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFashion(names);
    expect(names.length).toBeGreaterThan(0);

    const cards = page.getByTestId('product-card');
    if ((await cards.count()) > 0) {
      const prices = await cards.evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute('data-product-price') || '0'))
      );
      expect(prices.every((price) => price <= 300)).toBe(true);
    }
  });

  test('casual wear under 1000 stays fashion and in budget', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'casual wear under 1000');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names.length).toBeGreaterThan(0);

    const cards = page.getByTestId('product-card');
    if ((await cards.count()) > 0) {
      const prices = await cards.evaluateAll((els) =>
        els.map((el) => Number(el.getAttribute('data-product-price') || '0'))
      );
      expect(prices.every((price) => price <= 1000)).toBe(true);
    }
  });

  test('protein breakfast returns breakfast food, not ethnic wear', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'protein-rich breakfast options');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFashion(names);
    expect(names.length).toBeGreaterThan(0);
    expect(
      names.some((name) => /oats|granola|peanut|breakfast|bar/i.test(name))
    ).toBe(true);
  });

  test('makhana search shows makhana with a loaded photo', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'masala makhana');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expect(names).toContain('Masala Roasted Makhana');
    const images = await loadedProductImages(page);
    const makhana = images.find((image) => /makhana/i.test(image.alt));
    expect(makhana?.width).toBeGreaterThan(0);
  });

  test('greeting does not invent product photos', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'hi');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expect(names).toEqual([]);
  });

  test('unknown catalog item does not dump unrelated images', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'xylophone under 500');
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expect(names, `unknown item should not map to ${names.join(', ')}`).toEqual([]);
  });

  test('sample wardrobe prompt stays on ethnic fashion photos', async ({ page }) => {
    await gotoShop(page);
    await page.getByRole('button', { name: /Light ethnic wear for summer/i }).click();
    await page.waitForResponse(
      (response) =>
        response.url().includes('/api/chat') && response.request().method() === 'POST',
      { timeout: 90_000 }
    );
    await expect(page.locator('.typing-dot')).toHaveCount(0, { timeout: 90_000 });
    await waitForProductsOrReply(page);

    const names = await productNames(page);
    expectNoFood(names);
    expect(names.length).toBeGreaterThan(0);
    const images = await loadedProductImages(page);
    expect(images.every((image) => image.width > 0)).toBe(true);
  });

  test('budget follow-up keeps the previous fashion search', async ({ page }) => {
    await gotoShop(page);
    await askShop(page, 'show me ethnic wear');
    await waitForProductsOrReply(page);
    expectNoFood(await productNames(page));

    await askShop(page, 'under 1000');
    await waitForProductsOrReply(page);
    const names = await productNames(page);
    expectNoFood(names);
    expect(names.length).toBeGreaterThan(0);
  });
});
