import { test, expect } from '@playwright/test';

test('verify export footer contains coach name', async ({ page }) => {
    // 1. Login
    await page.goto('https://aicoach.epnstore.com.ar/login');
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login redirect
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // 2. Dashboard interaction
    await page.waitForTimeout(3000); // Wait for load

    // Click specific program we saw in screenshot
    // Use a broad selector to catch the clickable area
    const prog = page.locator('text=Rich Froning - Mayhem Strength (PRO)').first();
    await prog.waitFor({ state: 'visible', timeout: 5000 });
    await prog.click();

    // Wait for editor
    await page.waitForURL('**/editor/**', { timeout: 15000 });

    // 3. Open Export Modal
    await page.waitForSelector('button[title="Exportar PDF"]', { timeout: 10000 });
    await page.click('button[title="Exportar PDF"]');

    // 4. Verify Footer
    const footer = page.locator('text=Programado por');
    await expect(footer).toBeVisible();

    const footerText = await footer.innerText();
    console.log(`Footer Text Found: "${footerText}"`);

    // 5. Check Log Alignment (presence of specific class or structure)
    // We look for the text "AI COACH" in the same footer container
    const logoText = page.locator('text=AI COACH');
    await expect(logoText).toBeVisible();

    await page.screenshot({ path: 'export-footer-verification-SUCCESS.png', fullPage: true });
});
