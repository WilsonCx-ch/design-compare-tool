import sharp from "sharp";

export interface SSIMResult {
  ssimScore: number;
  mssim: number;
}

/** imgBufferA = 设计稿，画布尺寸固定为设计稿宽高；实现稿缩放到同一尺寸 */
export async function computeSSIM(
  imgBufferA: Buffer,
  imgBufferB: Buffer
): Promise<SSIMResult> {
  const metaA = await sharp(imgBufferA).metadata();

  const width = metaA.width ?? 0;
  const height = metaA.height ?? 0;
  if (width === 0 || height === 0) {
    throw new Error("设计稿尺寸无效，无法进行对比");
  }

  const grayA = await sharp(imgBufferA)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const grayB = await sharp(imgBufferB)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const { ssim } = await import("ssim.js");

  const imageDataA = {
    data: new Uint8ClampedArray(rgbaFromGray(grayA)),
    width,
    height,
  };
  const imageDataB = {
    data: new Uint8ClampedArray(rgbaFromGray(grayB)),
    width,
    height,
  };

  const result = ssim(imageDataA as unknown as ImageData, imageDataB as unknown as ImageData);
  const mssim = result.mssim;

  return {
    ssimScore: mssim * 100,
    mssim,
  };
}

function rgbaFromGray(grayBuffer: Buffer): ArrayBuffer {
  const pixels = grayBuffer.length;
  const rgba = new Uint8ClampedArray(pixels * 4);
  for (let i = 0; i < pixels; i++) {
    const g = grayBuffer[i];
    rgba[i * 4] = g;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = g;
    rgba[i * 4 + 3] = 255;
  }
  return rgba.buffer;
}
