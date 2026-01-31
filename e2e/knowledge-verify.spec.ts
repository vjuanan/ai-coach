import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Define the artifacts directory
const artifactsDir = '/Users/juanan/.gemini/antigravity/brain/3232c18e-32cd-4588-ac60-2ce5e00229bf';

test('Verify Knowledge Section', async ({ page }) => {
    console.log('🚀 Starting Verification of Knowledge Section...');

    // 1. Navigate to Knowledge Page
    console.log('📍 Navigating to Knowledge page...');
    await page.goto('https://aicoach.epnstore.com.ar/knowledge?v=verify', { waitUntil: 'networkidle' });

    // Verify URL and Title (implicit)
    await expect(page).toHaveURL(/.*knowledge/);

    // Take screenshot of initial load
    const screenshotPath1 = path.join(artifactsDir, 'knowledge_page_full_load.png');
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath1}`);

    // 2. Verify Stats Cards
    console.log('📊 Verifying stats cards...');
    await expect(page.locator('text=Principios')).toBeVisible();
    await expect(page.locator('text=Expertos')).toBeVisible();
    await expect(page.locator('text=Categorías')).toBeVisible();

    // 3. Verify Filters
    console.log('🔍 Verifying filters...');
    await expect(page.locator('select').first()).toBeVisible(); // Objectives filter
    await expect(page.locator('select').nth(1)).toBeVisible(); // Experts filter

    // 4. Verify Content Sections (CrossFit, Strength, Hypertrophy)
    console.log('📑 Verifying content sections...');
    await expect(page.locator('text=CrossFit / Performance Atlética')).toBeVisible();
    await expect(page.locator('text=Fuerza / Powerlifting')).toBeVisible();
    await expect(page.locator('text=Hipertrofia / Estética')).toBeVisible();

    // 5. Expand a Principle Card
    console.log('🖱️ Expanding a principle card...');
    // Find a card that is likely to be there, e.g., "Volume Landmarks"
    const cardTrigger = page.locator('text=Volume Landmarks').first();
    if (await cardTrigger.isVisible()) {
        await cardTrigger.click();
        await page.waitForTimeout(500); // Wait for animation

        // Verify expanded content
        await expect(page.locator('text=Maintenance Volume')).toBeVisible();

        // Screenshot of expanded state
        const screenshotPath2 = path.join(artifactsDir, 'knowledge_card_expanded.png');
        await page.screenshot({ path: screenshotPath2 });
        console.log(`📸 Screenshot saved: ${screenshotPath2}`);
    } else {
        console.log('⚠️ Could not find "Volume Landmarks" card to expand');
    }

    // 6. Verify Methodology Tags
    console.log('🏷️ Verifying tags...');
    await expect(page.locator('text=#volume')).first().toBeVisible();

    console.log('✅ Verification Complete!');
});
