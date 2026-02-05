import { test, expect } from '@playwright/test';
import path from 'path';

test('Verify PDF Export Alignment', async ({ page }) => {
    // 1. Login
    console.log('Navigating to login...');
    await page.goto('https://aicoach.epnstore.com.ar/login');

    console.log('Filling credentials...');
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('Logging in...');
    await Promise.all([
        page.waitForURL(/.*(dashboard|clients|editor).*/, { timeout: 60000 }),
        page.click('button:has-text("Iniciar Sesión")')
    ]);
    console.log('Logged in. Current URL:', page.url());

    // 2. Go to Editor (Dynamic)
    console.log('Finding first program on dashboard...');
    // Click the first program card/link that looks like an editor link
    const programLink = page.locator('a[href*="/editor/"]').first();
    await expect(programLink).toBeVisible();

    const href = await programLink.getAttribute('href');
    console.log(`Navigating to program: ${href}`);
    await programLink.click();

    // Wait for editor to load
    await page.waitForURL(/.*\/editor\/.*/);

    // 3. Open Export Modal
    console.log('Clicking Export button...');
    // Wait for button to be strictly visible
    const exportBtn = page.getByRole('button', { name: 'Exportar' });
    await exportBtn.waitFor({ state: 'visible', timeout: 30000 });
    await exportBtn.click();

    console.log('Waiting for modal...');
    await page.waitForSelector('text=Vista Previa Exportación');
    // Wait for content to stabilize
    await page.waitForTimeout(2000);

    // 4. Capture Screenshot
    const screenshotPath = path.resolve('/Users/juanan/.gemini/antigravity/brain/afa68cd6-6635-4480-a616-a97f20a74a90/verified_alignment_production.png');
    console.log(`Taking screenshot to: ${screenshotPath}`);

    // Locate the specific modal content to screenshot
    const modalContent = page.locator('.fixed.inset-4.md\\:inset-8');
    await modalContent.screenshot({ path: screenshotPath });

    console.log('Verification Complete.');
});
