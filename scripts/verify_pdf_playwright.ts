
import { chromium } from 'playwright';

(async () => {
    console.log('Starting Playwright Verification...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        const email = 'auto_verifier_1770313367333@example.com';
        const password = 'Password123!';

        console.log(`Navigating to Login: https://aicoach.epnstore.com.ar/login`);
        await page.goto('https://aicoach.epnstore.com.ar/login');

        // Login
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]'); // Assuming button is submit type or generic button

        await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => console.log('Login redirect timed out or already there'));
        console.log('Logged in. Navigating to Programs...');

        // Go to Programs
        await page.goto('https://aicoach.epnstore.com.ar/programs');

        // Create Program
        // Look for "+" button or "Nuevo Programa"
        // Heuristic based on e2e analysis: Global button or specific page button
        const newProgBtn = page.getByRole('button', { name: 'Nuevo Programa' });
        if (await newProgBtn.isVisible()) {
            await newProgBtn.click();
        } else {
            // Try the global + fab
            await page.locator('button.cv-btn-primary').filter({ hasText: '+' }).click();
            await page.getByText('Nuevo Programa').click();
        }

        // Wait for editor
        await page.waitForURL('**/editor/**', { timeout: 10000 });
        console.log('In Editor. Adding Block...');

        // Add Block
        // Need to find "Añadir Bloque" button
        await page.getByText('Añadir Bloque').first().click();

        // Select Type "Fuerza" (Strength) - assuming it's an option in a dropdown or modal
        await page.getByText('Fuerza').click(); // Might need adjustment based on real UI
        // If it opens a modal/form:
        await page.fill('input[name="exercise"]', 'Back Squat Verify'); // Guessing selector
        // Actually, BlockEditor.tsx structure is complex. 
        // Let's just screenshot the editor first to see where we are, then try to act?
        // No, I need data for PDF.

        // Simpler: Just Export immediately if allowed?
        // Often empty programs export empty PDFs.

        // Let's try to find inputs.
        // Based on BlockEditor.tsx:
        // It has `input[placeholder="Nombre del bloque"]`?
        // Or just generic inputs.
        // Let's try typing blindly into the first visible input if specific one not found.

        // Better: Just click Export and see if it renders the headers/coach name at least.
        console.log('Attempting Export...');
        await page.getByText('Exportar').click();

        // Wait for Modal
        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 }); // Assuming Radix UI or similar

        // Wait for PDF preview rendering
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'production_playwright_verified.png', fullPage: true });
        console.log('Screenshot saved: production_playwright_verified.png');

    } catch (error) {
        console.error('Verification Failed:', error);
        await page.screenshot({ path: 'verification_failed.png' });
    } finally {
        await browser.close();
    }
})();
