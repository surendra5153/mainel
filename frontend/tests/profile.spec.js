import { test, expect } from '@playwright/test';

test.describe('Profile and Edit Profile Flow', () => {
  let userEmail;
  let userName;

  test.beforeEach(async ({ page }) => {
    // Generate unique user
    const uniqueId = Date.now();
    userName = `Test User ${uniqueId}`;
    userEmail = `test${uniqueId}@example.com`;
    const password = 'password123';

    // Register
    await page.goto('/signup');
    await page.fill('input[placeholder="John Doe"]', userName);
    await page.fill('input[type="email"]', userEmail);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Expect redirect to home or dashboard
    // The signup page redirects to /home on success
    await expect(page).toHaveURL(/\/home/);
  });

  test('should view profile, edit profile, and see updates', async ({ page }) => {
    // Navigate to Profile
    await page.goto('/profile');
    
    // Verify Profile Page loads
    await expect(page.locator('h1')).toContainText(userName);
    // Email is not displayed on public profile, so we skip checking it
    
    // Check Demo Videos section exists (even if empty)
    await expect(page.getByText('Demo Videos')).toBeVisible();

    // Navigate to Edit Profile
    // Assuming there is a link or button to Edit Profile on the Profile page
    // Let's check ProfilePage.jsx to be sure about the selector
    await page.click('text=Edit Profile');
    await expect(page).toHaveURL(/\/profile\/edit/);

    // Update Profile
    const newLocation = 'New York, USA';
    const newBio = 'I am a software engineer testing this app.';
    
    await page.fill('input[placeholder="City, Country"]', newLocation);
    await page.fill('textarea[placeholder="Tell us about yourself..."]', newBio);
    
    // Save
    await page.click('button:has-text("Save Changes")');
    
    // Verify success message (toast)
    await expect(page.getByText('Profile updated successfully')).toBeVisible();

    // Go back to Profile
    // The EditProfile page redirects to /profile on success
    await expect(page).toHaveURL(/\/profile/);
    
    // Verify updates
    await expect(page.getByText(newLocation)).toBeVisible();
    await expect(page.getByText(newBio)).toBeVisible();
  });
});
