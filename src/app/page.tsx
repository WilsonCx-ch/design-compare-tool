import Link from "next/link";
import {
  Scan,
  FileText,
  Figma,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Scan,
    title: "像素级差分",
    desc: "Pixelmatch 逐像素比对，精确到每一个像素点的颜色差异",
  },
  {
    icon: Layers,
    title: "SSIM 结构相似度",
    desc: "从亮度、对比度、结构三个维度评估图像整体相似程度",
  },
  {
    icon: Zap,
    title: "多模式可视化",
    desc: "半透明叠加与差异热力图两种查看模式，快速定位像素差异",
  },
  {
    icon: Figma,
    title: "Figma 集成",
    desc: "直接从 Figma 文件链接导入设计稿，无需手动截图",
  },
  {
    icon: FileText,
    title: "自动化报告",
    desc: "一键生成包含评分和差异分析的对比报告，支持 PDF 导出",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-10 lg:py-0">
      <section className="relative px-8 mb-10 lg:mb-14 mt-4 lg:mt-0">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground mb-6 lg:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            设计还原度自动化检测平台
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            告别人肉比对
            <br />
            <span className="text-primary">让还原度可量化</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            上传设计稿与实现截图，自动获得像素级差分、结构相似度评分、
            差异可视化和专业对比报告
          </p>
          <Link href="/compare">
            <Button size="lg" className="gap-2 text-base px-8">
              开始对比
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border bg-card/50 hover:bg-card transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-3">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
