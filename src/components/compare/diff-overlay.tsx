"use client";

import { useRef, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface DiffOverlayProps {
  designImage: string;
  diffImage: string;
  deviceMode: "pc" | "app";
}

export function DiffOverlay({ designImage, diffImage, deviceMode }: DiffOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blendOpacity, setBlendOpacity] = useState([60]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const designImg = new Image();
    const diffImg = new Image();

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;

      const w = designImg.naturalWidth;
      const h = designImg.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(designImg, 0, 0, w, h);

      ctx.globalAlpha = blendOpacity[0] / 100;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(diffImg, 0, 0, w, h);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    designImg.onload = onLoad;
    diffImg.onload = onLoad;
    designImg.src = `data:image/png;base64,${designImage}`;
    diffImg.src = `data:image/png;base64,${diffImage}`;
  }, [designImage, diffImage, blendOpacity]);

  return (
    <div className="space-y-3 flex flex-col">
      <div className="bg-muted/10 border-b border-border">
        <div
          className={cn(
            "mx-auto px-4 pt-3 pb-2 text-xs font-medium text-muted-foreground",
            deviceMode === "app" ? "max-w-[375px]" : "max-w-5xl"
          )}
        >
          差异热力图（设计稿与差异通道叠加）
        </div>
        <div className="py-4 overflow-auto" style={{ maxHeight: 600 }}>
          <div
            className={cn(
              "mx-auto relative overflow-hidden bg-white shrink-0 shadow-sm border border-border",
              deviceMode === "app" ? "w-[375px]" : "w-full max-w-5xl"
            )}
          >
            <canvas
              ref={canvasRef}
              className="block w-full h-auto"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 pb-3 pt-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          差异叠加强度
        </span>
        <Slider
          value={blendOpacity}
          onValueChange={setBlendOpacity}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-xs font-mono text-muted-foreground w-8 text-right">
          {blendOpacity[0]}
        </span>
      </div>
    </div>
  );
}
