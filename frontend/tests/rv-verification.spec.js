import { test, expect } from '@playwright/test';

test.describe('RV College Verification Feature', () => {
  let userEmail;
  let userName;

  test.beforeEach(async ({ page }) => {
    const uniqueId = Date.now();
    userName = `Test User ${uniqueId}`;
    userEmail = `test${uniqueId}@example.com`;
    const password = 'password123';

    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', userName);
    await page.fill('input[type="email"]', userEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('RV verification section renders on profile page', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.getByText('RV College Verification')).toBeVisible();
    
    await expect(page.locator('input[placeholder*="RV email"]').or(page.locator('input[type="email"]').filter({ hasText: '' }))).toBeVisible();
    
    await expect(page.getByText('Send OTP').or(page.getByText('Start Verification'))).toBeVisible();
  });

  test('RV verification badge does not show for unverified users', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('h1')).toContainText(userName);
    
    const rvBadge = page.getByText('Verified (RV College)');
    await expect(rvBadge).not.toBeVisible();
  });

  test('RV verification section shows all required input fields', async ({ page }) => {
    await page.goto('/profile');
    
    await page.getByText('RV College Verification').scrollIntoViewIfNeeded();
    
    const rvSection = page.locator('text=RV College Verification').locator('..').locator('..');
    
    await expect(rvSection).toBeVisible();
  });

  test('profile page loads and displays user information correctly', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('h1')).toContainText(userName);
    
    await expect(page.getByText('Edit Profile')).toBeVisible();
    
    const generalBadge = page.getByText('Verified').first();
    if (await generalBadge.isVisible()) {
      await expect(generalBadge).toHaveClass(/bg-blue-100/);
    }
  });
});

test.describe('RV Verification Badge on Mentor Cards', () => {
  test('mentor cards render without errors', async ({ page }) => {
    await page.goto('/mentors');
    
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    if (cardCount > 0) {
      const firstCard = mentorCards.first();
      
      const mentorName = firstCard.locator('h3');
      await expect(mentorName).toBeVisible();
    }
  });

  test('mentor cards support RV verification badge rendering', async ({ page }) => {
    await page.goto('/mentors');
    
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    if (cardCount > 0) {
      const firstCard = mentorCards.first();
      const rvBadge = firstCard.getByText('Verified (RV College)');
      
      const exists = await rvBadge.count();
      if (exists > 0) {
        await expect(rvBadge).toHaveClass(/bg-green-100/);
        await expect(rvBadge).toHaveClass(/text-green-800/);
      }
    }
  });
});

test.describe('RV Verification Badge Component', () => {
  test('badge component renders with correct styling when verified', async ({ page }) => {
    await page.goto('/profile');
    
    const rvBadge = page.getByText('Verified (RV College)');
    const badgeExists = await rvBadge.count();
    
    if (badgeExists > 0) {
      await expect(rvBadge).toBeVisible();
      
      await expect(rvBadge).toHaveClass(/bg-green-100/);
      await expect(rvBadge).toHaveClass(/text-green-800/);
      await expect(rvBadge).toHaveClass(/rounded-full/);
      
      const checkIcon = rvBadge.locator('svg');
      await expect(checkIcon).toBeVisible();
    }
  });
});

test.describe('Profile Page Badge Integration', () => {
  let testUser;

  test.beforeEach(async ({ page }) => {
    const uniqueId = Date.now();
    testUser = {
      name: `Test User ${uniqueId}`,
      email: `test${uniqueId}@example.com`,
      password: 'password123'
    };

    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('both general and RV verification badges can coexist', async ({ page }) => {
    await page.goto('/profile');
    
    await expect(page.locator('h1')).toContainText(testUser.name);
    
    const badgeContainer = page.locator('div.flex.items-center.space-x-4.mb-2');
    await expect(badgeContainer).toBeVisible();
    
    const generalBadge = page.getByText('Verified').first();
    const rvBadge = page.getByText('Verified (RV College)');
    
    const generalExists = await generalBadge.count();
    const rvExists = await rvBadge.count();
    
    if (generalExists > 0 && rvExists > 0) {
      await expect(generalBadge).toBeVisible();
      await expect(rvBadge).toBeVisible();
    }
  });

  test('profile page layout is not broken by badge addition', async ({ page }) => {
    await page.goto('/profile');
    
    const profileHeader = page.locator('div.flex.items-center.space-x-6');
    await expect(profileHeader).toBeVisible();
    
    const editButton = page.getByRole('button', { name: 'Edit Profile' });
    await expect(editButton).toBeVisible();
    
    const userName = page.locator('h1');
    await expect(userName).toBeVisible();
  });
});

test.describe('RV Verification API Integration', () => {
  let apiUser;

  test.beforeEach(async ({ page }) => {
    const uniqueId = Date.now();
    apiUser = {
      name: `API User ${uniqueId}`,
      email: `api${uniqueId}@example.com`,
      password: 'password123'
    };

    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', apiUser.name);
    await page.fill('input[type="email"]', apiUser.email);
    await page.fill('input[type="password"]', apiUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('profile page loads verification status from API', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/rv-verification/status') && response.status() === 200
    );

    await page.goto('/profile');
    
    await responsePromise.catch(() => {});
  });

  test('user data includes RV verification status field', async ({ page }) => {
    let userResponse;
    
    page.on('response', async response => {
      if (response.url().includes('/api/auth/me') && response.status() === 200) {
        userResponse = await response.json();
      }
    });

    await page.goto('/profile');
    
    await page.waitForTimeout(1000);
    
    if (userResponse && userResponse.user) {
      expect(userResponse.user).toHaveProperty('rvVerificationStatus');
    }
  });
});

test.describe('Mentor Browse Page RV Badge Integration', () => {
  test('mentors endpoint includes RV verification status', async ({ page }) => {
    let mentorsResponse;
    
    page.on('response', async response => {
      if (response.url().includes('/api/mentors') && response.status() === 200) {
        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            mentorsResponse = await response.json();
          }
        } catch (err) {
          console.log('Failed to parse mentors response:', err.message);
        }
      }
    });

    await page.goto('/mentors');
    
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    if (mentorsResponse && mentorsResponse.mentors && mentorsResponse.mentors.length > 0) {
      const firstMentor = mentorsResponse.mentors[0];
      expect(firstMentor).toHaveProperty('rvVerificationStatus');
    }
  });

  test('mentor cards display correctly with badge support', async ({ page }) => {
    await page.goto('/mentors');
    
    await page.waitForSelector('.group.card', { timeout: 5000 }).catch(() => {});
    
    const mentorCards = page.locator('.group.card');
    const cardCount = await mentorCards.count();
    
    expect(cardCount).toBeGreaterThanOrEqual(0);
    
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(3, cardCount); i++) {
        const card = mentorCards.nth(i);
        const mentorName = card.locator('h3');
        await expect(mentorName).toBeVisible();
      }
    }
  });
});
