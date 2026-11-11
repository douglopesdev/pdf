// Cada tela, nas duas línguas e nos dois temas: textos certos, acessibilidade
// (axe, que inclui o contraste AA) e encaixe em telas de 360 a 430 px.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TEXT, expectFitsScreen, openArrange, type Lang } from './helpers';

const IMAGES = ['photo.jpg', 'alpha.png', 'exif-6.jpg', 'gray.jpg', 'progressive.jpg'];

async function expectAccessible(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

const LOCALES: { locale: string; lang: Lang }[] = [
  { locale: 'pt-BR', lang: 'pt-BR' },
  { locale: 'en-US', lang: 'en' },
];

for (const { locale, lang } of LOCALES) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${lang}, tema ${colorScheme}`, () => {
      test.use({ locale, colorScheme });
      const t = TEXT[lang];

      test('todas as telas passam no axe e cabem na tela', async ({ page }) => {
        // Início
        await page.goto('./');
        await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        const background = await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        );
        expect(background).toBe(colorScheme === 'dark' ? 'rgb(10, 10, 10)' : 'rgb(255, 255, 255)');
        await expectAccessible(page);
        await expectFitsScreen(page);

        // Configurações
        await page.getByRole('button', { name: t.settings }).click();
        await expect(page.getByRole('heading', { name: t.settings })).toBeVisible();
        await expectAccessible(page);
        await expectFitsScreen(page);
        await page.goBack();

        // Organizar
        await openArrange(page, t, IMAGES);
        await expectAccessible(page);
        await expectFitsScreen(page);

        // Folha de ajustes
        await page.locator('.summary').click();
        const sheet = page.getByRole('dialog', { name: t.optionsTitle });
        await expect(sheet).toBeVisible();
        // Espera a animação de entrada: o axe mede o contraste com a cor final.
        await page.waitForTimeout(350);
        await expectAccessible(page);
        await sheet.getByRole('button', { name: t.apply }).click();
        await expect(sheet).toBeHidden();

        // Pronto
        await page.getByRole('button', { name: t.generate }).click();
        await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
        await expect(page.getByText(t.pages(IMAGES.length), { exact: false })).toBeVisible();
        await expectAccessible(page);
        await expectFitsScreen(page);
      });
    });
  }
}

test.describe('larguras de tela', () => {
  test.use({ locale: 'pt-BR' });
  const t = TEXT['pt-BR'];

  for (const width of [360, 390, 412, 430]) {
    test(`${width} px: nada cortado nem rolando para o lado`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('./');
      await expectFitsScreen(page);

      await page.getByRole('button', { name: t.settings }).click();
      await expectFitsScreen(page);
      await page.goBack();

      await openArrange(page, t, IMAGES);
      await expectFitsScreen(page);
      // Cinco páginas em duas colunas: três linhas, com a barra de ações fixa embaixo.
      const columns = await page
        .locator('.grid')
        .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length);
      expect(columns).toBe(2);

      await page.locator('.summary').click();
      const sheet = page.getByRole('dialog', { name: t.optionsTitle });
      await expect(sheet).toBeVisible();
      await page.waitForTimeout(350);
      const box = await sheet.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
      // O botão Aplicar precisa estar ao alcance, sem rolar a folha.
      await expect(sheet.getByRole('button', { name: t.apply })).toBeInViewport();
      await sheet.getByRole('button', { name: t.apply }).click();

      await page.getByRole('button', { name: t.generate }).click();
      await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
      await expectFitsScreen(page);
    });
  }
});

test.describe('preferências', () => {
  test.use({ locale: 'pt-BR', colorScheme: 'light' });

  test('tema e idioma escolhidos valem na hora e depois de recarregar', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Configurações' }).click();
    await page.getByRole('radio', { name: 'Escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('radio', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: TEXT.en.homeTitle })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      'rgb(10, 10, 10)',
    );
  });
});
