import { expect, test, type Page } from '@playwright/test';
async function onboard(page: Page) {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Hallo, future German speaker.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start my journey' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo, ready to grow?' })).toBeVisible();
}
async function nav(page: Page, label: string) {
  const desktop = page.getByRole('navigation', { name: 'Main navigation' });
  const root = (await desktop.isVisible())
    ? desktop
    : page.getByRole('navigation', { name: 'Mobile navigation' });
  await root.getByRole('button', { name: label, exact: true }).click();
}
async function active(page: Page) {
  return page.evaluate(async () => {
    return await new Promise<{
      question: { answer: string; options: string[] };
      index: number;
      mode: string;
      count: number;
    }>((resolve) => {
      const req = indexedDB.open('DeutschMeister');
      req.onsuccess = () => {
        const db = req.result;
        const read = db.transaction('meta').objectStore('meta').get('session');
        read.onsuccess = () => {
          const s = read.result.value;
          db.close();
          resolve({
            question: s.questions[s.index],
            index: s.index,
            mode: s.mode,
            count: s.questions.length,
          });
        };
      };
    });
  });
}
async function choose(page: Page, correct: boolean) {
  await expect(page.locator('.answer-options button').first()).toBeEnabled();
  const { question } = await active(page);
  const value = correct ? question.answer : question.options.find((v) => v !== question.answer)!;
  await page.locator('.answer-options button').nth(question.options.indexOf(value)).click();
}
test('onboarding, wrong/correct answers, resume, finish, and durable statistics', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await onboard(page);
  await page.getByRole('button', { name: 'Let’s practice', exact: true }).click();
  await expect(page.locator('.quiz-card')).toBeVisible();
  await choose(page, false);
  await expect(page.getByRole('heading', { name: 'A useful learning moment.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();
  await choose(page, true);
  await expect(page.getByRole('heading', { name: 'Richtig! Nicely done.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /Pick up where you left off/ })).toBeVisible();
  await page.getByRole('button', { name: /Pick up where you left off/ }).click();
  await expect(page.getByRole('heading', { name: 'Richtig! Nicely done.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();
  for (let i = 2; i < 10; i++) {
    await choose(page, true);
    await page.getByRole('button', { name: i === 9 ? 'See my results' : 'Next question' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Schön gemacht!' })).toBeVisible();
  await expect(page.getByText('9 of 10 correct', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Back to my dashboard' }).click();
  await expect(page.getByText('10 questions answered', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('10 questions answered', { exact: true })).toBeVisible();
  await nav(page, 'Review');
  await expect(page.getByRole('heading', { name: 'Recent mistakes' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('levels, reference tables, vocabulary reveal and focused genitive override', async ({
  page,
}) => {
  await onboard(page);
  await nav(page, 'Settings');
  await page.getByRole('button', { name: 'B2 Upper-intermediate' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device');
  await page.reload();
  await nav(page, 'Settings');
  await expect(page.getByRole('button', { name: 'B2 Upper-intermediate' })).toHaveClass('selected');
  await page.getByRole('button', { name: 'A1 Beginner' }).click();
  await nav(page, 'Learn');
  await page.getByRole('tab', { name: 'Articles', exact: true }).click();
  await page.getByRole('button', { name: 'Genitive, Masculine: des' }).click();
  await expect(page.getByRole('heading', { name: 'des', exact: true })).toBeVisible();
  await page.getByLabel('Article type').selectOption('indefinite');
  await page.getByRole('button', { name: 'Nominative, Plural: —' }).click();
  await expect(
    page.getByText('German has no plural indefinite article.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Possessives', exact: true }).click();
  await page.getByLabel('Possessor', { exact: true }).selectOption('ihr');
  await expect(page.getByRole('button', { name: 'Dative, Masculine: eurem' })).toBeVisible();
  await page.getByRole('tab', { name: 'Vocabulary', exact: true }).click();
  await page.getByLabel('Find a word').fill('Mädchen');
  await page.getByLabel('Hide articles').check();
  await expect(page.getByRole('heading', { name: '___ Mädchen' })).toBeVisible();
  await page.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(page.getByRole('heading', { name: 'das Mädchen' })).toBeVisible();
  await page.getByRole('tab', { name: 'Articles', exact: true }).click();
  await page.getByLabel('Article type').selectOption('definite');
  await page.getByRole('button', { name: 'Genitive, Masculine: des' }).click();
  await page.getByRole('button', { name: 'Practice genitive' }).click();
  await expect(page.locator('.quiz-card')).toContainText('Genitive');
});
test('backup round trip, reset confirmation, and typed answers', async ({ page }) => {
  await onboard(page);
  await nav(page, 'Settings');
  await page.getByLabel('Prefer typed answers').check();
  await nav(page, 'Practice');
  await page.getByRole('button', { name: 'Start focused practice' }).click();
  const { question } = await active(page);
  await page.getByLabel('Your answer').fill(' ' + question.answer.toUpperCase() + ' ');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('heading', { name: 'Richtig! Nicely done.' })).toBeVisible();
  await page.getByRole('button', { name: 'Save & leave' }).click();
  await nav(page, 'Settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: 'Reset all learning progress' }).click();
  await nav(page, 'Dashboard');
  await expect(page.getByText('1 questions answered', { exact: true })).toBeVisible();
  await nav(page, 'Settings');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Reset all learning progress' }).click();
  await expect(page.locator('.notice[role=status]')).toContainText('Progress reset');
  page.once('dialog', (d) => d.accept());
  await page.getByLabel('Import progress file').setInputFiles(path!);
  await expect(page.locator('.notice[role=status]')).toContainText('restored');
  await nav(page, 'Dashboard');
  await expect(page.getByText('1 questions answered', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Pick up where you left off/ }).click();
  await expect(page.getByRole('heading', { name: 'Richtig! Nicely done.' })).toBeVisible();
});
test('exam defers feedback, and mobile layout stays within viewport', async ({ page }) => {
  await onboard(page);
  await nav(page, 'Practice');
  await page.getByLabel('Session length', { exact: true }).selectOption('5');
  await page
    .locator('.mode-card')
    .filter({ has: page.getByRole('heading', { name: 'Exam mode' }) })
    .getByRole('button')
    .click();
  await choose(page, false);
  await expect(page.getByRole('heading', { name: 'Answer saved' })).toBeVisible();
  await expect(page.getByText('Correct answer:', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next question' }).click();
  for (let i = 1; i < 5; i++) {
    await choose(page, true);
    await page.getByRole('button', { name: i === 4 ? 'See my results' : 'Next question' }).click();
  }
  await expect(page.getByText('4 of 5 correct', { exact: false })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
test('production PWA loads and practices offline at the repository subpath', async ({
  page,
  context,
}) => {
  await onboard(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(manifest).toContain('/deutschmeister/');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hallo, ready to grow?' })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s practice', exact: true }).click();
  await choose(page, true);
  await expect(page.getByRole('heading', { name: 'Richtig! Nicely done.' })).toBeVisible();
  await context.setOffline(false);
});
