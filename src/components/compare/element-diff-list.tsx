"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Scan,
  Square,
  Type,
  Image,
  TextCursorInput,
  CreditCard,
  Star,
  LayoutGrid,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ELEMENT_ANALYSIS_SUPPORTED } from "@/lib/features";
import type { ElementAnalysisResult, ElementDiff } from "@/types/compare";

interface ElementDiffListProps {
  analysis?: ElementAnalysisResult | null;
  isLoading?: boolean;
  onAnalyze?: () => void;
  hasImages?: boolean;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  button: Square,
  text: Type,
  image: Image,
  input: TextCursorInput,
  card: CreditCard,
  icon: Star,
  layout: LayoutGrid,
  other: HelpCircle,
};

const categoryLabels: Record<string, string> = {
  button: "按钮",
  text: "文字",
  image: "图片",
  input: "输入框",
  card: "卡片",
  icon: "图标",
  layout: "布局",
  other: "其他",
};

const severityConfig = {
  high: {
    icon: AlertTriangle,
    label: "严重",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    dotColor: "bg-destructive",
  },
  medium: {
    icon: AlertCircle,
    label: "中等",
    className: "bg-warning/10 text-warning border-warning/20",
    dotColor: "bg-warning",
  },
  low: {
    icon: Info,
    label: "轻微",
    className: "bg-muted text-muted-foreground border-border",
    dotColor: "bg-muted-foreground",
  },
};

function ElementDiffItem({ diff }: { diff: ElementDiff }) {
  const [expanded, setExpanded] = useState(true);
  const CategoryIcon = categoryIcons[diff.category] || HelpCircle;
  const sev = severityConfig[diff.severity];
  const SeverityIcon = sev.icon;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <CategoryIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm flex-1 truncate">{diff.element}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
          {categoryLabels[diff.category] || diff.category}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0 h-5 shrink-0 gap-1", sev.className)}
        >
          <SeverityIcon className="w-3 h-3" />
          {sev.label}
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-muted/10">
            <p className="text-xs text-muted-foreground">{diff.summary}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground w-[30%]">
                  属性
                </th>
                <th className="text-left px-4 py-2 font-medium text-xs text-primary w-[35%]">
                  设计稿
                </th>
                <th className="text-left px-4 py-2 font-medium text-xs text-chart-2 w-[35%]">
                  实现稿
                </th>
              </tr>
            </thead>
            <tbody>
              {diff.properties.map((prop, i) => (
                <tr
                  key={`${prop.property}-${i}`}
                  className={cn(
                    "border-b border-border last:border-0",
                    !prop.match && "bg-destructive/5"
                  )}
                >
                  <td className="px-4 py-2 text-xs font-medium text-foreground">
                    {prop.property}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-primary">
                    {prop.designValue}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono">
                    <span
                      className={cn(
                        prop.match ? "text-success" : "text-destructive font-semibold"
                      )}
                    >
                      {prop.implValue}
                    </span>
                    {!prop.match && (
                      <span className="ml-1.5 text-[10px] text-destructive/60">
                        (不一致)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ElementDiffList({
  analysis = null,
  isLoading = false,
  onAnalyze = () => {},
  hasImages = false,
}: ElementDiffListProps) {
  if (!ELEMENT_ANALYSIS_SUPPORTED) {
    return (
      <Card className="border-border border-dashed">
        <CardContent className="p-5 flex flex-col items-center gap-3 py-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted">
            <Scan className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">逐元素差异分析</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              该功能暂时不支持，后续版本将重新开放。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis && !isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-5 flex flex-col items-center gap-3 py-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Scan className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">逐元素差异分析</p>
            <p className="text-xs text-muted-foreground mt-1">
              使用 AI 多模态视觉识别页面中每个元素的属性差异
            </p>
          </div>
          <Button
            onClick={onAnalyze}
            disabled={!hasImages}
            className="gap-2 mt-1"
            size="sm"
          >
            <Scan className="w-3.5 h-3.5" />
            开始逐元素分析
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-5 flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-sm font-medium">AI 正在逐元素分析中...</p>
            <p className="text-xs text-muted-foreground mt-1">
              识别页面元素并对比视觉属性，通常需要 10-30 秒
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const highCount = analysis.elements.filter((e) => e.severity === "high").length;
  const mediumCount = analysis.elements.filter((e) => e.severity === "medium").length;
  const lowCount = analysis.elements.filter((e) => e.severity === "low").length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Scan className="w-4 h-4 text-primary" />
            逐元素差异 ({analysis.elements.length} 项)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onAnalyze} className="h-7 text-xs gap-1">
            <Scan className="w-3 h-3" />
            重新分析
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">元素匹配率</span>
            <span className="font-mono font-medium">{analysis.matchRate} 分</span>
          </div>
          <Progress value={analysis.matchRate} className="h-2" />
        </div>

        <div className="flex gap-3 text-xs">
          {highCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              严重 {highCount}
            </span>
          )}
          {mediumCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              中等 {mediumCount}
            </span>
          )}
          {lowCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              轻微 {lowCount}
            </span>
          )}
        </div>

        {analysis.overallSummary && (
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
            {analysis.overallSummary}
          </p>
        )}

        <div className="space-y-2">
          {analysis.elements
            .sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.severity] - order[b.severity];
            })
            .map((diff, i) => (
              <ElementDiffItem key={`${diff.element}-${i}`} diff={diff} />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
