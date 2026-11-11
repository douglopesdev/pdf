// Temas prontos e tema personalizado.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { TEXT, expectFitsScreen, openArrange } from './helpers';

const t = TEXT['pt-BR'];
test.use({ locale: 'pt-BR', colorScheme: 'light' });

async function expectAccessible(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

const background = (page: Page): Promise<string> =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

const READY = [
  { theme: 'pink', label: 'Rosa', bg: 'rgb(255, 245, 248)' },
  { theme: 'blue', label: 'Azul', bg: 'rgb(243, 248, 255)' },
  { theme: 'green', label: 'Verde', bg: 'rgb(243, 250, 245)' },
  { theme: 'purple', label: 'Roxo', bg: 'rgb(248, 245, 255)' },
  { theme: 'orange', label: 'Laranja', bg: 'rgb(255, 248, 241)' },
] as const;

for (const { theme, label, bg } of READY) {
  test(`tema ${label}: todas as telas passam no axe`, async ({ page }) => {
    // Como se o tema já estivesse escolhido antes de abrir o app.
    await page.addInitScript(
      (value) => localStorage.setItem('pdf.prefs', JSON.stringify({ theme: value })),
      theme,
    );
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await background(page)).toBe(bg);
    await expectAccessible(page);

    await page.getByRole('button', { name: t.settings }).click();
    await expect(page.getByRole('radio', { name: label })).toBeChecked();
    await expectAccessible(page);
    await expectFitsScreen(page);
    await page.goBack();

    await openArrange(page, t, ['photo.jpg', 'alpha.png', 'exif-6.jpg']);
    await expectAccessible(page);

    await page.locator('.summary').click();
    const sheet = page.getByRole('dialog', { name: t.optionsTitle });
    await expect(sheet).toBeVisible();
    await page.waitForTimeout(350);
    await expectAccessible(page);
    await sheet.getByRole('button', { name: t.apply }).click();

    await page.getByRole('button', { name: t.generate }).click();
    await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
    await expectAccessible(page);
  });
}

test('trocar de tema vale na hora, na barra de status e no ícone da aba', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: t.settings }).click();
  await expect(page.getByRole('radio')).toHaveCount(12); // 9 temas + 3 idiomas

  await page.getByRole('radio', { name: 'Rosa' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pink');
  expect(await background(page)).toBe('rgb(255, 245, 248)');
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    'content',
    '#fff5f8',
  );
  expect(await page.locator('link[rel="icon"]').getAttribute('href')).toContain(
    encodeURIComponent('fill="#be185d"'),
  );

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'pink');
  expect(await background(page)).toBe('rgb(255, 245, 248)');

  await page.getByRole('button', { name: t.settings }).click();
  await page.getByRole('radio', { name: 'Automático' }).first().click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  expect(await background(page)).toBe('rgb(255, 255, 255)');
});

test('tema personalizado: escolher cores, aviso de contraste e voltar ao padrão', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: t.settings }).click();
  await page.getByRole('radio', { name: 'Azul' }).click();

  // A primeira vez parte das cores do tema que estava na tela.
  await page.getByRole('radio', { name: 'Personalizado' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom');
  await expect(page.locator('input[type=color]')).toHaveCount(12);
  await expect(page.getByLabel('Fundo', { exact: true })).toHaveValue('#f3f8ff');
  await expect(page.getByLabel('Botão', { exact: true })).toHaveValue('#1d4ed8');
  expect(await background(page)).toBe('rgb(243, 248, 255)');
  await expect(page.getByText(/Pouco contraste/)).toBeHidden();
  await expectAccessible(page);
  await expectFitsScreen(page);

  // Cor nova: vale na hora e fica salva.
  await page.getByLabel('Botão', { exact: true }).fill('#008080');
  await page.getByLabel('Texto do botão').fill('#ffffff');
  await page.goBack();
  const button = page.locator('label.btn.primary');
  await expect(button).toHaveCSS('background-color', 'rgb(0, 128, 128)');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom');
  await expect(page.locator('label.btn.primary')).toHaveCSS('background-color', 'rgb(0, 128, 128)');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pdf.prefs') ?? '{}'));
  expect(stored).toMatchObject({ theme: 'custom', custom: { btn: '#008080', bg: '#f3f8ff' } });

  // Fundo escuro com texto escuro: o app avisa, mas não impede.
  await page.getByRole('button', { name: t.settings }).click();
  await page.getByLabel('Fundo', { exact: true }).fill('#102030');
  expect(await background(page)).toBe('rgb(16, 32, 48)');
  await expect(page.getByText(/Pouco contraste: Texto \/ Fundo/)).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'dark',
  );

  await page.getByRole('button', { name: 'Voltar às cores do tema claro' }).click();
  expect(await background(page)).toBe('rgb(255, 255, 255)');
  await expect(page.getByText(/Pouco contraste/)).toBeHidden();
  await expect(page.getByLabel('Botão', { exact: true })).toHaveValue('#0a0a0a');

  // Sair do personalizado tira as cores dele, mas elas continuam guardadas.
  await page.getByLabel('Botão', { exact: true }).fill('#ff00ff');
  await page.getByRole('radio', { name: 'Escuro' }).click();
  expect(await background(page)).toBe('rgb(10, 10, 10)');
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--btn'))).toBe(
    '',
  );
  await page.getByRole('radio', { name: 'Personalizado' }).click();
  await expect(page.getByLabel('Botão', { exact: true })).toHaveValue('#ff00ff');
});

test('o fluxo completo funciona com um tema personalizado escuro', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'pdf.prefs',
      JSON.stringify({
        theme: 'custom',
        custom: {
          bg: '#101820',
          surface: '#1b2733',
          ink: '#f2f5f7',
          muted: '#a9b8c6',
          line: '#2b3a49',
          'line-strong': '#44576a',
          btn: '#fee715',
          'btn-ink': '#101820',
          ok: '#6ee7a0',
          'ok-bg': '#0d3320',
          danger: '#ff8a8a',
          scrim: '#000000',
        },
      }),
    ),
  );
  await openArrange(page, t, ['photo.jpg', 'alpha.png']);
  expect(await background(page)).toBe('rgb(16, 24, 32)');
  await expectAccessible(page);

  await page.locator('.summary').click();
  const sheet = page.getByRole('dialog', { name: t.optionsTitle });
  await expect(sheet).toBeVisible();
  await page.waitForTimeout(350);
  await expectAccessible(page);
  await sheet.getByRole('button', { name: t.apply }).click();

  await page.getByRole('button', { name: t.generate }).click();
  await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
  await expectAccessible(page);
});
