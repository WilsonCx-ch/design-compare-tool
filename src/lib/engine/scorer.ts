import type { CompareResult } from "@/types/compare";
import { computePixelDiff } from "./pixelmatch";
import { computeSSIM } from "./ssim";

interface ScorerOptions {
  threshold?: number;
  ssimWeight?: number;
}

export async function runComparison(
  designBuffer: Buffer,
  implBuffer: Buffer,
  options: ScorerOptions = {}
): Promise<CompareResult> {
  const { threshold = 90, ssimWeight = 0.7 } = options;

  const pixelResult = await computePixelDiff(designBuffer, implBuffer);
  let ssimResult;
  try {
    ssimResult = await computeSSIM(designBuffer, implBuffer);
  } catch {
    ssimResult = { ssimScore: pixelResult.pixelScore, mssim: pixelResult.pixelScore / 100 };
  }

  let finalScore =
    ssimResult.ssimScore * ssimWeight +
    pixelResult.pixelScore * (1 - ssimWeight);

  if (pixelResult.diffRate > 0.3) {
    finalScore *= 0.8;
  }

  finalScore = Math.round(finalScore * 100) / 100;

  const status = finalScore >= threshold ? "PASS" : "FAIL";

  const diffImageBase64 = pixelResult.diffPngBuffer.toString("base64");

  return {
    finalScore,
    status,
    threshold,
    subScores: {
      ssimScore: Math.round(ssimResult.ssimScore * 100) / 100,
      pixelScore: Math.round(pixelResult.pixelScore * 100) / 100,
      aiScore: null,
    },
    pixelDiffRate: Math.round(pixelResult.diffRate * 10000) / 10000,
    diffImageBase64,
    dimensions: {
      width: pixelResult.width,
      height: pixelResult.height,
    },
    timestamp: new Date().toISOString(),
  };
}
