
import { test, expect } from '@playwright/test';

test.describe('Coach Assignment E2E', () => {
    test.use({ baseURL: 'https://aicoach.epnstore.com.ar' });

    test('Create Gym, Create Coach, and Assign', async ({ page }) => {
        const coachEmail = `coach_${Date.now()}@test.com`;
        const coachPassword = 'password123';
        const gymName = `Gofit_${Date.now()}`;

        // 1. Login as Admin
        console.log('Navigating to login...');
        await page.goto('/login');
        await page.fill('input[type="email"]', 'vjuanan@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

        // 2. Create Gym
        console.log('Creating Gym:', gymName);
        await page.goto('/gyms/new');
        await page.fill('input[name="name"]', gymName);
        const createGymBtn = page.getByRole('button', { name: 'Guardar Gimnasio Completo' });
        await expect(createGymBtn).toBeVisible();
        await createGymBtn.click();
        await expect(page).toHaveURL(/gyms/, { timeout: 15000 });

        // 3. Create New User (Coach)
        console.log('Creating Coach User:', coachEmail);
        await page.goto('/admin/users');
        const createUserBtn = page.getByRole('button', { name: 'Crear Usuario' });
        await createUserBtn.click();

        // Fill Modal - using nth-child access pattern as labels are not linked
        const inputs = page.locator('div[role="dialog"] input');
        // Name (1st input usually)
        await inputs.nth(0).fill('Coach E2E');
        // Email (2nd input usually)
        await inputs.nth(1).fill(coachEmail);
        // Password (3rd input usually)
        // Wait, check specific type if possible to be safe
        // But assuming generic inputs order matches form logic
        await inputs.nth(2).fill(coachPassword);

        // Select Role: Entrenador
        await page.locator('div[role="dialog"] select').selectOption({ label: 'Entrenador' });

        // Submit
        await page.locator('div[role="dialog"] button[type="submit"]').click();
        // Wait for success
        await expect(page.locator('text=Usuario creado')).toBeVisible();

        // 4. Logout
        console.log('Logging out Admin...');
        await page.locator('header button.rounded-full').last().click();
        await page.getByText('Cerrar Sesión').click();
        await expect(page).toHaveURL(/login/);

        // 5. Login as New Coach and Create Program (To Trigger ensureCoach)
        console.log('Logging in as New Coach...');
        await page.fill('input[type="email"]', coachEmail);
        await page.fill('input[type="password"]', coachPassword);
        await page.click('button[type="submit"]');
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

        // Create Program to onboard coach
        console.log('Creating Program to onboard coach...');
        await page.goto('/programs');

        // Check for "Nuevo Programa" button
        const createProgBtn = page.locator('button').filter({ hasText: /Nuevo Programa|Crear Programa/ }).first();
        if (await createProgBtn.isVisible()) {
            await createProgBtn.click();
            await expect(page).toHaveURL(/editor/, { timeout: 15000 });
        } else {
            // Try Global Create
            const globalCreate = page.getByRole('button', { name: 'Crear' });
            if (await globalCreate.isVisible()) {
                await globalCreate.click();
                await page.getByText('Programa').click();
                await expect(page).toHaveURL(/editor/, { timeout: 15000 });
            } else {
                throw new Error('Could not find create program button');
            }
        }

        // 6. Logout
        console.log('Logging out Coach...');
        await page.goto('/'); // Ensure back on dashboard/app to see header
        await page.locator('header button.rounded-full').last().click();
        await page.getByText('Cerrar Sesión').click();

        // 7. Login as Admin
        console.log('Logging in Admin...');
        await page.fill('input[type="email"]', 'vjuanan@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 8. Assign Gym to Coach
        console.log('Assigning Gym to Coach...');
        await page.goto('/admin/clients');

        const clientRow = page.locator('tr').filter({ hasText: gymName }).first();
        await expect(clientRow).toBeVisible();

        const coachSelect = clientRow.locator('select');
        // Select by Label 'Coach E2E'
        await coachSelect.selectOption({ label: 'Coach E2E' });

        await expect(page.locator('text=Coach asignado correctamente')).toBeVisible();

        // 9. Screenshot
        await page.screenshot({ path: 'e2e-screenshots/coach_assignment_complete.png', fullPage: true });

    });
});
