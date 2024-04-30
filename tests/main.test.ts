import { test, expect } from '@playwright/test';

test.describe.configure({ retries: 2 });

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Go to app' }).click();
	await page.getByRole('link', { name: 'Login with Test' }).click();
});

test('navigation', async ({ page }) => {
	await expect(page.getByRole('heading', { name: 'Character' })).toBeVisible();
	await page.getByLabel('Name').fill('Bernard');
	await page.getByRole('button', { name: 'Create new character' }).click();
	await expect(page.getByRole('listitem')).toContainText('Bernard');

	await page.getByRole('link', { name: 'Home' }).click();
	await expect.soft(page.getByRole('heading')).toContainText('Welcome');

	await page.getByRole('link', { name: 'Scavenge' }).click();
	await expect.soft(page.getByRole('heading')).toContainText('Scavenge');

	await page.getByRole('link', { name: 'Inventory' }).click();
	await expect.soft(page.getByRole('heading')).toContainText('Inventory');
});
