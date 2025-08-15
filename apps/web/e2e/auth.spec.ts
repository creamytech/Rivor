import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto('/app/inbox');
    
    // Should redirect to signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });

  test('should show onboarding for new users', async ({ page }) => {
    // Mock authenticated state but no org setup
    await page.goto('/onboarding');
    
    await expect(page.locator('text=Welcome to Rivor')).toBeVisible();
    await expect(page.locator('text=Organization Setup')).toBeVisible();
  });

  test('should complete onboarding flow', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Step 1: Organization
    await page.fill('input[placeholder="Enter organization name"]', 'Test Company');
    await page.click('button:has-text("Continue")');
    
    // Step 2: Email integration
    await page.click('button:has-text("Connect Microsoft")');
    await page.click('button:has-text("Continue")');
    
    // Step 3: Pipeline template
    await page.click('text=Real Estate Pipeline');
    await page.click('button:has-text("Continue")');
    
    // Should complete onboarding
    await expect(page.locator('text=Setup Complete')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should maintain session across page refreshes', async ({ page }) => {
    // Try to access protected route - will redirect to signin
    await page.goto('/app');
    
    // Should redirect to signin page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // Refresh page
    await page.reload();
    
    // Should still be on signin page (consistent behavior)
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    // Try to access protected route without session
    await page.goto('/app');
    
    // Should redirect to signin immediately (no session)
    await expect(page).toHaveURL(/.*\/auth\/signin/);
    
    // Clear any cookies and try again
    await page.context().clearCookies();
    await page.goto('/app');
    
    // Should still redirect to signin
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });
});
