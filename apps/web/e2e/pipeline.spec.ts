import { test, expect } from '@playwright/test';

test.describe('Pipeline Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/pipeline');
  });

  test('should display pipeline stages', async ({ page }) => {
    await expect(page.locator('text=New Lead')).toBeVisible();
    await expect(page.locator('text=Qualified')).toBeVisible();
    await expect(page.locator('text=Proposal')).toBeVisible();
    await expect(page.locator('text=Closed Won')).toBeVisible();
  });

  test('should show lead cards', async ({ page }) => {
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=$750,000')).toBeVisible();
  });

  test('should drag and drop leads between stages', async ({ page }) => {
    const leadCard = page.locator('text=John Smith').locator('..');
    const qualifiedStage = page.locator('text=Qualified').locator('..');
    
    // Perform drag and drop
    await leadCard.dragTo(qualifiedStage);
    
    // Verify lead moved
    await expect(qualifiedStage.locator('text=John Smith')).toBeVisible();
  });

  test('should open new lead dialog', async ({ page }) => {
    await page.click('button:has-text("Add Lead")');
    
    await expect(page.locator('text=Create New Lead')).toBeVisible();
    await expect(page.locator('input[placeholder="Lead name"]')).toBeVisible();
  });

  test('should create new lead', async ({ page }) => {
    await page.click('button:has-text("Add Lead")');
    
    await page.fill('input[placeholder="Lead name"]', 'Test Lead');
    await page.fill('input[placeholder="Company name"]', 'Test Company');
    await page.fill('input[placeholder="email@example.com"]', 'test@example.com');
    await page.fill('input[placeholder="$100,000"]', '$500,000');
    
    await page.click('button:has-text("Create Lead")');
    
    // Should close dialog and show new lead
    await expect(page.locator('text=Test Lead')).toBeVisible();
  });

  test('should show lead details in right drawer', async ({ page }) => {
    await page.click('text=John Smith');
    
    await expect(page.locator('text=Lead Details')).toBeVisible();
    await expect(page.locator('text=Smith Properties')).toBeVisible();
    await expect(page.locator('button:has-text("Send Email")')).toBeVisible();
  });

  test('should handle lead actions', async ({ page }) => {
    const leadCard = page.locator('text=John Smith').locator('..');
    await leadCard.locator('[data-testid="lead-actions"]').click();
    
    await expect(page.locator('text=Edit')).toBeVisible();
    await expect(page.locator('text=Send Email')).toBeVisible();
    await expect(page.locator('text=Schedule Meeting')).toBeVisible();
    await expect(page.locator('text=Archive')).toBeVisible();
    await expect(page.locator('text=Delete')).toBeVisible();
  });
});

test.describe('Pipeline Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/app/pipeline');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/app/pipeline');
    
    // Check for accessible names
    await expect(page.locator('[aria-label="Add Lead"]')).toBeVisible();
    await expect(page.locator('[role="button"]')).toHaveCount(6); // Stage buttons + Add Lead
  });
});
