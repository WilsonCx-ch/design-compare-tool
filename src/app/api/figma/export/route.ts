import { NextRequest, NextResponse } from "next/server";
import {
  parseFigmaUrl,
  exportFigmaImage,
  downloadImageAsBase64,
  getFigmaFileNodes,
} from "@/lib/figma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, personalAccessToken, nodeId, scale } = body;

    if (!fileUrl || !personalAccessToken) {
      return NextResponse.json(
        { error: "fileUrl and personalAccessToken are required" },
        { status: 400 }
      );
    }

    const { fileKey, nodeId: parsedNodeId } = parseFigmaUrl(fileUrl);
    const targetNodeId = nodeId || parsedNodeId;

    if (!targetNodeId) {
      const nodes = await getFigmaFileNodes(fileKey, personalAccessToken);
      return NextResponse.json({
        requiresNodeSelection: true,
        nodes: nodes.filter((n) => n.type === "FRAME" || n.type === "COMPONENT"),
        fileKey,
      });
    }

    const imageUrl = await exportFigmaImage(
      fileKey,
      targetNodeId,
      personalAccessToken,
      scale ?? 2
    );

    const imageBase64 = await downloadImageAsBase64(imageUrl);

    return NextResponse.json({
      imageBase64,
      nodeId: targetNodeId,
      fileKey,
    });
  } catch (error) {
    console.error("Figma export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Figma export failed" },
      { status: 500 }
    );
  }
}
