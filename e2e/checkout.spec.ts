import { test, expect } from '@playwright/test';

const cart = {
  items: [
    {
      id: 'food-001',
      name: 'Plant-Based Protein Cookies',
      description: 'Delicious vegan cookies packed with 12g plant protein per serving.',
      category: 'food',
      subcategory: 'snacks',
      price: 299,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',
      brand: 'NutriBite',
      tags: ['vegan'],
      rating: 4.5,
      inStock: true,
      quantity: 1,
    },
  ],
  totalItems: 1,
  totalPrice: 299,
};

test.describe('checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('lumin-cart', JSON.stringify(state));
    }, cart);
  });

  test('pays with UPI and shows an order', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cart-trigger').click();
    await expect(page.getByText('Plant-Based Protein Cookies')).toBeVisible();
    await page.getByTestId('checkout-button').click();

    await page.getByTestId('checkout-name').fill('Anish Kumar');
    await page.getByTestId('checkout-phone').fill('9876543210');
    await page.getByTestId('checkout-email').fill('anish@example.com');
    await page.getByTestId('checkout-address').fill('12 MG Road');
    await page.getByTestId('checkout-city').fill('Bengaluru');
    await page.getByTestId('checkout-state').fill('Karnataka');
    await page.getByTestId('checkout-pincode').fill('560001');
    await page.getByTestId('pay-upi').click();
    await page.getByTestId('checkout-upi-id').fill('anish@okaxis');
    await page.getByTestId('pay-now-button').click();

    await expect(page.getByTestId('order-success')).toBeVisible();
    await expect(page.getByTestId('order-id')).toHaveText(/LUM-/);

    await page.getByRole('button', { name: 'View orders' }).click();
    await expect(page.getByTestId('orders-list')).toBeVisible();
    await expect(page.getByTestId('order-card')).toContainText('Plant-Based Protein Cookies');
  });

  test('declines a card ending in 0000', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cart-trigger').click();
    await page.getByTestId('checkout-button').click();

    await page.getByTestId('checkout-name').fill('Anish Kumar');
    await page.getByTestId('checkout-phone').fill('9876543210');
    await page.getByTestId('checkout-email').fill('anish@example.com');
    await page.getByTestId('checkout-address').fill('12 MG Road');
    await page.getByTestId('checkout-city').fill('Bengaluru');
    await page.getByTestId('checkout-state').fill('Karnataka');
    await page.getByTestId('checkout-pincode').fill('560001');
    await page.getByTestId('pay-card').click();
    await page.getByTestId('checkout-card-number').fill('4111111111110000');
    await page.getByTestId('checkout-card-expiry').fill('12/28');
    await page.getByTestId('checkout-card-cvv').fill('123');
    await page.getByTestId('checkout-card-name').fill('Anish Kumar');
    await page.getByTestId('pay-now-button').click();

    await expect(page.getByTestId('checkout-error')).toContainText(/declined/i);
    await expect(page.getByTestId('order-success')).toHaveCount(0);
  });
});
