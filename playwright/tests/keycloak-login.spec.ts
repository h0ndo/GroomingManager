import { expect, type Page, test } from '@playwright/test';

type LoginVariant = {
  label: string;
  username: string;
  password: string;
  roleText: RegExp;
  roleLink: RegExp;
  rolePath: string;
  roleHeading: RegExp;
};

const tokenLeakPattern =
  /tokenResponse|access_token|refresh_token|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i;

const loginVariants: LoginVariant[] = [
  {
    label: 'Admin',
    username: process.env.PLAYWRIGHT_ADMIN_USERNAME ?? 'admin@grooming-manager.local',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? '123',
    roleText: /Du bist als Admin eingeloggt/i,
    roleLink: /Admin-Bereich/i,
    rolePath: '/admin',
    roleHeading: /Admin Cockpit/i,
  },
  {
    label: 'Groomer',
    username: process.env.PLAYWRIGHT_GROOMER_USERNAME ?? 'groomer@grooming-manager.local',
    password: process.env.PLAYWRIGHT_GROOMER_PASSWORD ?? '123',
    roleText: /Du bist als Groomer eingeloggt/i,
    roleLink: /Groomer-Bereich/i,
    rolePath: '/groomer',
    roleHeading: /Groomer Arbeitsplatz/i,
  },
  {
    label: 'Kunde',
    username: process.env.PLAYWRIGHT_KUNDE_USERNAME ?? 'kunde@grooming-manager.local',
    password: process.env.PLAYWRIGHT_KUNDE_PASSWORD ?? '123',
    roleText: /Du bist als Kund:in eingeloggt/i,
    roleLink: /Kund:innen-Bereich/i,
    rolePath: '/kunde',
    roleHeading: /Kund:innen Portal/i,
  },
];

async function loginViaKeycloak(page: Page, user: LoginVariant): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Einloggen/i }).click();

  await expect(page).toHaveURL(/\/auth\/realms\/grooming-manager\/protocol\/openid-connect\/auth/);

  await page.locator('#username').fill(user.username);
  await page.locator('#password').fill(user.password);
  await page.locator('#kc-login').click();
}

test.describe('Keycloak Login-Varianten', () => {
  for (const user of loginVariants) {
    test(`${user.label} kann sich über Keycloak anmelden`, async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', (message) => consoleMessages.push(message.text()));

      await loginViaKeycloak(page, user);

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole('heading', { name: /Willkommen im GroomingManager/i })).toBeVisible();
      await expect(page.getByText(user.roleText)).toBeVisible();
      const logoutButton = page.getByRole('button', { name: /Abmelden/i });
      await expect(logoutButton).toBeVisible();
      await expect(logoutButton).toHaveClass(/p-button/);

      await page.getByRole('link', { name: user.roleLink }).click();
      await expect(page).toHaveURL(new RegExp(`${user.rolePath}$`));
      await expect(page.getByRole('heading', { name: user.roleHeading })).toBeVisible();
      await expect(page.getByRole('link', { name: /Zurück zum Dashboard/i })).toHaveClass(/p-button/);
      expect(consoleMessages.filter((message) => tokenLeakPattern.test(message))).toEqual([]);
    });
  }
});
