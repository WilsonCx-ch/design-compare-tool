"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Monitor, Smartphone, SplitSquareHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types/compare";
import { DiffOverlay } from "./diff-overlay";

interface CompareViewerProps {
  designImage: string;
  implImage: string;
  diffImage: string | null;
  /** 与对比引擎一致：以设计稿宽高为基准画布，用于前端对齐展示 */
  referenceDimensions?: { width: number; height: number };
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function CompareViewer({
  designImage,
  implImage,
  diffImage,
  referenceDimensions,
  viewMode,
  onViewModeChange,
}: CompareViewerProps) {
  const [deviceMode, setDeviceMode] = useState<"pc" | "app">("pc");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Tabs
          value={viewMode}
          onValueChange={(v) => onViewModeChange(v as ViewMode)}
        >
          <TabsList className="h-9">
            <TabsTrigger value="parallel" className="gap-1.5 text-xs px-3">
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              平行对比
            </TabsTrigger>
            <TabsTrigger value="diff" className="gap-1.5 text-xs px-3">
              <Flame className="w-3.5 h-3.5" />
              差异热力图
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={deviceMode}
          onValueChange={(v) => setDeviceMode(v as "pc" | "app")}
        >
          <TabsList className="h-9">
            <TabsTrigger value="pc" className="gap-1.5 text-xs px-3">
              <Monitor className="w-3.5 h-3.5" />
              PC
            </TabsTrigger>
            <TabsTrigger value="app" className="gap-1.5 text-xs px-3">
              <Smartphone className="w-3.5 h-3.5" />
              App
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
        {viewMode === "parallel" && (
          <ParallelView
            designImage={designImage}
            implImage={implImage}
            deviceMode={deviceMode}
            referenceDimensions={referenceDimensions}
          />
        )}
        {viewMode === "diff" && diffImage && (
          <DiffOverlay
            designImage={designImage}
            diffImage={diffImage}
            deviceMode={deviceMode}
          />
        )}
        {viewMode === "diff" && !diffImage && (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
            请先执行对比以生成差异热力图
          </div>
        )}
      </div>
    </div>
  );
}

function designAspectStyle(ref?: { width: number; height: number }) {
  if (!ref?.width || !ref?.height) return undefined;
  return { aspectRatio: `${ref.width} / ${ref.height}` } as const;
}

function ParallelView({
  designImage,
  implImage,
  deviceMode,
  referenceDimensions,
}: {
  designImage: string;
  implImage: string;
  deviceMode: "pc" | "app";
  referenceDimensions?: { width: number; height: number };
}) {
  const aspectStyle = designAspectStyle(referenceDimensions);
  const aligned = Boolean(aspectStyle);

  return (
    <div className="space-y-3 flex flex-col">
      <div
        className="bg-muted/10 border-b border-border py-4 overflow-auto"
        style={{ maxHeight: 600 }}
      >
        <div
          className={cn(
            "mx-auto grid gap-4 items-start",
            deviceMode === "app" ? "grid-cols-2 w-max px-4" : "grid-cols-1 xl:grid-cols-2 w-full px-4"
          )}
        >
          <div className="flex min-w-0 flex-col gap-2">
            <p className="px-0.5 text-xs font-medium text-muted-foreground">
              Figma（设计稿）
            </p>
            <div
              className={cn(
                "relative mx-auto w-full overflow-hidden border border-border bg-white shadow-sm",
                deviceMode === "app" ? "w-[375px]" : "max-w-5xl"
              )}
              style={aspectStyle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${designImage}`}
                alt="设计稿"
                className={cn(
                  aligned ? "absolute inset-0 h-full w-full object-fill" : "block h-auto w-full"
                )}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <p className="px-0.5 text-xs font-medium text-muted-foreground">实现稿</p>
            <div
              className={cn(
                "relative mx-auto w-full overflow-hidden border border-border bg-white shadow-sm",
                deviceMode === "app" ? "w-[375px]" : "max-w-5xl"
              )}
              style={aspectStyle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${implImage}`}
                alt="实现稿"
                className={cn(
                  aligned ? "absolute inset-0 h-full w-full object-fill" : "block h-auto w-full"
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 pb-3 pt-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          平行并排对比模式，左右并列以便检查细节差异
        </span>
      </div>
    </div>
  );
}
