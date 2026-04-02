export interface FigmaImageResult {
  imageUrl: string;
  nodeId: string;
  fileName: string;
}

/**
 * Figma 分享链接里 node-id 使用连字符（如 1-2），REST API 要求冒号（1:2）。
 * @see https://www.figma.com/developers/api#get-images-endpoint
 */
export function normalizeFigmaNodeId(nodeId: string): string {
  const trimmed = nodeId.trim();
  if (!trimmed) return trimmed;
  // URL 中 : 被写成 -；若用户已传冒号则保持不变
  return trimmed.replace(/-/g, ":");
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string | null } {
  const match = url.match(/figma\.com\/(?:design|file|proto)\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error("Invalid Figma URL");

  const fileKey = match[1];

  const nodeMatch = url.match(/[?&]node-id=([^&]+)/);
  const raw = nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;
  const nodeId = raw ? normalizeFigmaNodeId(raw) : null;

  return { fileKey, nodeId };
}

export async function exportFigmaImage(
  fileKey: string,
  nodeId: string,
  token: string,
  scale = 2
): Promise<string> {
  const id = normalizeFigmaNodeId(nodeId);
  const ids = encodeURIComponent(id);
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=png&scale=${scale}`;

  const resp = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma API error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const imageUrl = data.images?.[id] as string | null | undefined;
  if (!imageUrl) {
    const err = data.err ?? data.meta?.error;
    const hint =
      "请确认 node 为可导出的 Frame/Component/Group，且链接含正确的 node-id（或粘贴带 node-id 的 Figma 分享链接）。";
    throw new Error(
      err
        ? `Figma API: ${typeof err === "string" ? err : JSON.stringify(err)}. ${hint}`
        : `无法获取节点 "${id}" 的导出图（可能为 null）。${hint}`
    );
  }

  return imageUrl;
}

export async function getFigmaFileNodes(
  fileKey: string,
  token: string
): Promise<Array<{ id: string; name: string; type: string }>> {
  const url = `https://api.figma.com/v1/files/${fileKey}?depth=2`;
  const resp = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!resp.ok) throw new Error(`Figma API error ${resp.status}`);

  const data = await resp.json();
  const nodes: Array<{ id: string; name: string; type: string }> = [];

  function walk(node: { id: string; name: string; type: string; children?: unknown[] }) {
    if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "CANVAS") {
      nodes.push({ id: node.id, name: node.name, type: node.type });
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child as { id: string; name: string; type: string; children?: unknown[] });
      }
    }
  }

  walk(data.document);
  return nodes;
}

export async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Failed to download image: ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}
