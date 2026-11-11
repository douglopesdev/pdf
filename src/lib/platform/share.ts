// Compartilhar pelo Android (Web Share API). O download é um <a download> comum.

export function pdfFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: 'application/pdf' });
}

/** O botão Compartilhar só aparece quando o navegador aceita arquivos. */
export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Devolve false quando o compartilhamento falhou; fechar a folha não é erro. */
export async function shareFile(file: File): Promise<boolean> {
  try {
    await navigator.share({ files: [file], title: file.name });
    return true;
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
