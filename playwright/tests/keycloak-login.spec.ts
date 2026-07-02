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

const loginVariants: LoginVariant[] = [
  {
    label: 'Admin',
    username: process.env.PLAYWRIGHT_ADMIN_USERNAME ?? 'admin@example.de',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? '123',
    roleText: /Du bist als Admin eingeloggt/i,
    roleLink: /Admin-Bereich/i,
    rolePath: '/admin',
    roleHeading: /Admin Cockpit/i,
  },
  {
    label: 'Führungskraft',
    username: process.env.PLAYWRIGHT_FUEHRUNGSKRAFT_USERNAME ?? 'fuehrungskraft@example.de',
    password: process.env.PLAYWRIGHT_FUEHRUNGSKRAFT_PASSWORD ?? '123',
    roleText: /Du bist als Führungskraft eingeloggt/i,
    roleLink: /Führungskraft-Bereich/i,
    rolePath: '/fuehrungskraft',
    roleHeading: /Führungskraft Cockpit/i,
  },
  {
    label: 'Angestellter',
    username: process.env.PLAYWRIGHT_ANGESTELLTER_USERNAME ?? 'angestellter@example.de',
    password: process.env.PLAYWRIGHT_ANGESTELLTER_PASSWORD ?? '123',
    roleText: /Du bist als Angestellte:r eingeloggt/i,
    roleLink: /Angestellte-Bereich/i,
    rolePath: '/angestellter',
    roleHeading: /Angestellte Arbeitsplatz/i,
  },
  {
    label: 'Kunde',
    username: process.env.PLAYWRIGHT_KUNDE_USERNAME ?? 'kunde@example.de',
    password: process.env.PLAYWRIGHT_KUNDE_PASSWORD ?? '123',
    roleText: /Du bist als Kund:in eingeloggt/i,
    roleLink: /Kund:innen-Bereich/i,
    rolePath: '/kunde',
    roleHeading: /Kund:innen Portal/i,
  },
];

async function loginViaKeycloak(page: Page, user: LoginVariant): Promise<void> {
  await page.goto('/');

  await expect(page).toHaveURL(/\/auth\/realms\/grooming-manager\/protocol\/openid-connect\/auth/);

  await page.locator('#username').fill(user.username);
  await page.locator('#password').fill(user.password);
  await page.locator('#kc-login').click();
}

test.describe('Keycloak Login-Varianten', () => {
  for (const user of loginVariants) {
    test(`${user.label} kann sich über Keycloak anmelden`, async ({ page }) => {
      await loginViaKeycloak(page, user);

      await expect(page).toHaveURL((url) => url.origin === 'http://localhost:3000' && url.pathname === '/');
      await expect(page.getByRole('heading', { name: /Willkommen im geschützten Arbeitsbereich/i })).toBeVisible();

      await page.getByRole('link', { name: /Zum Dashboard/i }).click();
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
    });
  }
});
