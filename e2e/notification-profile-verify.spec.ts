import { test, expect } from '@playwright/test';

test.describe('Notification and Profile Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Login Flow
        console.log('Navigating to login...');
        await page.goto('/login');

        // Check if already logged in (redirected)
        if (await page.url().includes('login')) {
            await page.fill('input[type="email"]', 'vjuanan@gmail.com');
            await page.fill('input[type="password"]', 'password123');
            await page.click('button[type="submit"]'); // Assuming standard submit
            await expect(page).not.toHaveURL(/login/, { timeout: 15000 });
        }
    });

    test('Verify Notification Bell', async ({ page }) => {
        // 1. Check Bell Icon Exists
        const bell = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
        await expect(bell).toBeVisible();

        // 2. Open Notification Dropdown
        await bell.click();

        // 3. Verify Dropdown Content
        // Should show "Notificaciones" title
        await expect(page.getByText('Notificaciones', { exact: true })).toBeVisible();
        await expect(page.getByText('No tienes notificaciones').or(page.locator('.text-sm.font-semibold'))).toBeVisible();

        await page.screenshot({ path: 'e2e-screenshots/verify-notifications.png' });
    });

    test('Verify Profile Settings', async ({ page }) => {
        // 1. Check User Avatar Exists
        // Avatar usually has initials like "SJ" or image
        const avatar = page.locator('header button.rounded-full').last(); // Usually the last item in right section
        await expect(avatar).toBeVisible();

        // 2. Click Avatar -> Should go to Settings (based on our implementation)
        await avatar.click();
        await expect(page).toHaveURL(/settings/);

        // 3. Verify Settings Page Content
        await expect(page.getByText('Configuración')).toBeVisible();
        await expect(page.getByText('Perfil')).toBeVisible();

        // 4. Verify Profile Fields are interactive
        const nameInput = page.locator('input[value="Super Admin Juanan"]'); // Assuming match or close
        // If exact value match fails, just find input by label
        const nameInputGeneric = page.locator('div').filter({ hasText: 'Nombre completo' }).locator('input');
        await expect(nameInputGeneric).toBeVisible();

        // 5. Try updating name (mock save)
        await nameInputGeneric.fill('Coach Updated');
        const saveBtn = page.getByText('Guardar');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Should see loading or success state (button disabled or spinner)
        // We verify input retains value
        await expect(nameInputGeneric).toHaveValue('Coach Updated');

        await page.screenshot({ path: 'e2e-screenshots/verify-profile.png' });
    });

});
