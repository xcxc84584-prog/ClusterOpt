import { test, expect } from '@playwright/test';

test('entry redirect and editor interaction', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/Program\//);
  await expect(page.locator('.brand small')).toContainText('0.0.62');
  await page.locator('#menuBtn').click();
  await page.locator('[data-action="new"]').click();
  await expect(page.locator('#editorPane')).toBeVisible();
  await page.locator('#editor').fill('const testValue = 42;\nconsole.log(testValue);');
  await expect(page.locator('#editor')).toHaveValue(/testValue/);
  await page.screenshot({ path: 'test-results/editor.png', fullPage: true });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('explorer opens and closes', async ({ page }) => {
  await page.goto('/Program/');
  await page.locator('#explorerToggle').click();
  await expect(page.locator('#explorerPanel')).toBeVisible();
  await page.locator('#explorerClose').click();
  await expect(page.locator('#explorerPanel')).toBeHidden();
});
