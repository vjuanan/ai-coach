const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    const page = await context.newPage();

    console.log('1. Navigating to login...');
    await page.goto('https://aicoach.epnstore.com.ar/auth/signin');
    await page.waitForLoadState('networkidle');

    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'vjuanan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('3. Navigating to programs...');
    await page.goto('https://aicoach.epnstore.com.ar/programs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/verify_1_programs.png', fullPage: false });
    console.log('Screenshot 1: Programs page saved');

    console.log('4. Looking for a program...');
    const programLink = page.locator('a[href*="/editor/"]').first();
    if (await programLink.count() > 0) {
        await programLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: '/tmp/verify_2_editor.png', fullPage: false });
        console.log('Screenshot 2: Editor page saved');

        console.log('5. Opening Block Builder on first day...');
        const addBlockBtn = page.locator('text="+ Añadir Bloque"').first();
        if (await addBlockBtn.count() > 0) {
            await addBlockBtn.click();
            await page.waitForTimeout(2000);

            await page.screenshot({ path: '/tmp/verify_3_block_builder.png', fullPage: false });
            console.log('Screenshot 3: Block Builder opened');

            const progressionToggle = page.locator('text="Progresión"');
            if (await progressionToggle.count() > 0) {
                console.log('✅ Progression toggle FOUND in Block Builder');
            } else {
                console.log('❌ Progression toggle NOT FOUND');
            }
        }

        await page.waitForTimeout(3000);

        console.log('6. Switching to Week 2...');
        const week2Tab = page.locator('text="Semana 2"');
        if (await week2Tab.count() > 0) {
            await week2Tab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: '/tmp/verify_5_week2.png', fullPage: false });
            console.log('Screenshot 5: Week 2 view');
        }

        console.log('7. Switching back to Week 1...');
        const week1Tab = page.locator('text="Semana 1"');
        if (await week1Tab.count() > 0) {
            await week1Tab.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: '/tmp/verify_6_week1_back.png', fullPage: false });
            console.log('Screenshot 6: Week 1 back');
        }
    } else {
        console.log('No programs found!');
        await page.screenshot({ path: '/tmp/verify_error_no_programs.png', fullPage: false });
    }

    console.log('\n✅ Verification complete! Check /tmp/verify_*.png screenshots');
    await browser.close();
})();
