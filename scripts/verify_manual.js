
const { chromium } = require('playwright');

(async () => {
    console.log('Starting verification script...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('https://aicoach.epnstore.com.ar/login');

        console.log('Filling credentials...');
        await page.fill('input[type="email"]', 'vjuanan@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        console.log('Waiting for dashboard...');
        try {
            await page.waitForURL('https://aicoach.epnstore.com.ar/', { timeout: 15000 });
        } catch (e) {
            console.log('URL did not change to root, checking if we are redirected elsewhere or already logged in.');
            console.log('Current URL:', page.url());
        }

        console.log('Navigating to /athletes...');
        await page.goto('https://aicoach.epnstore.com.ar/athletes');

        console.log('Waiting for table...');
        await page.waitForSelector('table', { state: 'visible', timeout: 30000 });
        await page.waitForTimeout(2000);

        const content = await page.content();
        const missingHeaders = [];
        if (!content.includes('Nivel')) missingHeaders.push('Nivel');
        if (!content.includes('Objetivo')) missingHeaders.push('Objetivo');
        if (!content.includes('Datos Físicos')) missingHeaders.push('Datos Físicos');

        if (missingHeaders.length > 0) {
            console.error('FAILED: Missing headers:', missingHeaders.join(', '));
            process.exit(1);
        } else {
            console.log('SUCCESS: All new headers found.');
        }

        console.log('Taking screenshot...');
        await page.screenshot({ path: 'e2e-screenshots/verify-athletes-manual.png', fullPage: true });
        console.log('Screenshot saved to e2e-screenshots/verify-athletes-manual.png');

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
