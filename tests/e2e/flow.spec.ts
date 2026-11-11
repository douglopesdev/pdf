// Fluxo completo: escolher, organizar, ajustar, gerar e baixar.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  TEXT,
  fixturePath,
  generateAndDownload,
  openArrange,
  pageOrientations,
  thumb,
  touchDrag,
} from './helpers';

const t = TEXT['pt-BR'];
test.use({ locale: 'pt-BR' });

// Todas as imagens de teste são deitadas (60 × 40): cada página sai deitada,
// a não ser a que for girada. É assim que os testes conferem a ordem no PDF.
const THREE = ['photo.jpg', 'alpha.png', 'exif-6.jpg'];

test('da galeria ao PDF baixado em três toques', async ({ page }) => {
  await openArrange(page, t, THREE);
  const pdf = await generateAndDownload(page, t);

  expect(pdf.subarray(0, 8).toString('latin1')).toBe('%PDF-1.4');
  expect(pageOrientations(pdf)).toEqual(['landscape', 'landscape', 'landscape']);
  await expect(page.getByText('documento.pdf')).toBeVisible();
  await expect(page.getByText(/^3 páginas · \d+ KB$/)).toBeVisible();
  await expect(page.getByText('Cabe no limite de 2 MB')).toBeVisible();
});

test('girar muda a página para em pé', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: t.rotate(2) }).click();
  expect(pageOrientations(await generateAndDownload(page, t))).toEqual([
    'landscape',
    'portrait',
    'landscape',
  ]);
});

test('remover tira a página e a última volta para a Início', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: t.remove(1) }).click();
  await expect(page.getByText(t.pages(2), { exact: true })).toBeVisible();
  await page.getByRole('button', { name: t.remove(1) }).click();
  await page.getByRole('button', { name: t.remove(1) }).click();
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();
});

test('reordenar com as setas do teclado', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: t.rotate(1) }).click();
  await thumb(page, t, 1).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect(pageOrientations(await generateAndDownload(page, t))).toEqual([
    'landscape',
    'landscape',
    'portrait',
  ]);
});

test('reordenar segurando e arrastando com o dedo', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: t.rotate(1) }).click();
  await touchDrag(page, thumb(page, t, 1), thumb(page, t, 3));
  expect(pageOrientations(await generateAndDownload(page, t))).toEqual([
    'landscape',
    'landscape',
    'portrait',
  ]);
});

test('um toque rápido com arrasto rola a tela e não muda a ordem', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: t.rotate(1) }).click();
  // Sem segurar: o mouse emulado como toque não existe, então usa um deslize curto.
  const box = await thumb(page, t, 1).boundingBox();
  if (!box) throw new Error('miniatura fora da tela');
  const cdp = await page.context().newCDPSession(page);
  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x + 150, y: y + 60 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(pageOrientations(await generateAndDownload(page, t))[0]).toBe('portrait');
});

test('ajustes mudam o PDF, o nome do arquivo e ficam salvos', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: /A4 · Média · margem 1 cm/ }).click();
  const sheet = page.getByRole('dialog', { name: t.optionsTitle });
  await sheet.getByRole('radio', { name: 'Carta' }).click();
  await sheet.getByRole('radio', { name: 'Leve' }).click();
  await sheet.getByRole('switch', { name: /Margem branca/ }).click();
  await sheet.getByLabel('Nome do arquivo').fill('documentos da mãe.pdf');
  await sheet.getByRole('button', { name: t.apply }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: /Carta · Leve · sem margem/ })).toBeVisible();

  const pdf = await generateAndDownload(page, t);
  expect(pdf.toString('latin1')).toContain('/MediaBox [0 0 792 612]');
  await expect(page.getByText('documentos da mãe.pdf')).toBeVisible();

  // Só as opções ficam guardadas; o nome do arquivo e as imagens, não.
  const stored = await page.evaluate(() => localStorage.getItem('pdf.prefs'));
  expect(JSON.parse(stored ?? '{}')).toMatchObject({
    pdf: { pageSize: 'letter', quality: 'low', margin: false, autoOrient: true },
  });
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['pdf.prefs']);
});

test('fechar a folha de ajustes sem aplicar não muda nada', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.getByRole('button', { name: /A4 · Média/ }).click();
  const sheet = page.getByRole('dialog', { name: t.optionsTitle });
  await sheet.getByRole('radio', { name: 'Original' }).click();
  await sheet.getByRole('button', { name: 'Fechar' }).click();
  await expect(page.getByRole('button', { name: /A4 · Média · margem 1 cm/ })).toBeVisible();
});

test('HEIC é pulado com aviso e o resto vira PDF', async ({ page }) => {
  await page.goto('./');
  const heic = Buffer.from('\0\0\0\x18ftypheic\0\0\0\0mif1heic', 'latin1');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles([
      { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: readFileSync(fixturePath('photo.jpg')) },
      { name: 'foto.heic', mimeType: 'image/heic', buffer: heic },
    ]);
  await page.getByRole('button', { name: t.generate }).click();
  await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
  await expect(page.getByText(/^1 página · /)).toBeVisible();
  await expect(page.getByText(/1 imagem ficou de fora.*HEIC/)).toBeVisible();
});

test('só HEIC: avisa e continua na tela Organizar', async ({ page }) => {
  await page.goto('./');
  const heic = Buffer.from('\0\0\0\x18ftypheic\0\0\0\0mif1heic', 'latin1');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'foto.heic', mimeType: 'image/heic', buffer: heic });
  await page.getByRole('button', { name: t.generate }).click();
  await expect(page.getByText(/Fotos HEIC não abrem neste navegador/)).toBeVisible();
  await expect(page.getByRole('heading', { name: t.arrange })).toBeVisible();
});

test('acima de 60 imagens, avisa e fica com as 60 primeiras', async ({ page }) => {
  await page.goto('./');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles(Array.from({ length: 61 }, () => fixturePath('photo.jpg')));
  await expect(page.getByText(t.pages(60), { exact: true })).toBeVisible();
  await expect(page.getByText(/Limite de 60 imagens por PDF/)).toBeVisible();
});

test('"Converter outras imagens" descarta tudo e volta à Início', async ({ page }) => {
  await openArrange(page, t, THREE);
  await generateAndDownload(page, t);
  await page.getByRole('button', { name: t.again }).click();
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();
});

test('o Voltar do telefone volta uma tela, sem sair do app', async ({ page }) => {
  await openArrange(page, t, THREE);
  await page.goBack();
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();

  await page.getByRole('button', { name: t.settings }).click();
  await expect(page.getByRole('heading', { name: t.settings })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/pdf/');
});
