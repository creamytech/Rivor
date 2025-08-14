import { test, expect } from '@playwright/test';

test.describe('Inbox Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.goto('/app/inbox');
  });

  test('should display thread list', async ({ page }) => {
    await expect(page.locator('[data-testid="thread-list"]')).toBeVisible();
    await expect(page.locator('text=Property Inquiry')).toBeVisible();
  });

  test('should open thread when clicked', async ({ page }) => {
    await page.click('text=Property Inquiry');
    
    await expect(page.locator('[data-testid="thread-content"]')).toBeVisible();
    await expect(page.locator('text=AI Summary')).toBeVisible();
  });

  test('should search through threads', async ({ page }) => {
    await page.fill('input[placeholder="Search messages..."]', 'property');
    
    // Should filter results
    await expect(page.locator('text=Property Inquiry')).toBeVisible();
  });

  test('should filter by unread/starred', async ({ page }) => {
    await page.click('button:has-text("Unread")');
    
    // Should show only unread threads
    await expect(page.locator('[data-testid="unread-indicator"]')).toBeVisible();
  });

  test('should open AI draft modal', async ({ page }) => {
    await page.click('text=Property Inquiry');
    await page.click('button:has-text("AI Draft")');
    
    await expect(page.locator('text=AI Email Assistant')).toBeVisible();
    await expect(page.locator('text=Draft Suggestions')).toBeVisible();
  });

  test('should handle thread actions', async ({ page }) => {
    await page.click('text=Property Inquiry');
    
    // Test more actions menu
    await page.click('[data-testid="thread-actions"]');
    await expect(page.locator('text=Archive')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
    await expect(page.locator('text=Convert to Lead')).toBeVisible();
  });
});

test.describe('Inbox Keyboard Navigation', () => {
  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/app/inbox');
    
    // Test j/k navigation
    await page.keyboard.press('j');
    await page.keyboard.press('k');
    
    // Test archive with 'e'
    await page.keyboard.press('e');
    
    // Test reply with 'r'
    await page.keyboard.press('r');
    await expect(page.locator('textarea[placeholder="Write a reply..."]')).toBeFocused();
  });

  test('should support command palette', async ({ page }) => {
    await page.goto('/app/inbox');
    
    // Open command palette
    await page.keyboard.press('Meta+k');
    await expect(page.locator('text=Type a command or search...')).toBeVisible();
    
    // Search for action
    await page.type('input[placeholder="Type a command or search..."]', 'inbox');
    await expect(page.locator('text=Go to Inbox')).toBeVisible();
    
    // Close with escape
    await page.keyboard.press('Escape');
  });
});
