"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/store/compare-store";

/** 读取 public/example/ 下静态资源，转为纯 base64（与上传流程一致） */
async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** 设计稿（Figma）与实现稿（对照截图） */
const DESIGN = "/example/figmaImage.png";
const IMPL = "/example/aiImage.png";

export default function DemoPage() {
  const router = useRouter();
  const setDesignImage = useCompareStore((s) => s.setDesignImage);
  const setImplImage = useCompareStore((s) => s.setImplImage);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [designB64, implB64] = await Promise.all([
          fetchAsBase64(DESIGN),
          fetchAsBase64(IMPL),
        ]);
        if (cancelled) return;
        if (!designB64 || !implB64) {
          throw new Error("empty");
        }
        setDesignImage(designB64, "figmaImage.png");
        setImplImage(implB64, "aiImage.png");
        router.replace("/compare");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            `请在 public/example/ 目录下放置 figmaImage.png（设计稿）与 aiImage.png（实现截图），然后刷新本页。`
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, setDesignImage, setImplImage]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full rounded-xl border border-border bg-card/50 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-3">
              <ImageOff className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-lg font-semibold">未找到示例图片</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{errorMsg}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button variant="outline" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>重试</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">正在加载示例图片…</p>
    </div>
  );
}
