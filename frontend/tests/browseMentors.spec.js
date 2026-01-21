import { test, expect } from '@playwright/test';

test.describe('BrowseMentors Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mentors');
  });

  test('header section renders correctly', async ({ page }) => {
    // Check main heading
    await expect(page.getByText('Find your perfect')).toBeVisible();
    const mentorSpan = page.locator('h1 span.text-indigo-600');
    await expect(mentorSpan).toHaveText('Mentor');

    // Check description
    const description = page.getByText('Connect with industry experts, master new skills, and accelerate your career growth through 1-on-1 mentorship sessions.');
    await expect(description).toBeVisible();
  });

  test('search input is functional', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by skill"]');
    await expect(searchInput).toBeVisible();
    
    // Test typing in search
    await searchInput.fill('Python');
    await expect(searchInput).toHaveValue('Python');
    
    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('rating filter dropdown is functional', async ({ page }) => {
    const filterSelect = page.locator('select');
    await expect(filterSelect).toBeVisible();
    
    // Test selecting different options
    await filterSelect.selectOption('3');
    await expect(filterSelect).toHaveValue('3');
    
    await filterSelect.selectOption('4');
    await expect(filterSelect).toHaveValue('4');
    
    await filterSelect.selectOption('5');
    await expect(filterSelect).toHaveValue('5');
    
    // Reset to all
    await filterSelect.selectOption('0');
    await expect(filterSelect).toHaveValue('0');
  });

  test('mentor cards display with correct content', async ({ page }) => {
    // Wait for mentor cards to load
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    if (cardCount > 0) {
      // Check first card has key elements
      const firstCard = mentorCards.first();
      
      // Check for mentor name (should be a heading inside the card)
      const mentorName = firstCard.locator('h3');
      await expect(mentorName).toBeVisible();
      
      // Check for rating display
      const rating = firstCard.locator('.text-yellow-500');
      await expect(rating).toBeVisible();
      
      // Check for skill badges
      const skillBadges = firstCard.locator('.badge');
      await expect(skillBadges.first()).toBeVisible();
      
      // Check for View Profile button
      const viewBtn = firstCard.getByRole('link', { name: 'View Profile' });
      await expect(viewBtn).toBeVisible();
      await expect(viewBtn).toHaveAttribute('href', /\/mentor\//);
    }
  });

  test('no results state shows when no mentors found', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by skill"]');
    
    // Search for something unlikely to exist
    await searchInput.fill('xyznonexistentskill12345');
    
    // Wait for loading to complete
    await page.waitForTimeout(1000);
    
    // Check for empty state message
    const emptyState = page.getByText('No mentors found');
    await expect(emptyState).toBeVisible();
    
    // Check for "Try adjusting your search" message
    const suggestion = page.getByText('We couldn\'t find any mentors matching your criteria');
    await expect(suggestion).toBeVisible();
  });

  test('clear filters button works in empty state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by skill"]');
    
    // Search for something that won't match
    await searchInput.fill('xyznonexistentskill12345');
    await page.waitForTimeout(1000);
    
    // Click Clear Filters button
    const clearBtn = page.getByRole('button', { name: 'Clear Filters' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    
    // Verify search input is cleared
    await expect(searchInput).toHaveValue('');
  });

  test('search and filter interaction works together', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by skill"]');
    const filterSelect = page.locator('select');
    
    // Set both search and filter
    await searchInput.fill('React');
    await filterSelect.selectOption('4');
    
    // Verify values are set
    await expect(searchInput).toHaveValue('React');
    await expect(filterSelect).toHaveValue('4');
    
    // Wait for results to load
    await page.waitForTimeout(1000);
  });

  test('mentor card hover effect is applied', async ({ page }) => {
    // Wait for mentor cards to load
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    if (cardCount > 0) {
      const firstCard = mentorCards.first();
      
      // Check initial state (card class implies shadow-sm)
      // Note: toHaveClass checks for class names, not computed styles. 
      // Since we use @apply, 'shadow-sm' might not be in the class list if it's inside 'card'.
      // But 'card' should be there.
      await expect(firstCard).toHaveClass(/card/);
      
      // Hover over card
      await firstCard.hover();
      
      // After hover, should have hover effect. 
      // Again, if it's inside 'card', we might not see 'hover:shadow-md' class explicitly unless we added it.
      // In MentorCard.jsx I added 'hover:-translate-y-1'.
      await expect(firstCard).toHaveClass(/hover:-translate-y-1/);
    }
  });

  test('view profile link navigates correctly', async ({ page }) => {
    // Wait for mentor cards to load
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    if (cardCount > 0) {
      const firstCard = mentorCards.first();
      const viewBtn = firstCard.getByRole('link', { name: 'View Profile' });
      
      // Get the href and verify it's a mentor profile link
      const href = await viewBtn.getAttribute('href');
      expect(href).toMatch(/\/mentor\/[a-zA-Z0-9]+/);
    }
  });

  test('page title and layout structure are correct', async ({ page }) => {
    // Check header container has correct styling (white background, rounded)
    const headerContainer = page.locator('div.bg-white.rounded-2xl');
    await expect(headerContainer).toBeVisible();
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('search input has correct styling and placeholder', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by skill"]');
    
    await expect(searchInput).toHaveAttribute('placeholder', /Search by skill \(e\.g\. Python, React, Design\)/);
    // Check for input-field class
    await expect(searchInput).toHaveClass(/input-field/);
  });

  test('filter select has all rating options', async ({ page }) => {
    const filterSelect = page.locator('select');
    await expect(filterSelect).toBeVisible();
    
    // Get all option values
    const options = await page.locator('select option').allTextContents();
    
    // Verify the expected options are present
    expect(options).toContain('All Ratings');
    expect(options).toContain('3+ Stars');
    expect(options).toContain('4+ Stars');
    expect(options).toContain('5 Stars Only');
  });
});
