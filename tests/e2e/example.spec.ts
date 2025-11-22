import { test, expect } from '@playwright/test';

test('game loads and shows title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Figs in Space/i);
  // Add more selectors once the game is running
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});
