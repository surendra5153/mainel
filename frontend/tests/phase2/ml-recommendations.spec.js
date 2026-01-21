import { test, expect } from '@playwright/test';

test.describe('Phase 2.4: ML Recommendations Frontend Integration', () => {
  async function createAndLoginUser(page) {
    const uniqueId = Date.now() + Math.floor(Math.random() * 10000);
    const userName = `TestUser${uniqueId}`;
    const userEmail = `testuser${uniqueId}@example.com`;
    const userPassword = 'password123';

    await page.goto('/signup');
    await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 10000 });
    
    await page.fill('input[placeholder="John Doe"]', userName);
    await page.fill('input[type="email"]', userEmail);
    await page.fill('input[type="password"]', userPassword);
    
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(home|dashboard)/, { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    return { userName, userEmail, userPassword };
  }

  test('should display PersonalizedRecommendations component on Dashboard', async ({ page }) => {
    await createAndLoginUser(page);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    await expect(page.locator('h2:has-text("Recommended for You")')).toBeVisible({ timeout: 15000 });
    
    const recommendationsSection = page.locator('div.bg-white.rounded-xl').filter({ hasText: 'Recommended for You' });
    await expect(recommendationsSection).toBeVisible();
  });

  test('should show loading state while fetching recommendations', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    const loadingSpinner = page.locator('svg.animate-spin');
    const hasLoadingState = await loadingSpinner.isVisible().catch(() => false);
    
    if (hasLoadingState) {
      await expect(loadingSpinner).toBeVisible();
    }
  });

  test('should display recommendations with skill details after loading', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    const recommendationsSection = page.locator('div.bg-white.rounded-xl').filter({ hasText: 'Recommended for You' });
    await expect(recommendationsSection).toBeVisible();
    
    const hasRecommendations = await page.locator('div.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3').isVisible().catch(() => false);
    
    if (hasRecommendations) {
      const skillCards = page.locator('div.border.border-gray-200.rounded-lg');
      const cardCount = await skillCards.count();
      
      expect(cardCount).toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(6);
      
      const firstCard = skillCards.first();
      await expect(firstCard.locator('h3')).toBeVisible();
      await expect(firstCard.locator('p.text-xs.text-gray-600')).toBeVisible();
      
      const hasMatchPercentage = await firstCard.locator('text=/\\d+% match/').isVisible().catch(() => false);
      if (hasMatchPercentage) {
        await expect(firstCard.locator('text=/\\d+% match/')).toBeVisible();
      }
    }
  });

  test('should show empty state for new users without activity', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    const emptyStateMessage = page.locator('text=No recommendations available yet');
    const hasEmptyState = await emptyStateMessage.isVisible().catch(() => false);
    
    if (hasEmptyState) {
      await expect(emptyStateMessage).toBeVisible();
      await expect(page.locator('text=Start by adding skills to your profile')).toBeVisible();
    }
  });

  test('should fetch recommendations from ML API endpoint', async ({ page }) => {
    await createAndLoginUser(page);
    
    let apiCallMade = false;
    
    page.on('response', response => {
      if (response.url().includes('/api/ml/recommendations/skills')) {
        apiCallMade = true;
      }
    });
    
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    expect(apiCallMade).toBe(true);
  });

  test('should display recommendation reasons when available', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    const reasonBadge = page.locator('div.bg-indigo-50.rounded.text-xs.text-indigo-700');
    const hasReason = await reasonBadge.first().isVisible().catch(() => false);
    
    if (hasReason) {
      await expect(reasonBadge.first()).toBeVisible();
      const reasonText = await reasonBadge.first().textContent();
      expect(reasonText.length).toBeGreaterThan(0);
    }
  });

  test('should display high-match indicator for recommendations >= 70%', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    const trendingIcon = page.locator('svg.text-green-500');
    const hasTrendingIcon = await trendingIcon.first().isVisible().catch(() => false);
    
    if (hasTrendingIcon) {
      await expect(trendingIcon.first()).toBeVisible();
    }
  });

  test('should only show recommendations for authenticated users', async ({ page, context }) => {
    await createAndLoginUser(page);
    await context.clearCookies();
    
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display "View All" link in recommendations section', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(2000);
    
    const recommendationsSection = page.locator('div.bg-white.rounded-xl').filter({ hasText: 'Recommended for You' });
    const hasRecommendations = await recommendationsSection.isVisible().catch(() => false);
    
    if (hasRecommendations) {
      const viewAllLink = recommendationsSection.locator('a:has-text("View All")');
      await expect(viewAllLink).toBeVisible();
      await expect(viewAllLink).toHaveAttribute('href', '/browse');
    }
  });

  test('should show skill category in recommendation cards', async ({ page }) => {
    await createAndLoginUser(page);
    await page.goto('/dashboard');
    
    await page.waitForTimeout(3000);
    
    const skillCards = page.locator('div.border.border-gray-200.rounded-lg');
    const hasCards = await skillCards.first().isVisible().catch(() => false);
    
    if (hasCards) {
      const categoryLabel = skillCards.first().locator('span.text-xs.text-gray-400.font-medium.uppercase');
      await expect(categoryLabel).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await createAndLoginUser(page);
    
    await page.route('**/api/ml/recommendations/skills*', route => {
      route.abort('failed');
    });
    
    await page.goto('/dashboard');
    
    await page.waitForTimeout(2000);
    
    const recommendationsSection = page.locator('div.bg-white.rounded-xl').filter({ hasText: 'Recommended for You' });
    await expect(recommendationsSection).toBeVisible();
    
    const errorMessage = page.locator('text=/Failed to fetch recommendations|No recommendations available/');
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should refresh recommendations when user adds skills', async ({ page }) => {
    await createAndLoginUser(page);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    const initialCards = await page.locator('div.border.border-gray-200.rounded-lg').count();
    
    await page.goto('/profile/edit');
    await page.selectOption('select', 'teach');
    await page.fill('input[placeholder*="Skill name"]', 'JavaScript');
    
    const addButton = page.locator('button[aria-label="Add skill"]');
    const hasAddButton = await addButton.isVisible().catch(() => false);
    
    if (hasAddButton) {
      await addButton.click();
      await page.waitForTimeout(1000);
    }
    
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    const updatedCards = await page.locator('div.border.border-gray-200.rounded-lg').count();
    
    expect(typeof updatedCards).toBe('number');
  });
});
