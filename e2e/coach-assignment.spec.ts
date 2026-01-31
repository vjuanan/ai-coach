
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

        // Wait for modal to appear - modal is a fixed div with class 'fixed inset-0'
        // The form is inside a child div with bg-cv-bg-secondary
        await page.waitForSelector('div.fixed.inset-0', { timeout: 5000 });

        // Fill form inputs by type and order
        // 1. Nombre Completo (text input)
        await page.locator('div.fixed input[type="text"]').fill('Coach E2E');
        // 2. Email
        await page.locator('div.fixed input[type="email"]').fill(coachEmail);
        // 3. Password (Optional, but we'll set it)
        await page.locator('div.fixed input[type="password"]').fill(coachPassword);

        // Select Role: Entrenador (coach value)
        await page.locator('div.fixed select').selectOption('coach');

        // Submit
        await page.locator('div.fixed button[type="submit"]').click();

        // Wait for success message
        await expect(page.locator('text=Usuario creado')).toBeVisible({ timeout: 10000 });

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

        // Create Program to onboard coach (triggers ensureCoach)
        console.log('Creating Program to onboard coach...');
        await page.goto('/programs');

        // Look for create button
        const createProgBtn = page.locator('button').filter({ hasText: /Nuevo Programa|Crear Programa/ }).first();
        if (await createProgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await createProgBtn.click();
        } else {
            // Try Global Create button (+ icon)
            const globalCreate = page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first();
            if (await globalCreate.isVisible({ timeout: 3000 }).catch(() => false)) {
                await globalCreate.click();
                // Select Programa option if dropdown appears
                await page.getByText('Programa').click();
            } else {
                console.log('No create button found, trying direct navigation');
                // If can't find button, might already have programs or different UI
            }
        }

        // Wait a moment for any navigation or modal
        await page.waitForTimeout(2000);

        // 6. Logout
        console.log('Logging out Coach...');
        await page.goto('/');
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

        await expect(page.locator('text=Coach asignado correctamente')).toBeVisible({ timeout: 10000 });

        // 9. Screenshot
        await page.screenshot({ path: 'e2e-screenshots/coach_assignment_complete.png', fullPage: true });
        console.log('Test completed successfully!');
    });
});
