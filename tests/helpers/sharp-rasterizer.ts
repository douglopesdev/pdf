// Rasterizador de teste, com o sharp no lugar do OffscreenCanvas. Segue as
// mesmas regras do `rasterize` de src/lib/core/raster.ts: EXIF aplicado, fundo
// branco, primeiro quadro, rotação do usuário e limite do lado maior.
import sharp, { type Sharp } from 'sharp';
import { ImageError } from '../../src/lib/core/errors';
import { QUALITY } from '../../src/lib/core/options';
import type { Rasterizer } from '../../src/lib/core/raster';

/** O sharp não lê BMP: decodifica o de 24 bits sem compressão dos fixtures. */
function decodeBmp(data: Buffer): Sharp {
  const start = data.readUInt32LE(10);
  const width = data.readInt32LE(18);
  const height = data.readInt32LE(22);
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = start + (height - 1 - y) * rowSize + x * 3;
      rgb.set([data[from + 2] ?? 0, data[from + 1] ?? 0, data[from] ?? 0], (y * width + x) * 3);
    }
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } });
}

export const sharpRasterize: Rasterizer = async (source, rotation, quality) => {
  const preset = QUALITY[quality];
  const input = Buffer.from(await source.arrayBuffer());
  try {
    const image =
      input.toString('ascii', 0, 2) === 'BM' ? decodeBmp(input) : sharp(input, { pages: 1 });
    // Duas etapas: o sharp gira depois de redimensionar só se for outro pipeline.
    const upright = await image
      .autoOrient()
      .flatten({ background: 'white' })
      .resize({
        width: preset.maxSide,
        height: preset.maxSide,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    const { data, info } = await sharp(upright)
      .rotate(rotation)
      .jpeg({ quality: Math.round(preset.jpeg * 100) })
      .toBuffer({ resolveWithObject: true });
    return { bytes: new Uint8Array(data), width: info.width, height: info.height };
  } catch {
    throw new ImageError('decode-failed');
  }
};
