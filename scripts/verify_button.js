const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to production...');
    await page.goto('https://aicoach.epnstore.com.ar/editor/9d43b09d-cfbb-4855-a742-a02ab5828f9f', { waitUntil: 'networkidle' });

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Try to find and click a day card
    console.log('Looking for day cards...');
    const dayCard = await page.locator('[data-day-id], .day-card, [class*="day"], button:has-text("Día"), div:has-text("Lunes"), div:has-text("Martes")').first();

    if (await dayCard.count() > 0) {
        console.log('Found day card, clicking...');
        await dayCard.click();
        await page.waitForTimeout(2000);
    }

    // Take screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'verify_button.png', fullPage: false });

    // Look for the button text
    const buttonText = await page.locator('button:has-text("Guardar y Salir"), button:has-text("Listo")').textContent().catch(() => 'Button not found');
    console.log('Button text found:', buttonText);

    await browser.close();
    console.log('Done! Screenshot saved as verify_button.png');
})();
