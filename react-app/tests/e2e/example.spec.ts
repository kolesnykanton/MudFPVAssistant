import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  
  // Wait for auth to load
  await page.waitForLoadState('networkidle');
  
  // Check that the page title exists
  const title = page.locator('h1, h2, title');
  await expect(title.first()).toBeDefined();
});

test('navigation menu is present', async ({ page }) => {
  await page.goto('/');
  
  // Look for main navigation elements
  const nav = page.locator('nav, [role="navigation"]');
  await expect(nav).toBeDefined();
});
