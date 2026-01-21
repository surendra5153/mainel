import { test, expect } from '@playwright/test';

test.describe('Mentorship Request Flow', () => {
  let mentorEmail, mentorName, mentorPassword;
  let learnerEmail, learnerName, learnerPassword;
  let mentorId;

  test.beforeAll(async () => {
    const uniqueId = Date.now();
    mentorName = `Mentor ${uniqueId}`;
    mentorEmail = `mentor${uniqueId}@example.com`;
    mentorPassword = 'password123';
    
    learnerName = `Learner ${uniqueId}`;
    learnerEmail = `learner${uniqueId}@example.com`;
    learnerPassword = 'password123';
  });

  test('should allow learner to request a session and mentor to accept it', async ({ page, request }) => {
    test.setTimeout(60000);
    // 1. Register Mentor
    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', mentorName);
    await page.fill('input[type="email"]', mentorEmail);
    await page.fill('input[type="password"]', mentorPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
    
    // Get Mentor ID from API or Profile
    // We can get it by intercepting the /api/auth/me call or just by visiting profile
    const meRes = await request.get('http://localhost:5000/api/auth/me', {
      headers: {
        // We need the cookie, but Playwright request context is separate from page context usually unless shared.
        // Easier way: Use the page to get the ID from the UI or local storage if stored.
        // Or just use the page to add a skill.
      }
    });
    
    // Add a skill as Mentor
    await page.goto('/profile/edit');
    await page.selectOption('select', 'teach'); // Select "I can teach..."
    await page.fill('input[placeholder*="Skill name"]', 'Advanced React');
    await page.click('button[aria-label="Add skill"]');
    await expect(page.getByText('Advanced React')).toBeVisible();
    
    // Logout Mentor
    await page.click('button:has-text("' + mentorName + '")');
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/\/login/);

    // 2. Register Learner
    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', learnerName);
    await page.fill('input[type="email"]', learnerEmail);
    await page.fill('input[type="password"]', learnerPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);

    // 3. Find Mentor
    await page.goto('/mentors');
    await page.fill('input[placeholder*="Search by skill"]', 'Advanced React');
    await page.waitForTimeout(1000); // Wait for search
    
    // Click "View Profile" on the mentor card
    // Since we just created them, they should be there.
    // We might need to be careful if there are many mentors.
    // Let's try to find by text.
    const mentorCard = page.locator('.group.card').filter({ hasText: mentorName }).first();
    await expect(mentorCard).toBeVisible();
    await mentorCard.getByRole('link', { name: 'View Profile' }).click();
    
    // 4. Request Session
    // Use the new "Request Mentorship" button
    await page.click('button:has-text("Request Mentorship")');
    
    // Fill Scheduler
    await expect(page.getByText('Schedule Session: General Mentorship')).toBeVisible();
    
    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Click the "Request Session" button inside the modal
    // The modal has a class 'fixed inset-0'
    await page.locator('.fixed').getByRole('button', { name: 'Request Session' }).click();
    
    // Verify redirect to Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Your Sessions' })).toBeVisible();
    await expect(page.getByText('General Mentorship')).toBeVisible();
    // Check for status badge specifically (using the yellow background class for pending)
    await expect(page.locator('.bg-yellow-100')).toContainText('Pending');
    
    // Logout Learner
    await page.click('button:has-text("' + learnerName + '")');
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/\/login/);
    
    // 5. Mentor Logs in
    await page.fill('input[placeholder="Enter your email"]', mentorEmail); // Login page uses email or username
    await page.fill('input[type="password"]', mentorPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/home/);
    
    // 6. Mentor Accepts Request
    await page.goto('/profile');
    await expect(page.getByText('Incoming Requests')).toBeVisible();
    await expect(page.getByText(learnerName)).toBeVisible();
    
    await page.click('button:has-text("Accept")');
    
    // Verify status change
    await expect(page.getByText('Active Sessions')).toBeVisible();
    // The request should move from Incoming to Active
    // We might need to reload or wait for state update
    await page.reload();
    await expect(page.getByText('Active Sessions')).toBeVisible();
    await expect(page.locator('.bg-purple-50').getByText(learnerName)).toBeVisible();
  });
});
