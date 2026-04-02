import { NextRequest, NextResponse } from "next/server";
import { runComparison } from "@/lib/engine/scorer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designImage, implImage, threshold, ssimWeight } = body;

    if (!designImage || !implImage) {
      return NextResponse.json(
        { error: "Both designImage and implImage (base64) are required" },
        { status: 400 }
      );
    }

    const designBuffer = Buffer.from(designImage, "base64");
    const implBuffer = Buffer.from(implImage, "base64");

    const result = await runComparison(designBuffer, implBuffer, {
      threshold: threshold ?? 90,
      ssimWeight: ssimWeight ?? 0.7,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Comparison failed" },
      { status: 500 }
    );
  }
}
