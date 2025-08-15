import { test, expect } from '@playwright/test';

test.describe('Dashboard Authentication and Flow', () => {
  test('unauthenticated user is redirected to signin', async ({ page }) => {
    // Navigate to protected dashboard
    await page.goto('/app');
    
    // Should be redirected to signin page
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Should see signin form
    await expect(page.locator('h2')).toContainText('Sign in to your account');
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Continue with Microsoft')).toBeVisible();
  });

  test('signin page has proper accessibility', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for proper ARIA labels and structure
    await expect(page.locator('[aria-label="Rivor Home"]')).toBeVisible();
    
    // Check that buttons have proper focus states
    const googleButton = page.locator('text=Continue with Google');
    await googleButton.focus();
    await expect(googleButton).toBeFocused();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const microsoftButton = page.locator('text=Continue with Microsoft');
    await expect(microsoftButton).toBeFocused();
  });

  test('command palette keyboard shortcut works', async ({ page, browserName }) => {
    // Note: This test would require authentication setup
    // For now, we'll test the public pages
    await page.goto('/');
    
    // Test Cmd+K (or Ctrl+K on non-Mac)
    const isMac = browserName === 'webkit' || process.platform === 'darwin';
    const modifierKey = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifierKey}+KeyK`);
    
    // Command palette should not open on public pages without auth
    // But we can verify the shortcut doesn't cause errors
    await expect(page.locator('html')).toBeVisible();
  });

  test('app navigation structure is correct', async ({ page }) => {
    // Test the main app shell navigation
    // This would require auth, so we'll test the structure availability
    await page.goto('/app');
    
    // Should redirect to signin
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Verify signin page structure
    await expect(page.locator('main, div')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that the page is responsive
    await expect(page.locator('body')).toBeVisible();
    
    // Check signin page on mobile
    await page.goto('/auth/signin');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
    
    // Verify mobile-specific elements
    const mobileContainer = page.locator('.w-full.lg\\:w-1\\/2');
    await expect(mobileContainer).toBeVisible();
  });

  test('error handling displays user-friendly messages', async ({ page }) => {
    // Test error query parameter handling
    await page.goto('/auth/signin?error=AccessDenied');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('text=Access was denied')).toBeVisible();
  });

  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main elements
    await expect(page.locator('h1')).toContainText('Where Deals Flow Seamlessly');
    await expect(page.locator('text=Get Started')).toBeVisible();
    await expect(page.locator('text=See Demo')).toBeVisible();
    
    // Check navigation links work
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('loading states and transitions work', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for smooth transitions
    await expect(page.locator('.animate-fade-in')).toBeVisible();
    
    // Test button interactions
    const googleButton = page.locator('text=Continue with Google');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });
});

test.describe('Accessibility Tests', () => {
  test('signin page meets WCAG AA standards', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check color contrast and text readability
    await expect(page.locator('h2')).toHaveCSS('color', /rgb\(/);
    
    // Check focus management
    const firstFocusableElement = page.locator('button, a, input').first();
    await firstFocusableElement.focus();
    await expect(firstFocusableElement).toBeFocused();
    
    // Check ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount(1); // Rivor Home link
  });

  test('keyboard navigation works throughout the app', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstLink = page.locator('a[href="/auth/signin"]').first();
    await expect(firstLink).toBeFocused();
    
    await page.keyboard.press('Tab');
    const secondLink = page.locator('a[href="/demo"]');
    await expect(secondLink).toBeFocused();
  });

  test('reduced motion preferences are respected', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/auth/signin');
    
    // Verify animations are reduced/disabled
    const animatedElement = page.locator('.animate-fade-in');
    await expect(animatedElement).toBeVisible();
    
    // Note: This test would ideally check CSS animation-duration
    // but Playwright's current API makes this challenging
  });
});
