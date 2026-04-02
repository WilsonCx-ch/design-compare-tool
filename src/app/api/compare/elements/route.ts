import { NextRequest, NextResponse } from "next/server";
import { ELEMENT_ANALYSIS_SUPPORTED } from "@/lib/features";
import { analyzeElements } from "@/lib/engine/element-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { designImage, implImage } = body;

    if (!designImage || !implImage) {
      return NextResponse.json(
        { error: "designImage 和 implImage (base64) 均为必填" },
        { status: 400 }
      );
    }

    if (!ELEMENT_ANALYSIS_SUPPORTED) {
      return NextResponse.json(
        { error: "逐元素差异分析暂时不支持" },
        { status: 503 }
      );
    }

    const result = await analyzeElements(designImage, implImage);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Element analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "元素分析失败" },
      { status: 500 }
    );
  }
}
