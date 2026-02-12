import { test, expect } from '@playwright/test';

test('Verify Gym Profile Fix', async ({ page }) => {
    // 1. Go to Login
    await page.goto('http://localhost:3000/login');

    // 2. Fill Credentials
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');

    // 3. Click Login and Wait for URL
    await page.click('button:has-text("Iniciar Sesión")');

    // Check for error alert
    try {
        await expect(page.locator('text=Gimnasios').first()).toBeVisible({ timeout: 10000 });
    } catch (e) {
        // Try to capture any error text on the page
        const bodyText = await page.innerText('body');
        console.log('Login failed. Page text snapshot:', bodyText.substring(0, 500));
        const alert = await page.locator('[role="alert"]').textContent().catch(() => 'No alert found');
        console.log('Login failed. Alert content:', alert);
        throw e;
    }

    // 4. Navigate to Gyms
    await page.goto('http://localhost:3000/gyms');

    // 5. Click on Test Gym (or first gym)
    const viewGymLink = page.locator('a[title="Ver Gimnasio"]').first();
    await viewGymLink.click();

    // 6. Verify Gym Profile Page Loads (Header visible)
    await expect(page.locator('h1')).toBeVisible();

    // 7. Verify "Detalles del Gimnasio" card is present (implies no crash)
    await expect(page.locator('text=Detalles del Gimnasio')).toBeVisible();

    console.log('Gym Profile Verified Successfully!');
});
