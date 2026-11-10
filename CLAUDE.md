# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório. Leia inteiro antes de mudar qualquer coisa.

## O projeto

**PDF** é um PWA que transforma fotos e imagens em PDF direto no telefone. É de uso pessoal do Douglas e dos pais dele, em quatro aparelhos Android: dois F8 Ultra, um Galaxy M52 e um Galaxy A26 5G. Os navegadores usados são Chrome e Brave.

- Repositório: https://github.com/douglopesdev/pdf (público)
- Produção: https://douglopesdev.github.io/pdf/ (GitHub Pages, publicado pelo GitHub Actions)
- Pasta local do Douglas: `D:\Projects\Pdf` (Windows, terminal cmd)
- Idioma do Douglas: português do Brasil. Responda em pt-BR.

## Princípios (valem para toda decisão)

1. **Nada sai do aparelho.** Não existe backend. A conversão roda no navegador. Depois de carregado, o app não faz nenhuma requisição de rede. A CSP `default-src 'self'` (injetada no build pelo `vite.config.ts`) garante isso: não a afrouxe.
2. **Nada fica guardado.** Só preferências (tema, idioma e, futuramente, as últimas opções do PDF) vão para o `localStorage`, na chave `pdf.prefs`. Imagens e PDFs nunca são gravados, nem em IndexedDB nem em cache.
3. **Zero anúncios, zero rastreamento, zero CDN.** Sem analytics nem SDK de terceiros. Fontes servidas pelo próprio app (`@fontsource`, só o subconjunto latino).
4. **Abrir, escolher, converter.** No máximo três toques da galeria até o PDF pronto.
5. **Offline.** Depois da primeira visita, abre sem internet (Fase 3).
6. **Bilíngue.** pt-BR é o padrão; inglês automático quando o idioma do telefone começa com `en`.
7. **Claro e escuro.** Segue o sistema, com opção de fixar um dos dois.
8. **Leve.** JS inicial abaixo de 60 KB gzip (`pnpm size` falha acima disso).

## Stack

| Camada               | Escolha                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework            | Svelte 5 com runes (`$state`, `$derived`, `$effect`, `$props`). Nada da sintaxe do Svelte 4 (`export let`, `$:`, stores para estado local)    |
| Linguagem            | TypeScript 6 em modo estrito, com `noUncheckedIndexedAccess`. Não suba para o TS 7: o typescript-eslint e o svelte-check ainda não o suportam |
| Build                | Vite 8, sem SvelteKit. SPA de uma tela, `base: '/pdf/'`                                                                                       |
| PWA (Fase 3)         | `vite-plugin-pwa` com estratégia `injectManifest` (service worker próprio em `src/sw.ts`)                                                     |
| Componentes (Fase 2) | Bits UI: Switch, RadioGroup, ToggleGroup e Dialog. O resto são componentes próprios                                                           |
| Estilo               | CSS puro com os tokens de `src/app.css`. Sem Tailwind nem framework de CSS                                                                    |
| Imagens (Fase 1)     | `createImageBitmap` + `OffscreenCanvas` dentro de um Web Worker                                                                               |
| PDF (Fase 1)         | Gerador próprio em TS, sem dependência. Veja `docs/reference/pdf-writer-prototype.js`                                                         |
| Testes               | Vitest (unidade). Playwright (e2e) entra na Fase 4                                                                                            |
| Qualidade            | svelte-check, ESLint (flat config), Prettier                                                                                                  |
| Gerenciador          | pnpm 10 (`packageManager` no package.json)                                                                                                    |

## Comandos

```bash
pnpm install
pnpm dev          # http://localhost:5173/pdf/
pnpm dev --host   # para abrir no celular pela rede local
pnpm verify       # tudo que o CI roda: check, lint, format:check, test, build, size
```

Antes de cada commit, rode `pnpm format` e depois `pnpm verify`. O CI falha com qualquer aviso do svelte-check (`--fail-on-warnings`) e com arquivo fora do padrão do Prettier.

## Estrutura

```text
src/
├─ app.css                       tokens claro/escuro, reset, tipografia
├─ main.ts                       fontes, CSS, mount
├─ App.svelte                    idioma, tema e (Fase 2) troca de telas
├─ screens/                      uma tela por arquivo
│  └─ Home.svelte                hoje estática, botões desativados
├─ components/                   (Fase 2) Button, PageCard, Segmented, Toast…
├─ sw.ts                         (Fase 3) service worker
└─ lib/
   ├─ core/                      (Fase 1) lógica pura, sem Svelte nem DOM
   │  ├─ pdf-writer.ts           monta o PDF a partir de JPEGs
   │  ├─ jpeg.ts                 lê dimensões e orientação EXIF de um JPEG
   │  ├─ layout.ts               tamanho da página, margem, encaixe da imagem
   │  └─ raster.ts               decodifica, gira e redimensiona (usa OffscreenCanvas)
   ├─ worker/convert.worker.ts   (Fase 1) roda o raster + pdf-writer fora da UI
   ├─ state/
   │  └─ preferences.svelte.ts   tema e idioma; único dado salvo
   ├─ i18n/
   │  ├─ pt-BR.ts                fonte da verdade das chaves; exporta o tipo Messages
   │  ├─ en.ts                   tipado como Messages: faltar chave é erro de compilação
   │  └─ index.ts                resolveLang() e messages()
   └─ platform/                  (Fase 2/3) share, download, share-target
public/
├─ theme-init.js                 aplica o tema salvo antes da primeira pintura
└─ favicon.svg, robots.txt       robots bloqueia indexação (uso pessoal)
tests/unit/                      Vitest; os fixtures de imagem vão em tests/fixtures/
docs/reference/                  material de referência, fora do build e do lint
```

`src/lib/core` não pode importar Svelte, DOM nem nada de `src/screens`. Assim o núcleo é testado isoladamente e pode virar Rust/WASM no futuro sem mexer na interface.

## Convenções

- **Textos de interface** ficam sempre em `src/lib/i18n`. Nunca escreva texto visível direto no componente. Toda chave nova entra em `pt-BR.ts` e `en.ts`; o teste `tests/unit/i18n.test.ts` confere as duas.
- **Cores** só pelos tokens (`var(--bg)`, `var(--ink)`, `var(--btn)`…). Nada de hex no componente. O visual é preto e branco; a única cor semântica é o verde de sucesso (`--ok`, `--ok-bg`).
- **Acessibilidade:** alvo de toque de no mínimo 44 px (`var(--tap)`), `aria-label` em todo botão só com ícone, `<button>` e `<label>` reais, contraste AA nos dois temas, `prefers-reduced-motion` respeitado.
- **Ícones:** SVG inline com `stroke="currentColor"`. Sem emoji e sem biblioteca de ícones.
- **Layout:** mobile first, largura máxima de 520 px centralizada, `env(safe-area-inset-*)` nas bordas. Testar em 360, 390, 412 e 430 px.
- **Estado:** classes com `$state` em arquivos `.svelte.ts` dentro de `src/lib/state`.
- **Sem dependência nova** em tempo de execução sem conversar com o Douglas. Dependência de desenvolvimento pode, se justificar.

## Git e fluxo de trabalho

- `main` recebe mudanças só por PR com o CI verde. Uma branch por fase ou funcionalidade: `feat/fase-1-nucleo`, `fix/exif-rotacao`.
- Commits em português, no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- `.github/workflows/ci.yml` roda em todo PR. `deploy.yml` roda o CI e publica no Pages a cada push na `main`.
- Versão em SemVer. A tag `v1.0.0` sai no fim da Fase 4.

## Situação atual

| Fase                    | Entrega                                                          | Portão                      | Situação                                                                                                 |
| ----------------------- | ---------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0 · Fundação            | Projeto, tokens, fontes, i18n, lint, testes, CI, deploy          | CI verde e site no ar       | PR #1 aberto, CI verde. Falta o Douglas ativar Settings › Pages › Source: GitHub Actions e fazer o merge |
| 1 · Núcleo de conversão | pdf-writer, EXIF, raster no worker, layout                       | 6 formatos geram PDF válido | Próxima                                                                                                  |
| 2 · Interface           | As 6 telas, Bits UI, temas, pt-BR e en                           | Fluxo igual aos mockups     | —                                                                                                        |
| 3 · PWA e Android       | Manifest, service worker, offline, share target, aviso de versão | Instala e abre offline      | —                                                                                                        |
| 4 · Aparelhos e v1.0    | Playwright, Lighthouse, TalkBack, testes nos 4 telefones, tag    | Metas atingidas no A26      | —                                                                                                        |

## Fase 1 · Núcleo de conversão (especificação)

Objetivo: dado uma lista de arquivos de imagem e opções, produzir um `Blob` PDF válido sem travar a interface.

**Opções**

```ts
type PageSize = 'a4' | 'letter' | 'original';
type Quality = 'high' | 'medium' | 'low';
interface PdfOptions {
  pageSize: PageSize; // padrão 'a4'
  quality: Quality; // padrão 'medium'
  margin: boolean; // padrão true = 1 cm (28,35 pt) de cada lado
  autoOrient: boolean; // padrão true = página em pé ou deitada conforme a imagem
}
// Cada página ainda tem rotation: 0 | 90 | 180 | 270, escolhida pelo usuário.
```

| Qualidade | Lado maior (px) | Qualidade JPEG |
| --------- | --------------- | -------------- |
| high      | 3000            | 0,90           |
| medium    | 2000            | 0,78           |
| low       | 1400            | 0,60           |

Tamanhos em pontos: A4 = 595,28 × 841,89 e Carta = 612 × 792. Com `autoOrient`, a página é girada quando a imagem é mais larga que alta. Em `original`, o lado maior da página tem 842 pt, na proporção da imagem, mais a margem. A imagem é encaixada sem distorcer e centralizada na área útil.

**Regras**

- **JPEG sem recompressão:** se o arquivo é JPEG, a rotação final (EXIF + usuário) é 0 e o lado maior já cabe no limite da qualidade, os bytes originais entram direto no PDF (`/DCTDecode`). É mais rápido e não perde qualidade. Caso contrário, decodifica, aplica rotação e redimensionamento no `OffscreenCanvas` e codifica como JPEG.
- **EXIF:** `jpeg.ts` lê a orientação (tag 0x0112, valores 1 a 8) e as dimensões (marcador SOF0/SOF2) sem decodificar a imagem. O `createImageBitmap` já aplica o EXIF por padrão (`imageOrientation: 'from-image'`); não aplique duas vezes. Fixtures com as 8 orientações.
- **Transparência:** PNG, WEBP, GIF e AVIF com alfa recebem fundo branco antes de virar JPEG.
- **GIF:** só o primeiro quadro.
- **HEIC:** não suportado no Chrome/Brave do Android. Rejeitar com erro tipado (o app mostra a mensagem), sem quebrar as outras páginas.
- **Memória:** uma imagem por vez. Liberar cada `ImageBitmap` com `.close()`. Limite de 60 imagens por PDF.
- **Worker:** `convert.worker.ts` recebe `{ files: File[], rotations: number[], options }`, envia `{ type: 'progress', page, total }` a cada página e termina com `{ type: 'done', blob, pages, skipped: number[] }` ou `{ type: 'error', code }`. Precisa aceitar cancelamento.
- **Estrutura do PDF:** PDF 1.4; catálogo, árvore de páginas, e para cada página um objeto Page, um stream de conteúdo (`q w 0 0 h x y cm /Im0 Do Q`) e um XObject de imagem com `/DCTDecode`. Tabela xref com offsets exatos. O protótipo em `docs/reference/pdf-writer-prototype.js` já faz isso e passou no `qpdf --check`: porte para TypeScript em `src/lib/core/pdf-writer.ts`, com tipos e testes.

**Testes (portão da fase)**

- Fixtures em `tests/fixtures/`: JPG, PNG com transparência, WEBP, GIF animado, BMP e AVIF, além de JPGs com as 8 orientações EXIF. Gere com um script em `scripts/` (sharp ou canvas como devDependency) para não versionar binários grandes sem necessidade.
- Unidade: `layout.ts` (A4, Carta, original, margem, retrato/paisagem), `jpeg.ts` (dimensões e orientação), `pdf-writer.ts` (estrutura, xref, número de páginas).
- Validação: um teste que grava o PDF gerado e roda `qpdf --check`. No CI, instale com `sudo apt-get install -y qpdf` no `ci.yml`.
- Partes que dependem de `OffscreenCanvas` podem ser testadas no ambiente `browser` do Vitest ou ficar para o Playwright da Fase 4. Mantenha o máximo possível da lógica em funções puras.

## Fase 2 · Interface (especificação)

As telas seguem os mockups (canvas no claude.ai do Douglas: "PDF · Mockups"). Fluxo:

1. **Início:** "Escolher da galeria" (`<input type="file" accept="image/*" multiple>`) e "Tirar foto" (`capture="environment"`), formatos aceitos, dica do atalho pela galeria e rodapé "Funciona offline". Botão de engrenagem abre as Configurações.
2. **Organizar:** grade de 2 colunas com miniaturas numeradas; cada página tem os botões Girar e Remover; arrastar para reordenar (pointer events, funcionando no toque); botão Adicionar; resumo das opções (abre a folha de ajustes) e "Gerar PDF".
3. **Ajustes (folha inferior, Dialog do Bits UI):** Tamanho (A4 / Carta / Original), Qualidade (Alta / Média / Leve, com legenda), Margem branca (Switch), Girar automático (Switch), Nome do arquivo (padrão `documento`, sufixo `.pdf` fixo) e botão Aplicar. Salve as últimas opções em `pdf.prefs`.
4. **Gerando:** anel de progresso com %, "Página X de Y", aviso de privacidade e botão Cancelar.
5. **Pronto:** nome, número de páginas e tamanho do arquivo; selo verde "Cabe no limite de 2 MB" quando for o caso (senão, sugerir a qualidade Leve); "Compartilhar" (Web Share API com `files`, só aparece se `navigator.canShare({ files })`) e "Salvar em Downloads" (link com `download`); "Converter outras imagens"; aviso de que o app não guarda o PDF.
6. **Configurações:** Tema (Automático / Claro / Escuro), Idioma (Automático / Português (Brasil) / English), card de privacidade e versão.

Ao entrar nesta fase, tire o selo "Em construção" e os `disabled` dos botões da Início.

## Fase 3 · PWA e Android (resumo)

`vite-plugin-pwa` com `injectManifest` e `registerType: 'prompt'` (aviso "Nova versão disponível" com botão Atualizar). Manifest: `name` e `short_name` "PDF", `display: standalone`, `start_url` e `scope` `/pdf/`, cores dos tokens, ícones 192, 512 e maskable. O `share_target` aceita `image/*` via POST `multipart/form-data` em `/pdf/share-target`; o service worker recebe os arquivos e entrega à página por `postMessage`, sem gravar nada em disco. Precache de todo o build, exceto `.woff`, já que basta o `.woff2`.

## Riscos conhecidos

- Pelos relatos, o **Brave** no Android pode instalar o PWA só como atalho, sem o WebAPK que o Chrome cria. Nesse caso, o app não aparece no Compartilhar da galeria. A orientação é instalar pelo Chrome. Confirme na Fase 4.
- Não existe "escolher pasta" no Chrome nem no Brave do Android: o PDF vai para Downloads ou para onde o usuário escolher no Compartilhar.
- Fotos de 50 MP ou mais podem pesar na memória do M52 e do A26: processe uma por vez e redimensione no worker.

## Ambiente do Douglas (Windows)

- O terminal é o **cmd**. Para trocar de unidade, use `cd /d D:\Projects\Pdf`; só `cd D:\...` não troca.
- Ao passar comandos para ele, use a sintaxe do cmd (ou avise quando for PowerShell).
- Ele programa em TypeScript, Svelte, Bits UI e Rust no dia a dia (mantém um CRM e um portal B2B).
