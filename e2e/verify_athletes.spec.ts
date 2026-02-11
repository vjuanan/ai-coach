
import { test, expect } from '@playwright/test';

test('verify athletes table', async ({ page }) => {
    // 1. Login
    await page.goto('https://aicoach.epnstore.com.ar/login');
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard (url usually changes to / or /dashboard)
    await page.waitForURL('https://aicoach.epnstore.com.ar/', { timeout: 15000 });

    // 2. Navigate to Athletes
    await page.goto('https://aicoach.epnstore.com.ar/athletes');

    // 3. Wait for table
    await page.waitForSelector('table', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000); // Wait for data to load

    // 4. Check for new headers
    const content = await page.content();
    expect(content).toContain('Nivel');
    expect(content).toContain('Objetivo');
    expect(content).toContain('Datos Físicos');

    // 5. Screenshot
    await page.screenshot({ path: 'e2e-screenshots/verify-athletes-full-table.png', fullPage: true });
});
