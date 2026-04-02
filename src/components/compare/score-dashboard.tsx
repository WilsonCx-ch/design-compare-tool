"use client";

import type { CompareResult } from "@/types/compare";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreDashboardProps {
  result: CompareResult;
}

function CircularScore({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 90) return "text-success";
    if (s >= 70) return "text-warning";
    return "text-destructive";
  };

  const getStrokeColor = (s: number) => {
    if (s >= 90) return "var(--success)";
    if (s >= 70) return "var(--warning)";
    return "var(--destructive)";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tracking-tight", getColor(score))}>
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground -mt-0.5">分</span>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  maxScore = 100,
}: {
  label: string;
  score: number;
  maxScore?: number;
}) {
  const pct = (score / maxScore) * 100;
  const getBarColor = (s: number) => {
    if (s >= 90) return "bg-success";
    if (s >= 70) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-mono font-medium">{score.toFixed(1)} 分</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getBarColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreDashboard({ result }: ScoreDashboardProps) {
  const { finalScore, status, threshold, subScores, pixelDiffRate, dimensions } = result;

  return (
    <Card className="border-border">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start gap-5">
          <CircularScore score={finalScore} />
          <div className="flex-1 space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Badge
                variant={status === "PASS" ? "default" : "destructive"}
                className={cn(
                  "text-xs font-semibold",
                  status === "PASS" && "bg-success text-success-foreground hover:bg-success/90"
                )}
              >
                {status === "PASS" ? "PASS" : "FAIL"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                阈值: {threshold} 分
              </span>
            </div>
            <div className="space-y-2.5">
              <ScoreBar label="SSIM 结构相似度" score={subScores.ssimScore} />
              <ScoreBar label="像素匹配度" score={subScores.pixelScore} />
              {subScores.aiScore !== null && (
                <ScoreBar label="AI 语义评分" score={subScores.aiScore} />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1 border-t border-border text-xs text-muted-foreground">
          <span>像素差异率: {(pixelDiffRate * 100).toFixed(2)}</span>
          <span className="text-border">|</span>
          <span>尺寸: {dimensions.width}×{dimensions.height}</span>
          {pixelDiffRate > 0.3 && (
            <>
              <span className="text-border">|</span>
              <span className="text-warning">已施加惩罚系数 ×0.8</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
