import pixelmatch from "pixelmatch";
import sharp from "sharp";
import { PNG } from "pngjs";

export interface PixelDiffResult {
  diffRate: number;
  pixelScore: number;
  diffPngBuffer: Buffer;
  width: number;
  height: number;
}

/** imgBufferA = 设计稿，对比画布尺寸固定为设计稿宽高；实现稿缩放到同一尺寸 */
export async function computePixelDiff(
  imgBufferA: Buffer,
  imgBufferB: Buffer,
  threshold = 0.1
): Promise<PixelDiffResult> {
  const metaA = await sharp(imgBufferA).metadata();

  const width = metaA.width ?? 0;
  const height = metaA.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error("设计稿尺寸无效，无法进行对比");
  }

  const rawA = await sharp(imgBufferA)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const rawB = await sharp(imgBufferB)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const diffPng = new PNG({ width, height });
  const numDiff = pixelmatch(
    new Uint8Array(rawA),
    new Uint8Array(rawB),
    new Uint8Array(diffPng.data.buffer, diffPng.data.byteOffset, diffPng.data.byteLength),
    width,
    height,
    { threshold, includeAA: true, diffColor: [255, 70, 70], alpha: 0.3 }
  );

  const totalPixels = width * height;
  const diffRate = numDiff / totalPixels;
  const pixelScore = (1 - diffRate) * 100;

  const diffPngBuffer = PNG.sync.write(diffPng);

  return { diffRate, pixelScore, diffPngBuffer, width, height };
}
