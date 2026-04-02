import { NextRequest, NextResponse } from "next/server";
import { generateMarkdownReport } from "@/lib/report/generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { result, elementAnalysis, title, designFileName, implFileName } = body;

    if (!result) {
      return NextResponse.json(
        { error: "result is required" },
        { status: 400 }
      );
    }

    const markdown = generateMarkdownReport({
      result,
      elementAnalysis,
      title,
      designFileName,
      implFileName,
    });

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
