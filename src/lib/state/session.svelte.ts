// Estado da sessão: tela atual, páginas escolhidas, progresso e PDF pronto.
// Nada daqui é salvo: fechou o app, sumiu.

import { ConvertError } from '../core/errors';
import { MAX_IMAGES, type Quality, type Rotation } from '../core/options';
import { startConversion, type ConvertJob } from '../platform/converter';
import { cleanFileName, DEFAULT_FILE_NAME } from '../text';
import { prefs } from './preferences.svelte';

export type Screen = 'home' | 'arrange' | 'generating' | 'done' | 'settings';

export interface PageItem {
  id: number;
  file: File;
  /** Object URL da miniatura; revogado ao remover a página. */
  url: string;
  rotation: Rotation;
}

export interface PdfResult {
  blob: Blob;
  /** Object URL para o link de download. */
  url: string;
  /** Nome com a extensão `.pdf`. */
  name: string;
  pages: number;
  size: number;
  /** Imagens que ficaram de fora. */
  skipped: number;
  /** Quantas delas eram HEIC. */
  heic: number;
  quality: Quality;
}

export type ToastKind = 'limit' | 'no-images' | 'heic' | 'failed' | 'share-failed';

class Session {
  screen = $state<Screen>('home');
  pages = $state<PageItem[]>([]);
  fileName = $state(DEFAULT_FILE_NAME);
  progress = $state({ page: 0, total: 0 });
  result = $state<PdfResult | null>(null);
  toast = $state<ToastKind | null>(null);

  #nextId = 1;
  #job: ConvertJob | null = null;

  addFiles(files: readonly File[]): void {
    const room = MAX_IMAGES - this.pages.length;
    if (files.length > room) this.toast = 'limit';
    for (const file of files.slice(0, Math.max(0, room))) {
      this.pages.push({
        id: this.#nextId++,
        file,
        url: URL.createObjectURL(file),
        rotation: 0,
      });
    }
    if (this.pages.length > 0) this.screen = 'arrange';
  }

  rotate(id: number): void {
    const page = this.pages.find((p) => p.id === id);
    if (page) page.rotation = ((page.rotation + 90) % 360) as Rotation;
  }

  remove(id: number): void {
    const index = this.pages.findIndex((p) => p.id === id);
    const [page] = index >= 0 ? this.pages.splice(index, 1) : [];
    if (page) URL.revokeObjectURL(page.url);
    if (this.pages.length === 0) this.screen = 'home';
  }

  /** Tira a página de `from` e a coloca em `to`. */
  move(from: number, to: number): void {
    if (from === to || to < 0 || to >= this.pages.length) return;
    const [page] = this.pages.splice(from, 1);
    if (page) this.pages.splice(to, 0, page);
  }

  async generate(): Promise<void> {
    if (this.pages.length === 0 || this.#job) return;
    this.#clearResult();
    const options = { ...prefs.pdf };
    const name = `${cleanFileName(this.fileName)}.pdf`;

    this.progress = { page: 0, total: this.pages.length };
    this.screen = 'generating';
    const job = startConversion(
      {
        files: this.pages.map((p) => p.file),
        rotations: this.pages.map((p) => p.rotation),
        options,
      },
      (page, total) => {
        this.progress = { page, total };
      },
    );
    this.#job = job;

    try {
      const done = await job.result;
      this.result = {
        blob: done.blob,
        url: URL.createObjectURL(done.blob),
        name,
        pages: done.pages,
        size: done.blob.size,
        skipped: done.skipped.length,
        heic: done.failures.filter((f) => f.code === 'heic-unsupported').length,
        quality: options.quality,
      };
      this.screen = 'done';
    } catch (error) {
      const code = error instanceof ConvertError ? error.code : 'unknown';
      if (code !== 'cancelled') {
        const onlyHeic =
          error instanceof ConvertError &&
          error.failures.length > 0 &&
          error.failures.every((f) => f.code === 'heic-unsupported');
        this.toast = code !== 'no-images' ? 'failed' : onlyHeic ? 'heic' : 'no-images';
      }
      this.screen = 'arrange';
    } finally {
      this.#job = null;
    }
  }

  cancel(): void {
    this.#job?.cancel();
  }

  /** Gera de novo com a qualidade Leve, para caber em limites de 2 MB. */
  retryLow(): void {
    prefs.pdf.quality = 'low';
    prefs.save();
    void this.generate();
  }

  /** Descarta tudo e volta ao início. */
  reset(): void {
    this.cancel();
    for (const page of this.pages) URL.revokeObjectURL(page.url);
    this.pages = [];
    this.#clearResult();
    this.fileName = DEFAULT_FILE_NAME;
    this.screen = 'home';
  }

  /** O "voltar" de cada tela (botão do app e do Android). */
  back(): void {
    if (this.screen === 'generating') this.cancel();
    else if (this.screen === 'settings') this.screen = 'home';
    else if (this.screen !== 'home') this.reset();
  }

  #clearResult(): void {
    if (this.result) URL.revokeObjectURL(this.result.url);
    this.result = null;
  }
}

export const session = new Session();
