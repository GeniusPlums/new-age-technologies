import { expect, test } from '@playwright/test';

test('shows voice mode controls on the home composer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('voice-mic')).toBeVisible();
  await expect(page.getByTestId('voice-speaker')).toBeVisible();
  await expect(page.getByText('Find what feels right.')).toBeVisible();
});
