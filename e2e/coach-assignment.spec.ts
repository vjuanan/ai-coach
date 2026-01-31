
import { test, expect } from '@playwright/test';

test.describe('Coach Assignment E2E', () => {
    test.use({ baseURL: 'https://aicoach.epnstore.com.ar' });

    test('Create Gym and Assign Coach', async ({ page }) => {
        // 1. Login as Admin
        console.log('Navigating to login...');
        await page.goto('/login');
        await page.fill('input[type="email"]', 'vjuanan@gmail.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).not.toHaveURL(/login/, { timeout: 15000 });

        // 2. Create Gym 'Gofit'
        console.log('Creating Gym Gofit...');
        await page.goto('/gyms/new');

        // Correct selector based on file inspection
        await page.fill('input[name="name"]', 'Gofit');

        // Wait for button to be visible and click
        const createBtn = page.getByRole('button', { name: 'Guardar Gimnasio Completo' });
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        // Wait for redirect to gym page or dashboard
        // It redirects to /gyms after success
        await expect(page).toHaveURL(/gyms/, { timeout: 15000 });
        await expect(page).not.toHaveURL(/new/);

        // 3. Update Pana2 Role to Coach
        console.log('Updating Pana2 role...');
        await page.goto('/admin/users');
        const userRow = page.locator('tr').filter({ hasText: 'Pana2' });
        await expect(userRow).toBeVisible();

        // Find the select in that row
        const roleSelect = userRow.locator('select');
        await roleSelect.selectOption({ label: 'Entrenador' }); // Or value 'coach'

        // Wait a bit for server action to persist
        await page.waitForTimeout(3000);

        // 4. Assign Pana2 to Gofit
        console.log('Assigning Coach to Gym...');
        await page.goto('/admin/clients');

        const clientRow = page.locator('tr').filter({ hasText: 'Gofit' });
        await expect(clientRow).toBeVisible();

        // Find the coach select in that row
        const coachSelect = clientRow.locator('select');

        // Select Pana2
        // We need to know the value or label. Assuming "Pana2" appears in the text
        await coachSelect.selectOption({ label: 'Pana2' });

        // Wait for success message or update
        await expect(page.locator('text=Coach asignado correctamente')).toBeVisible();

        // 5. Screenshot
        await page.screenshot({ path: 'e2e-screenshots/coach_assignment_complete.png', fullPage: true });
    });
});
