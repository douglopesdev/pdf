// Protótipo do gerador de PDF, validado com `qpdf --check`.
// Material de referência para a Fase 1: portar para TypeScript em
// src/lib/core/pdf-writer.ts, com tipos e testes. Não é importado pelo app.
//
// Entrada: imgs = [{ bytes: Uint8Array (JPEG), w: number, h: number }]
//          size = 'a4' | 'letter' | 'image' (no app final: 'original')
//          margin = pontos de margem (28.35 = 1 cm)
// Saída:   Blob application/pdf, uma página por imagem.

const PAGE = { a4: [595.28, 841.89], letter: [612, 792] };

function buildPdf(imgs, size, margin) {
  var enc = new TextEncoder();
  var chunks = [],
    len = 0,
    offsets = [];
  function push(d) {
    var b = typeof d === 'string' ? enc.encode(d) : d;
    chunks.push(b);
    len += b.length;
  }
  function n2(v) {
    return (Math.round(v * 100) / 100).toString();
  }

  push('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  var total = 3 + imgs.length * 3;
  var kids = imgs
    .map(function (_, i) {
      return 3 + i * 3 + ' 0 R';
    })
    .join(' ');

  offsets[1] = len;
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2] = len;
  push('2 0 obj\n<< /Type /Pages /Kids [' + kids + '] /Count ' + imgs.length + ' >>\nendobj\n');

  imgs.forEach(function (im, i) {
    var pn = 3 + i * 3,
      cn = pn + 1,
      xn = pn + 2;
    var pw, ph;
    if (size === 'image') {
      var k = 842 / Math.max(im.w, im.h);
      pw = im.w * k + margin * 2;
      ph = im.h * k + margin * 2;
    } else {
      var d = PAGE[size];
      if (im.w > im.h) {
        pw = d[1];
        ph = d[0];
      } else {
        pw = d[0];
        ph = d[1];
      }
    }
    var bw = pw - margin * 2,
      bh = ph - margin * 2;
    var sc = Math.min(bw / im.w, bh / im.h);
    var iw = im.w * sc,
      ih = im.h * sc;
    var x = (pw - iw) / 2,
      y = (ph - ih) / 2;

    offsets[pn] = len;
    push(
      pn +
        ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
        n2(pw) +
        ' ' +
        n2(ph) +
        '] ' +
        '/Resources << /XObject << /Im0 ' +
        xn +
        ' 0 R >> >> /Contents ' +
        cn +
        ' 0 R >>\nendobj\n',
    );

    var content = 'q ' + n2(iw) + ' 0 0 ' + n2(ih) + ' ' + n2(x) + ' ' + n2(y) + ' cm /Im0 Do Q\n';
    offsets[cn] = len;
    push(
      cn +
        ' 0 obj\n<< /Length ' +
        enc.encode(content).length +
        ' >>\nstream\n' +
        content +
        'endstream\nendobj\n',
    );

    offsets[xn] = len;
    push(
      xn +
        ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' +
        im.w +
        ' /Height ' +
        im.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
        im.bytes.length +
        ' >>\nstream\n',
    );
    push(im.bytes);
    push('\nendstream\nendobj\n');
  });

  var xrefAt = len;
  var xref = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
  for (var i = 1; i < total; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(xref);
  push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefAt + '\n%%EOF\n');
  return new Blob(chunks, { type: 'application/pdf' });
}

export { buildPdf };
