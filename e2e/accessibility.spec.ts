import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard accessibility, themes, and layout', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start my journey' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo, ready to grow?' })).toBeVisible();
  await page.screenshot({
    path: `playwright-report/dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ html: n.html, reason: n.failureSummary })),
    })),
  ).toEqual([]);
  const navigation = page.getByRole('navigation', {
    name: testInfo.project.name.startsWith('mobile') ? 'Mobile navigation' : 'Main navigation',
  });
  await navigation.getByRole('button', { name: 'Settings', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= visualViewport!.width + 1),
  ).toBe(true);
  await page.getByLabel('Appearance').selectOption('dark');
  await navigation.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.screenshot({
    path: `playwright-report/dashboard-dark-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await expect(page.locator('html')).toHaveClass('dark');
  await page.waitForTimeout(250);
  const dark = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(
    dark.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ html: n.html, reason: n.failureSummary })),
    })),
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
