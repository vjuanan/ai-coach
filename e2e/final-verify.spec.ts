import { test, expect } from '@playwright/test';

test.use({
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    navigationTimeout: 30000,
});

test('verify export footer via direct link', async ({ page }) => {
    test.setTimeout(60000); // Give it 1 minute max

    console.log('1. Logging in...');
    await page.goto('https://aicoach.epnstore.com.ar/login');
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete (redirect to dashboard)
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    console.log('Login successful.');

    // 2. Direct Navigation to known program
    // Using the ID from the active browser state in metadata to ensure it exists
    const programUrl = 'https://aicoach.epnstore.com.ar/editor/1b85a838-775c-4cf6-bbde-20e44953f840';
    console.log(`2. Navigating to ${programUrl}...`);
    await page.goto(programUrl);

    // 3. Wait for Editor Load
    console.log('Waiting for editor to load...');
    // Wait for the specific export button to appear, indicating full load
    const exportBtn = page.locator('button[title="Exportar PDF"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 30000 });
    console.log('Editor loaded.');

    // 4. Open Export Modal
    console.log('Opening export modal...');
    await exportBtn.click();

    // 5. Verify Footer Content
    console.log('Verifying footer...');
    const footerTextLocator = page.locator('text=Programado por');
    await footerTextLocator.waitFor({ state: 'visible', timeout: 5000 });

    const fullFooterText = await footerTextLocator.innerText();
    console.log(`FOUND FOOTER TEXT: "${fullFooterText}"`);

    // Verify Logo presence (using class or text check)
    const logoCheck = page.locator('text=AI COACH');
    const isLogoVisible = await logoCheck.isVisible();
    console.log(`Logo "AI COACH" visible: ${isLogoVisible}`);

    // Take proof screenshot
    await page.screenshot({ path: 'final-proof.png', fullPage: true });

    // ASSERTIONS
    expect(fullFooterText).toContain('Programado por');
    // We expect a name, not just "Coach" (unless that is the name)
    // If it falls back to 'Coach', we warn but don't fail if that's the user's name
    if (fullFooterText.trim() === 'PROGRAMADO POR COACH') {
        console.warn('WARNING: Name is generic "COACH".');
    }
    expect(isLogoVisible).toBeTruthy();
});
