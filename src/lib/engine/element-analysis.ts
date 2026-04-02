import { spawnSync, execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { ElementAnalysisResult } from "@/types/compare";

function extractJSON(text: string): Record<string, unknown> {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch { /* fall through */ }
  }

  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch { /* keep scanning */ }
      }
    }
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch { /* fall through */ }
  }

  throw new Error(
    `模型返回内容未包含有效 JSON。原始内容前200字: ${text.slice(0, 200)}`
  );
}

export const ELEMENT_ANALYSIS_PROMPT_ZH = `你是一名资深 UI 视觉走查专家。我会给你两张图片：
- 图 A（第一张）：UI 设计稿（Figma 导出）
- 图 B（第二张）：前端实现截图

请你逐一识别页面中的每个 UI 元素（按钮、文字、图片、输入框、卡片、图标、布局容器等），对比它们在设计稿和实现稿中的视觉属性差异。

对于每个有差异的元素，请对比以下属性（仅列出有差异的属性）：
- 宽度 (width)
- 高度 (height)
- 圆角 (border-radius)
- 字号 (font-size)
- 字重 (font-weight)
- 字体颜色 (color)
- 背景色 (background-color)
- 边框 (border)
- 内边距 (padding)
- 外边距/间距 (margin/gap)
- 透明度 (opacity)
- 阴影 (box-shadow)
- 对齐方式 (alignment)
- 文本内容 (text-content，如果文字不同)

严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "elements": [
    {
      "element": "元素名称（如：主按钮、标题文字、搜索输入框）",
      "category": "button|text|image|input|card|icon|layout|other",
      "severity": "high|medium|low",
      "properties": [
        {
          "property": "属性名称",
          "designValue": "设计稿中的值",
          "implValue": "实现稿中的值",
          "match": false
        }
      ],
      "summary": "一句话描述该元素的主要差异"
    }
  ],
  "overallSummary": "整体差异的一段话总结",
  "matchRate": 85
}

注意：
1. matchRate 是你对整体元素属性匹配度的估计（0-100）
2. severity 根据差异的视觉影响程度判定：high=严重影响视觉效果, medium=可察觉但不严重, low=细微差异
3. 只列出有差异的元素，完全匹配的元素不需要列出
4. 属性值请尽量用具体的 CSS 值（如 "8px", "#333333", "16px", "600" 等）
5. 如果无法精确判断数值，给出你的最佳估计值并标注"约"`;

function mockAnalysis(): ElementAnalysisResult {
  return {
    elements: [],
    overallSummary: "FEISHU_ELEMENT_ANALYSIS_MOCK=1：未调用飞书桥接",
    matchRate: 100,
    timestamp: new Date().toISOString(),
  };
}

function checkPrerequisites(python: string, bridgeScript: string): string | null {
  const chatId = process.env.FEISHU_CHAT_ID?.trim();
  const userId = process.env.FEISHU_USER_ID?.trim();
  if (!chatId && !userId) {
    return "请配置 FEISHU_CHAT_ID（群聊 oc_xxx）或 FEISHU_USER_ID（单聊 ou_xxx）二选一。详见 clawScript/README.md";
  }
  if (chatId && userId) {
    return "FEISHU_CHAT_ID 与 FEISHU_USER_ID 只能配置其一。群聊用 oc_xxx，单聊用 ou_xxx";
  }

  if (!existsSync(bridgeScript)) {
    return `桥接脚本不存在: ${bridgeScript}。请确认 clawScript/ 目录已就绪`;
  }

  try {
    execSync("lark-cli --version", { encoding: "utf-8", timeout: 10_000 });
  } catch {
    return "lark-cli 未安装或不在 PATH 中。请运行: npm install -g @larksuite/cli";
  }

  try {
    execSync(`${python} --version`, { encoding: "utf-8", timeout: 5_000 });
  } catch {
    return `Python 解释器不可用: ${python}。请安装 Python 3 或设置 FEISHU_BRIDGE_PYTHON`;
  }

  return null;
}

/**
 * 通过本地 Python 桥接脚本调用飞书 CLI（lark-cli），
 * 把两张图发给飞书会话中的 MaxClaw 机器人，轮询获取回复并解析 JSON。
 * 配置见 clawScript/README.md
 */
export async function analyzeElements(
  designBase64: string,
  implBase64: string,
): Promise<ElementAnalysisResult> {
  if (process.env.FEISHU_ELEMENT_ANALYSIS_MOCK === "1") {
    return mockAnalysis();
  }

  const python = process.env.FEISHU_BRIDGE_PYTHON || "python3";
  const bridgeScript =
    process.env.FEISHU_BRIDGE_SCRIPT ||
    join(process.cwd(), "clawScript/feishu_maxclaw_bridge.py");

  const prereqError = checkPrerequisites(python, bridgeScript);
  if (prereqError) {
    throw new Error(prereqError);
  }

  const chatId = process.env.FEISHU_CHAT_ID?.trim();
  const userId = process.env.FEISHU_USER_ID?.trim();

  const timeoutMs = Number(process.env.FEISHU_BRIDGE_TIMEOUT_MS || "300000");
  const spawnTimeout = timeoutMs + 30_000;

  const dir = mkdtempSync(join(tmpdir(), "compare-feishu-"));
  const designPath = join(dir, "design.png");
  const implPath = join(dir, "impl.png");
  const promptPath = join(dir, "prompt.txt");

  try {
    writeFileSync(designPath, Buffer.from(designBase64, "base64"));
    writeFileSync(implPath, Buffer.from(implBase64, "base64"));
    writeFileSync(promptPath, ELEMENT_ANALYSIS_PROMPT_ZH, "utf-8");

    console.log(
      "[FeishuBridge] target:",
      chatId ? `chat_id=${chatId}` : `user_id=${userId}`,
    );
    console.log("[FeishuBridge] design base64 length:", designBase64.length);
    console.log("[FeishuBridge] impl base64 length:", implBase64.length);
    console.log("[FeishuBridge] python:", python);
    console.log("[FeishuBridge] script:", bridgeScript);
    console.log("[FeishuBridge] timeout:", timeoutMs, "ms");
    console.log(
      "[FeishuBridge] 飞书 CLI 固定 --as bot：发图后请在群里手动 @ MaxClaw，脚本轮询等待回复",
    );

    const result = spawnSync(
      python,
      [bridgeScript, "--design", designPath, "--impl", implPath, "--prompt", promptPath],
      {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
        timeout: spawnTimeout,
        env: { ...process.env },
      },
    );

    if (result.stderr) {
      console.log("[FeishuBridge] stderr:", result.stderr.slice(0, 2000));
    }

    if (result.error) {
      if ((result.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
        throw new Error(
          `飞书桥接超时（${spawnTimeout / 1000}s）。MaxClaw 可能未回复。` +
          "请检查: 1) 是否已在飞书群里手动 @ MaxClaw 2) MaxClaw 是否已回复 3) 可增大 FEISHU_BRIDGE_TIMEOUT_MS"
        );
      }
      throw result.error;
    }

    if (result.status !== 0) {
      const stdout = (result.stdout || "").trim();
      const stderr = (result.stderr || "").trim();

      let errorDetail = "";
      if (stdout) {
        try {
          const errObj = JSON.parse(stdout);
          if (errObj.error) errorDetail = errObj.error;
        } catch {
          errorDetail = stdout.slice(0, 500);
        }
      }
      if (!errorDetail) errorDetail = stderr || `退出码 ${result.status ?? "unknown"}`;

      throw new Error(`飞书桥接失败: ${errorDetail}`);
    }

    const content = (result.stdout || "").trim();
    console.log("[FeishuBridge] stdout length:", content.length);
    console.log("[FeishuBridge] stdout preview:", content.slice(0, 500));

    if (!content) {
      throw new Error(
        "飞书桥接未输出内容。请检查: 1) lark-cli auth status 认证是否有效 2) FEISHU_CHAT_ID 是否正确 3) MaxClaw 是否回复了消息"
      );
    }

    const parsed = extractJSON(content);

    if (parsed.error) {
      throw new Error(`MaxClaw 返回错误: ${parsed.error}`);
    }

    return {
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      overallSummary: (parsed.overallSummary as string) || "",
      matchRate: typeof parsed.matchRate === "number" ? parsed.matchRate : 0,
      timestamp: new Date().toISOString(),
    };
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
