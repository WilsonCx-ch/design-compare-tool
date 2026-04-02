import type { CompareResult, ElementAnalysisResult } from "@/types/compare";

export interface ReportInput {
  title?: string;
  result: CompareResult;
  elementAnalysis?: ElementAnalysisResult;
  designFileName?: string;
  implFileName?: string;
}

export function generateMarkdownReport(input: ReportInput): string {
  const { result, title, designFileName, implFileName, elementAnalysis } = input;
  const icon = result.status === "PASS" ? "PASS" : "FAIL";
  const { subScores, pixelDiffRate, finalScore, threshold, dimensions } = result;

  const lines: string[] = [
    `# 设计还原度对比报告`,
    "",
    `## ${icon} - 综合评分: ${finalScore.toFixed(1)} 分`,
    "",
  ];

  if (title) {
    lines.push(`**项目**: ${title}`, "");
  }

  lines.push(
    `**生成时间**: ${new Date(result.timestamp).toLocaleString("zh-CN")}`,
    "",
    `**设计稿**: ${designFileName ?? "未命名"}`,
    `**实现稿**: ${implFileName ?? "未命名"}`,
    `**对比尺寸**: ${dimensions.width} x ${dimensions.height}`,
    "",
    "---",
    "",
    "## 评分详情",
    "",
    "| 指标 | 分数 |",
    "|------|------|",
    `| SSIM 结构相似度 | ${subScores.ssimScore.toFixed(1)} 分 |`,
    `| 像素匹配度 | ${subScores.pixelScore.toFixed(1)} 分 |`,
    `| AI 语义评分 | ${subScores.aiScore !== null ? subScores.aiScore.toFixed(1) + " 分" : "未启用"} |`,
    "",
    `**像素差异率**: ${(pixelDiffRate * 100).toFixed(2)}`,
    "",
    `**阈值**: ${threshold} 分`,
    "",
  );

  if (elementAnalysis && elementAnalysis.elements.length > 0) {
    lines.push(
      "---",
      "",
      `## 逐元素差异分析 (元素匹配率: ${elementAnalysis.matchRate} 分)`,
      "",
    );

    if (elementAnalysis.overallSummary) {
      lines.push(`> ${elementAnalysis.overallSummary}`, "");
    }

    const severityLabels = { high: "严重", medium: "中等", low: "轻微" };

    for (const diff of elementAnalysis.elements) {
      lines.push(
        `### ${diff.element} [${severityLabels[diff.severity]}]`,
        "",
        `*${diff.summary}*`,
        "",
        "| 属性 | 设计稿 | 实现稿 | 一致 |",
        "|------|--------|--------|------|",
      );

      for (const prop of diff.properties) {
        lines.push(
          `| ${prop.property} | ${prop.designValue} | ${prop.implValue} | ${prop.match ? "Yes" : "**No**"} |`
        );
      }

      lines.push("");
    }
  }

  lines.push(
    "---",
    "",
    "## 评分说明",
    "",
    "- **SSIM 结构相似度**: 衡量两张图在亮度、对比度、结构上的整体相似程度",
    "- **像素匹配度**: 逐像素比较两张图的颜色差异",
    `- **综合评分公式**: SSIM × 0.7 + 像素匹配度 × 0.3${pixelDiffRate > 0.3 ? "（差异过大，已施加 0.8 惩罚系数）" : ""}`,
    "",
  );

  return lines.join("\n");
}
