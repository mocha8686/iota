import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'Stinky cheese' }),
	).toBeVisible();
});

test('auth', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Go to app' }).click();
	await page.getByRole('link', { name: 'Login with Test' }).click();

	await expect(page.getByRole('navigation')).toBeVisible();
});
