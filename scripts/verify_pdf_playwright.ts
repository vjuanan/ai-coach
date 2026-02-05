
import { chromium } from 'playwright';

(async () => {
    console.log('Starting Playwright Verification...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        const email = 'vjuanan@gmail.com';
        const password = 'password123';

        console.log(`Navigating to Login: https://aicoach.epnstore.com.ar/login`);
        await page.goto('https://aicoach.epnstore.com.ar/login');

        // Login
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => console.log('Login redirect timed out or already there'));
        console.log('Logged in. Navigating to Programs...');

        // Go to Programs
        await page.goto('https://aicoach.epnstore.com.ar/programs');
        await page.waitForTimeout(2000); // Wait for load

        // Check for existing program cards first
        // Based on screenshot, cards have "Editar" button.
        const editBtn = page.getByText('Editar →').first();

        if (await editBtn.isVisible()) {
            console.log('Found existing program. Clicking Edit...');
            await editBtn.click();
        } else {
            console.log('No programs found. Looking for Create + button...');
            const headerBtn = page.locator('header button, button.bg-cv-accent').filter({ hasText: '+' }).first();
            if (await headerBtn.isVisible()) {
                await headerBtn.click();
                // Check for dropdown
                const menuOption = page.getByText('Nuevo Programa');
                if (await menuOption.isVisible()) {
                    await menuOption.click();
                }
            } else {
                // Fallback to empty state button
                await page.locator('main button').filter({ hasText: '+' }).first().click();
            }
        }

        // Wait for editor redirect
        console.log('Waiting for editor redirect...');
        await page.waitForURL('**/editor/**', { timeout: 15000 });
        console.log('In Editor.');

        // Click Export
        console.log('Looking for Export button...');
        // Try to be very specific about the export button
        const exportBtn = page.getByText('Exportar').first();
        if (await exportBtn.isVisible()) {
            await exportBtn.click();
        } else {
            // Fallback: wait and try again
            await page.waitForTimeout(2000);
            await page.getByText('Exportar').click();
        }

        // Wait for Modal
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });

        // Wait for PDF preview rendering
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'production_user_verified.png', fullPage: true });
        console.log('Screenshot saved: production_user_verified.png');

    } catch (error) {
        console.error('Verification Failed:', error);
        await page.screenshot({ path: 'verification_failed_retry.png' });
    } finally {
        await browser.close();
    }
})();
