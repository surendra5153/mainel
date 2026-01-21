import { test, expect } from '@playwright/test';

test.describe('Signup Flow E2E Tests', () => {
  const generateUniqueUser = () => {
    const timestamp = Date.now();
    return {
      name: `TestUser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'password123'
    };
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test('should display signup form with all required fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByText('Join the community and start swapping skills today')).toBeVisible();
    
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    await expect(page.locator('main').getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('should successfully register a new user and redirect to home', async ({ page }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
    
    await expect(page.getByText('Account created')).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state during signup', async ({ page }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);

    const submitButton = page.getByRole('button', { name: 'Create account' });
    
    let loadingStateDetected = false;
    page.on('console', msg => {
      if (msg.text().includes('Creating account')) {
        loadingStateDetected = true;
      }
    });

    await submitButton.click();
    
    await page.waitForURL(/\/home/, { timeout: 10000 });
  });

  test('should prevent duplicate email registration', async ({ page, browser }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto('http://localhost:5173/signup');
    
    const duplicateUser = {
      name: `DifferentName${Date.now()}`,
      email: user.email,
      password: 'password123'
    };

    await newPage.fill('input[placeholder="John Doe"]', duplicateUser.name);
    await newPage.fill('input[type="email"]', duplicateUser.email);
    await newPage.fill('input[type="password"]', duplicateUser.password);
    await newPage.click('button[type="submit"]');

    await expect(newPage.getByText(/Email already registered/i)).toBeVisible({ timeout: 5000 });
    
    await expect(newPage).toHaveURL(/.*\/signup/);
    await newPage.close();
    await newContext.close();
  });

  test('should prevent duplicate name registration', async ({ page, browser }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });

    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    await newPage.goto('http://localhost:5173/signup');
    
    const duplicateUser = {
      name: user.name,
      email: `different${Date.now()}@example.com`,
      password: 'password123'
    };

    await newPage.fill('input[placeholder="John Doe"]', duplicateUser.name);
    await newPage.fill('input[type="email"]', duplicateUser.email);
    await newPage.fill('input[type="password"]', duplicateUser.password);
    await newPage.click('button[type="submit"]');

    await expect(newPage.getByText(/Name already taken/i)).toBeVisible({ timeout: 5000 });
    
    await expect(newPage).toHaveURL(/.*\/signup/);
    await newPage.close();
    await newContext.close();
  });

  test('should validate password length (minimum 6 characters)', async ({ page }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', 'short');

    const passwordInput = page.locator('input[type="password"]');
    
    await expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  test('should validate email format', async ({ page }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', user.password);

    const emailInput = page.locator('input[type="email"]');
    
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should require all fields to be filled', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Create account' });
    await submitButton.click();

    const nameInput = page.locator('input[placeholder="John Doe"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should navigate to login page when clicking login link', async ({ page }) => {
    await page.locator('main').getByRole('link', { name: 'Log in' }).click();
    
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display password length hint', async ({ page }) => {
    await expect(page.getByText('Must be at least 6 characters')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.route('**/api/auth/register', route => {
      route.abort('failed');
    });

    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/failed/i)).toBeVisible({ timeout: 5000 });
    
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test('should trim whitespace from name and email', async ({ page }) => {
    const user = generateUniqueUser();

    await page.fill('input[placeholder="John Doe"]', `  ${user.name}  `);
    await page.fill('input[type="email"]', `  ${user.email}  `);
    await page.fill('input[type="password"]', user.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/home/, { timeout: 10000 });
  });

  test('should maintain form state when server returns error', async ({ page }) => {
    await page.route('**/api/auth/register', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server validation error' })
      });
    });

    const user = {
      name: 'TestUser',
      email: 'test@example.com',
      password: 'password123'
    };

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/Server validation error/i)).toBeVisible({ timeout: 5000 });

    const nameValue = await page.locator('input[placeholder="John Doe"]').inputValue();
    const emailValue = await page.locator('input[type="email"]').inputValue();
    const passwordValue = await page.locator('input[type="password"]').inputValue();

    expect(nameValue).toBe(user.name);
    expect(emailValue).toBe(user.email);
    expect(passwordValue).toBe(user.password);
  });
});
