"use client";

import { useState } from "react";
import { FileText, Download, Loader2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CompareResult, ElementAnalysisResult } from "@/types/compare";

interface ReportPreviewProps {
  result: CompareResult;
  elementAnalysis?: ElementAnalysisResult;
  designFileName?: string;
  implFileName?: string;
}

export function ReportPreview({
  result,
  elementAnalysis,
  designFileName,
  implFileName,
}: ReportPreviewProps) {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result,
          elementAnalysis,
          title: "设计还原度对比",
          designFileName,
          implFileName,
        }),
      });
      const data = await resp.json();
      setMarkdown(data.markdown);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !markdown) {
      generateReport();
    }
  };

  const downloadMarkdown = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compare-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Design Fidelity Report", margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    const statusColor = result.status === "PASS" ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${result.status} - ${result.finalScore.toFixed(1)}`, margin, y);
    y += 14;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const lines = [
      `Threshold: ${result.threshold}`,
      `SSIM Score: ${result.subScores.ssimScore.toFixed(1)}`,
      `Pixel Score: ${result.subScores.pixelScore.toFixed(1)}`,
      `Pixel Diff Rate: ${(result.pixelDiffRate * 100).toFixed(2)}`,
      `Dimensions: ${result.dimensions.width} x ${result.dimensions.height}`,
      `Generated: ${new Date(result.timestamp).toLocaleString()}`,
    ];

    if (designFileName) lines.unshift(`Design: ${designFileName}`);
    if (implFileName) lines.splice(1, 0, `Implementation: ${implFileName}`);

    for (const line of lines) {
      const split = doc.splitTextToSize(line, pageWidth);
      doc.text(split, margin, y);
      y += 7 * split.length;
    }

    doc.save(`compare-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          查看报告
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            对比报告
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : markdown ? (
          <div className="space-y-4">
            <ScrollArea className="h-[50vh] rounded-lg border border-border p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                {markdown}
              </pre>
            </ScrollArea>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={downloadMarkdown} className="gap-1.5">
                <Download className="w-3.5 h-3.5" />
                下载 Markdown
              </Button>
              <Button size="sm" onClick={downloadPDF} className="gap-1.5">
                <FileDown className="w-3.5 h-3.5" />
                下载 PDF
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
