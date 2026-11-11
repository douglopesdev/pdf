// Gera os ícones do PWA em public/icons a partir do mesmo desenho do favicon.
// Rode com `pnpm icons`. Os PNGs ficam versionados.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT = join('public', 'icons');
const INK = '#0a0a0a';
const PAPER = '#ffffff';

/**
 * Folha com o canto dobrado e o visto, em uma grade de 64 × 64.
 * @param {number} radius Raio do fundo (0 = quadrado cheio, para o ícone maskable).
 * @param {number} scale Tamanho do desenho; o maskable precisa caber na área segura.
 */
function svg(radius, scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${radius}" fill="${INK}"/>
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)" fill="none" stroke="${PAPER}"
     stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M36 14H22a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V24z"/>
    <path d="M36 14v10h10"/>
    <path d="M26 35l4 4 8-8"/>
  </g>
</svg>`;
}

/**
 * @param {string} name
 * @param {number} size
 * @param {string} source
 */
async function save(name, size, source) {
  const data = await sharp(Buffer.from(source), { density: 600 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(OUT, name), data);
  console.log(`${name.padEnd(20)} ${data.length} bytes`);
}

mkdirSync(OUT, { recursive: true });
await save('icon-192.png', 192, svg(16, 1));
await save('icon-512.png', 512, svg(16, 1));
// Maskable: fundo até a borda e desenho dentro dos 80% centrais.
await save('maskable-512.png', 512, svg(0, 0.72));
