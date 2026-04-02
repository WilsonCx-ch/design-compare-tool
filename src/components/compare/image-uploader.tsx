"use client";

import { useCallback, type ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  label: string;
  /** 为 true 时不展示顶部标签徽章（仍保留关闭按钮） */
  hideLabel?: boolean;
  sublabel: string;
  image: string | null;
  fileName: string | null;
  onImageSet: (base64: string, fileName: string) => void;
  onClear: () => void;
  accentColor?: string;
  /** 若提供，则在无图片时渲染此区域（例如仅 Figma 导入，不提供本地上传） */
  emptySlot?: ReactNode;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  label,
  hideLabel = false,
  sublabel,
  image,
  fileName,
  onImageSet,
  onClear,
  accentColor = "primary",
  emptySlot,
}: ImageUploaderProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const base64 = await fileToBase64(file);
      onImageSet(base64, file.name);
    },
    [onImageSet]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    multiple: false,
  });

  if (image) {
    return (
      <div className="relative group flex flex-col rounded-xl border border-border bg-card/30 overflow-hidden min-h-[260px] h-[340px] transition-all hover:border-primary/30">
        {hideLabel ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-30 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <div className="relative z-20 flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 border-b border-border bg-background/80 backdrop-blur-md">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                accentColor === "primary"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground border border-border/50"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="relative z-10 flex-1 flex items-center justify-center p-8 overflow-hidden min-h-0">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[14px_14px] opacity-50"
            aria-hidden
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${image}`}
            alt={fileName ?? label}
            className="relative z-1 max-w-full max-h-full object-contain rounded-md border border-border/50 shadow-lg bg-background"
          />
        </div>

        <div className="relative z-20 px-4 py-2.5 border-t border-border bg-background/80 backdrop-blur-md flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs font-medium text-muted-foreground truncate">{fileName}</p>
        </div>
      </div>
    );
  }

  if (emptySlot) {
    return <>{emptySlot}</>;
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 h-[340px]",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.02] shadow-sm"
          : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <input {...getInputProps()} />
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 shadow-sm",
          isDragActive ? "bg-primary text-primary-foreground scale-110" : "bg-background border border-border"
        )}
      >
        <Upload
          className={cn(
            "w-6 h-6 transition-colors",
            isDragActive ? "text-primary-foreground" : "text-muted-foreground"
          )}
        />
      </div>
      {!hideLabel && (
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      )}
      <div className="flex flex-col items-center gap-1 mt-2">
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          拖拽图片到此处，或点击选择文件
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-medium">
          支持 PNG / JPG / WebP
        </p>
      </div>
    </div>
  );
}
