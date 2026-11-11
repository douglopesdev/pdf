import { expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function fixturePath(name: string): string {
  return join(import.meta.dirname, '..', 'fixtures', name);
}

/** Textos da interface usados para achar os elementos, nas duas línguas. */
export const TEXT = {
  'pt-BR': {
    homeTitle: 'Fotos em PDF, em segundos.',
    settings: 'Configurações',
    arrange: 'Organizar',
    generate: 'Gerar PDF',
    optionsTitle: 'Ajustes do PDF',
    apply: 'Aplicar',
    doneTitle: 'PDF pronto',
    save: 'Salvar em Downloads',
    again: 'Converter outras imagens',
    pages: (n: number) => (n === 1 ? '1 página' : `${n} páginas`),
    move: (n: number) => `Página ${n}. Use as setas para mudar a ordem.`,
    rotate: (n: number) => `Girar página ${n}`,
    remove: (n: number) => `Remover página ${n}`,
  },
  en: {
    homeTitle: 'Photos to PDF, in seconds.',
    settings: 'Settings',
    arrange: 'Arrange',
    generate: 'Create PDF',
    optionsTitle: 'PDF settings',
    apply: 'Apply',
    doneTitle: 'PDF ready',
    save: 'Save to Downloads',
    again: 'Convert more images',
    pages: (n: number) => (n === 1 ? '1 page' : `${n} pages`),
    move: (n: number) => `Page ${n}. Use the arrow keys to reorder.`,
    rotate: (n: number) => `Rotate page ${n}`,
    remove: (n: number) => `Remove page ${n}`,
  },
} as const;

export type Lang = keyof typeof TEXT;
export type Texts = (typeof TEXT)[Lang];

/** Escolhe imagens pelo botão da galeria (o primeiro input de arquivo da tela). */
export async function pickImages(page: Page, names: string[]): Promise<void> {
  await page.locator('input[type=file]').first().setInputFiles(names.map(fixturePath));
}

/** Vai da Início até a tela Organizar com as imagens dadas. */
export async function openArrange(page: Page, t: Texts, names: string[]): Promise<void> {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: t.homeTitle })).toBeVisible();
  await pickImages(page, names);
  await expect(page.getByRole('heading', { name: t.arrange })).toBeVisible();
  await expect(page.getByText(t.pages(names.length), { exact: true })).toBeVisible();
}

/** Gera o PDF, espera a tela Pronto e devolve o arquivo baixado. */
export async function generateAndDownload(page: Page, t: Texts): Promise<Buffer> {
  await page.getByRole('button', { name: t.generate }).click();
  await expect(page.getByRole('heading', { name: t.doneTitle })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: t.save }).click(),
  ]);
  return readFileSync(await download.path());
}

/** As caixas de página do PDF, na ordem: 'portrait' ou 'landscape'. */
export function pageOrientations(pdf: Buffer): string[] {
  const text = pdf.toString('latin1');
  return Array.from(text.matchAll(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/g), (match) =>
    Number(match[1]) > Number(match[2]) ? 'landscape' : 'portrait',
  );
}

/** Falha se a página rola para o lado ou se algum controle é menor que 44 px. */
export async function expectFitsScreen(page: Page): Promise<void> {
  const problems = await page.evaluate(() => {
    const found: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth) {
      found.push(`rolagem horizontal: ${root.scrollWidth} > ${root.clientWidth}`);
    }
    const controls = document.querySelectorAll<HTMLElement>(
      'button, a[href], label.btn, [role=radio], [role=switch]',
    );
    for (const control of controls) {
      const rect = control.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const name = (control.getAttribute('aria-label') ?? control.textContent ?? '').trim();
      if (rect.width < 44 || rect.height < 44) {
        found.push(`alvo pequeno (${Math.round(rect.width)}×${Math.round(rect.height)}): ${name}`);
      }
      if (rect.left < 0 || rect.right > root.clientWidth + 0.5) {
        found.push(`cortado na lateral: ${name}`);
      }
    }
    return found;
  });
  expect(problems).toEqual([]);
}

export function thumb(page: Page, t: Texts, n: number): Locator {
  return page.getByRole('button', { name: t.move(n) });
}

/**
 * Segura e arrasta com o dedo, como no telefone: o Playwright não tem gesto de
 * toque longo, então os eventos de toque vão direto pelo protocolo do Chromium.
 */
export async function touchDrag(page: Page, from: Locator, to: Locator): Promise<void> {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error('elemento fora da tela');
  const start = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const end = { x: b.x + b.width / 2, y: b.y + b.height / 2 };

  const cdp = await page.context().newCDPSession(page);
  const touch = (type: string, points: { x: number; y: number }[]) =>
    cdp.send('Input.dispatchTouchEvent', {
      type: type as 'touchStart',
      touchPoints: points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    });

  await touch('touchStart', [start]);
  // Mais que os 280 ms que transformam o toque em arrasto.
  await page.waitForTimeout(450);
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', [
      {
        x: start.x + ((end.x - start.x) * i) / steps,
        y: start.y + ((end.y - start.y) * i) / steps,
      },
    ]);
    await page.waitForTimeout(20);
  }
  await touch('touchEnd', []);
  await cdp.detach();
}
