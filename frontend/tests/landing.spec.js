import { test, expect } from '@playwright/test';

test('landing page renders correctly', async ({ page }) => {
  await page.goto('/');

  // Check Hero Text
  await expect(page.getByText('Master New Skills,')).toBeVisible();
  await expect(page.getByText('Share Your Passion')).toBeVisible();

  // Check Buttons
  const getStartedBtn = page.locator('main').getByRole('link', { name: 'Get Started Free' });
  await expect(getStartedBtn).toBeVisible();
  await expect(getStartedBtn).toHaveAttribute('href', '/signup');

  const loginBtn = page.locator('main').getByRole('link', { name: 'Log In' });
  await expect(loginBtn).toBeVisible();
  await expect(loginBtn).toHaveAttribute('href', '/login');

  // Check Features
  await expect(page.getByText('Why Choose SkillSwap?')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Expert Mentors' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Easy Scheduling' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Credit System' })).toBeVisible();

  // Check How It Works
  await expect(page.getByText('How It Works')).toBeVisible();
  await expect(page.getByText('Create Profile')).toBeVisible();
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  
  await page.locator('main').getByRole('link', { name: 'Get Started Free' }).click();
  await expect(page).toHaveURL(/.*\/signup/);
  
  await page.goto('/');
  await page.locator('main').getByRole('link', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/.*\/login/);
});
