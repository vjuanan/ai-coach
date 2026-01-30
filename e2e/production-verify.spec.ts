import { test, expect } from '@playwright/test';

test.describe('Production Verification: Athletes & Gyms', () => {

    test('Create Athlete and Program', async ({ page }) => {
        console.log('Navigating to /athletes...');
        await page.goto('/athletes');

        // Open Modal
        // Try the explicit "Añadir Atleta" button first (top right)
        // From screenshot: It's a button with + icon and text "Añadir Atleta"
        const addBtn = page.getByRole('button', { name: 'Añadir Atleta' });
        if (await addBtn.isVisible()) {
            await addBtn.click();
        } else {
            // Fallback to Global + button
            await page.locator('button.cv-btn-primary').filter({ hasText: '+' }).click();
            await page.getByText('Nuevo Atleta').click();
        }

        // Fill Form
        // From screenshot: Placeholder is 'John Doe'
        await page.getByPlaceholder('John Doe').fill('Test Athlete Auto');
        // Placeholder is 'john@example.com'
        await page.getByPlaceholder('john@example.com').fill('auto@test.com');

        // Submit (Save)
        // In athletes/page.tsx, button says "Guardar"
        // From generic screenshot inspection
        await page.getByRole('button', { name: 'Guardar', exact: true }).click();

        // Verify
        await expect(page.getByText('Test Athlete Auto')).toBeVisible({ timeout: 15000 });
        // await page.screenshot({ path: 'e2e-screenshots/success-1-athlete.png' });

        // Create Program
        await page.goto('/programs');
        // Click Global + > New Program
        await page.locator('button.cv-btn-primary').filter({ hasText: '+' }).click();
        await page.getByText('Nuevo Programa').click();

        // Fill Program
        // Assuming the placeholder is 'Nuevo Programa' or input[name="name"]
        await page.fill('input[name="name"]', 'Rutina Test Atleta');

        // Select Client (React select or custom)
        // Try clicking body to close any dropdowns first
        await page.mouse.click(0, 0);

        // The modal likely has a Select for "Asignar a...". 
        // We'll target the combobox.
        const comboBox = page.getByRole('combobox').first();
        if (await comboBox.isVisible()) {
            await comboBox.click();
            await page.keyboard.type('Test Athlete Auto');
            await page.keyboard.press('Enter');
        }

        // Save
        // Button is "Crear Programa" or "Guardar Programa"
        const saveProgBtn = page.getByRole('button', { name: /Crear|Guardar/i }).last();
        await saveProgBtn.click();

        // Verify
        await expect(page).toHaveURL(/\/editor\/.*/, { timeout: 15000 });
        await page.screenshot({ path: 'e2e-screenshots/success-2-program-athlete.png' });
    });

    test('Create Gym and Program', async ({ page }) => {
        console.log('Navigating to /gyms...');
        await page.goto('/gyms');

        // Main Create Button
        const addBtn = page.getByRole('button', { name: 'Añadir Gimnasio' });
        if (await addBtn.isVisible()) {
            await addBtn.click();
        } else {
            await page.locator('button.cv-btn-primary').filter({ hasText: '+' }).click();
            await page.getByText('Nuevo Gimnasio').click();
        }

        // Fill (Modal is "Nuevo Gimnasio / Cliente B2B")
        // Placeholder from screenshot: "CrossFit Downtown"
        await page.getByPlaceholder('CrossFit Downtown').fill('Test Gym Auto');

        // Save - Button says "+ Guardar Gimnasio"
        await page.getByRole('button', { name: 'Guardar Gimnasio' }).click();

        // Verify
        await expect(page.getByText('Test Gym Auto')).toBeVisible({ timeout: 15000 });
        await page.screenshot({ path: 'e2e-screenshots/success-3-gym.png' });

        // Program
        await page.goto('/programs');
        await page.locator('button.cv-btn-primary').filter({ hasText: '+' }).click();
        await page.getByText('Nuevo Programa').click();

        await page.fill('input[name="name"]', 'Rutina Test Gym');

        const comboBox = page.getByRole('combobox').first();
        if (await comboBox.isVisible()) {
            await comboBox.click();
            await page.keyboard.type('Test Gym Auto');
            await page.keyboard.press('Enter');
        }

        const saveProgBtn = page.getByRole('button', { name: /Crear|Guardar/i }).last();
        await saveProgBtn.click();

        await expect(page).toHaveURL(/\/editor\/.*/, { timeout: 15000 });
        await page.screenshot({ path: 'e2e-screenshots/success-4-program-gym.png' });
    });

});
