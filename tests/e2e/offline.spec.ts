// Privacidade e PWA: depois de instalado, o app funciona sem rede e não tenta
// falar com nenhum outro endereço.
import { expect, test, type Page } from '@playwright/test';
import { TEXT, fixturePath, generateAndDownload, openArrange, pageOrientations } from './helpers';

const t = TEXT['pt-BR'];
test.use({ locale: 'pt-BR' });

/** Espera o service worker assumir a página (o que acontece na segunda visita). */
async function installed(page: Page): Promise<void> {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

test('offline: abre, converte e não faz nenhuma requisição para fora', async ({
  page,
  context,
}) => {
  await installed(page);

  const origin = new URL(page.url()).origin;
  const outside: string[] = [];
  const failed: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('blob:') || url.startsWith('data:')) return;
    if (new URL(url).origin !== origin) outside.push(url);
  });
  page.on('requestfailed', (request) => failed.push(request.url()));

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();

  // O fluxo inteiro, com o telefone sem rede: o worker de conversão, as fontes
  // e os ícones vêm todos do cache do service worker.
  await openArrange(page, t, ['photo.jpg', 'alpha.png', 'animated.gif']);
  await page.getByRole('button', { name: t.rotate(1) }).click();
  const pdf = await generateAndDownload(page, t);
  expect(pageOrientations(pdf)).toEqual(['portrait', 'landscape', 'landscape']);

  await page.getByRole('button', { name: t.again }).click();
  await page.getByRole('button', { name: t.settings }).click();
  await expect(page.getByRole('heading', { name: t.settings })).toBeVisible();

  expect(outside).toEqual([]);
  expect(failed).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('700 20px Sora'))).toBe(true);
});

test('a CSP bloqueia requisição para outro endereço', async ({ page }) => {
  await page.goto('./');
  const blocked = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/', { mode: 'no-cors' });
      return false;
    } catch {
      return true;
    }
  });
  expect(blocked).toBe(true);
});

test('nada além das preferências fica guardado no aparelho', async ({ page }) => {
  await installed(page);
  await openArrange(page, t, ['photo.jpg', 'alpha.png']);
  await generateAndDownload(page, t);

  const stored = await page.evaluate(async () => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    databases: (await indexedDB.databases()).map((db) => db.name),
    cached: (
      await Promise.all(
        (await caches.keys()).map(async (name) =>
          (await (await caches.open(name)).keys()).map((r) => r.url),
        ),
      )
    ).flat(),
  }));

  expect(stored.local.filter((key) => key !== 'pdf.prefs')).toEqual([]);
  expect(stored.session).toEqual([]);
  // O Workbox usa um IndexedDB só para controlar a validade do próprio cache.
  expect(stored.databases.filter((name) => !name?.startsWith('workbox'))).toEqual([]);
  // O cache só tem arquivos do app: nenhuma imagem do usuário nem PDF.
  expect(stored.cached.filter((url) => /\.(jpe?g|gif|webp|avif|bmp|pdf)(\?|$)/i.test(url))).toEqual(
    [],
  );
  expect(stored.cached.length).toBeGreaterThan(5);
});

test('manifest instalável, com share target para imagens', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const manifest = await (await request.get(new URL(href ?? '', page.url()).href)).json();

  expect(manifest).toMatchObject({
    name: 'PDF',
    short_name: 'PDF',
    display: 'standalone',
    start_url: '/pdf/',
    scope: '/pdf/',
    share_target: {
      action: '/pdf/share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: { files: [{ name: 'images', accept: ['image/*'] }] },
    },
  });
  const sizes = manifest.icons.map((icon: { sizes: string; purpose?: string }) =>
    icon.purpose ? `${icon.sizes} ${icon.purpose}` : icon.sizes,
  );
  expect(sizes).toEqual(['192x192', '512x512', '512x512 maskable', '512x512 monochrome']);
  for (const icon of manifest.icons as { src: string }[]) {
    const response = await request.get(new URL(icon.src, new URL(href ?? '', page.url())).href);
    expect(response.ok(), icon.src).toBe(true);
  }
});

test('imagens vindas do Compartilhar abrem direto na tela Organizar', async ({ page }) => {
  await installed(page);
  // O mesmo POST que o Android faz ao escolher o app no Compartilhar.
  await page.evaluate(() => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/pdf/share-target';
    form.enctype = 'multipart/form-data';
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'images';
    input.multiple = true;
    input.id = 'share-test';
    form.append(input);
    document.body.append(form);
  });
  await page
    .locator('#share-test')
    .setInputFiles([fixturePath('photo.jpg'), fixturePath('alpha.png')]);
  await page.evaluate(() =>
    document.querySelector<HTMLFormElement>('form[action$="share-target"]')?.submit(),
  );

  await expect(page.getByRole('heading', { name: t.arrange })).toBeVisible();
  await expect(page.getByText(t.pages(2), { exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe('');
});
