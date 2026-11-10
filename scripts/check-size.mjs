// Falha o build se o JavaScript inicial passar do limite combinado no plano.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 60;
const dir = join('dist', 'assets');

const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
if (files.length === 0) {
  console.error('Nenhum .js em dist/assets. Rode `pnpm build` antes.');
  process.exit(1);
}

let total = 0;
for (const f of files) {
  const gz = gzipSync(readFileSync(join(dir, f))).length;
  total += gz;
  console.log(`${f.padEnd(40)} ${(gz / 1024).toFixed(1)} KB gzip`);
}

const kb = total / 1024;
console.log(`Total: ${kb.toFixed(1)} KB gzip (limite ${LIMIT_KB} KB)`);
if (kb > LIMIT_KB) {
  console.error(`JavaScript acima do limite de ${LIMIT_KB} KB gzip.`);
  process.exit(1);
}
