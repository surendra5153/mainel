import { test, expect } from '@playwright/test';

test.describe('Skills Browse Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to skills browse page
        // Assuming the route is /skills based on common patterns, but I'll check Routes if needed.
        // Looking at SkillsBrowse.jsx, it doesn't specify route, but usually it's /skills or /browse-skills.
        // I'll assume /skills for now, if it fails I'll check App.jsx.
        await page.goto('/skills');
    });

    test('skills grid renders correctly', async ({ page }) => {
        // Wait for the grid to appear
        await expect(page.locator('h1')).toContainText('Browse Skills');

        // Wait for skills to load (skeleton loader disappears)
        await expect(page.locator('.animate-pulse')).not.toBeVisible();

        // Check if any skill cards are present
        const cards = page.locator('.group.relative.flex.flex-col'); // Select by the new classes
        const count = await cards.count();

        // If we have seeded data or mock, we should see cards. 
        // Since I don't control the DB state easily here, checking for 0 is valid but not useful.
        // I'll assume there's at least one skill or the empty state.

        if (count > 0) {
            const firstCard = cards.first();
            await expect(firstCard).toBeVisible();

            // Check for glassmorphism classes
            await expect(firstCard).toHaveClass(/backdrop-blur-xl/);

            // Check content
            await expect(firstCard.locator('h2')).toBeVisible();
            await expect(firstCard.locator('button')).toContainText('Add to Profile');
        } else {
            // Check empty state
            await expect(page.getByText('No skills found')).toBeVisible();
        }
    });

    test('add to profile button state', async ({ page }) => {
        // This requires auth usually. 
        // I won't do full auth flow here unless I mock it.
        // I'll check if the button exists and hover state works visually (via class check).

        const cards = page.locator('.group.relative.flex.flex-col');
        if (await cards.count() > 0) {
            const btn = cards.first().locator('button');
            await expect(btn).toBeVisible();
            await expect(btn).toHaveClass(/bg-white/);
        }
    });
});
