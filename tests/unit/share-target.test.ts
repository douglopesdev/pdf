import { describe, expect, it } from 'vitest';
import { SHARE_FIELD, sharedFiles } from '../../src/lib/platform/share-target';

describe('sharedFiles', () => {
  it('devolve os arquivos do campo images, na ordem', () => {
    const form = new FormData();
    form.append(SHARE_FIELD, new File(['a'], '1.jpg', { type: 'image/jpeg' }));
    form.append(SHARE_FIELD, new File(['bb'], '2.png', { type: 'image/png' }));
    expect(sharedFiles(form).map((f) => f.name)).toEqual(['1.jpg', '2.png']);
  });

  it('ignora texto, arquivo vazio e outros campos', () => {
    const form = new FormData();
    form.append(SHARE_FIELD, 'um texto compartilhado');
    form.append(SHARE_FIELD, new File([], 'vazio.jpg'));
    form.append('title', 'Fotos');
    form.append('outro', new File(['x'], 'fora.jpg'));
    form.append(SHARE_FIELD, new File(['x'], 'ok.jpg'));
    expect(sharedFiles(form).map((f) => f.name)).toEqual(['ok.jpg']);
  });

  it('devolve lista vazia quando não veio nada', () => {
    expect(sharedFiles(new FormData())).toEqual([]);
  });
});
