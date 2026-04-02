export interface SubScores {
  ssimScore: number;
  pixelScore: number;
  aiScore: number | null;
}

export interface CompareResult {
  finalScore: number;
  status: "PASS" | "FAIL";
  threshold: number;
  subScores: SubScores;
  pixelDiffRate: number;
  diffImageBase64: string;
  dimensions: {
    width: number;
    height: number;
  };
  timestamp: string;
}

export interface CompareRequest {
  designImage: string; // base64
  implImage: string;   // base64
  threshold?: number;
  ssimWeight?: number;
}

export interface FigmaExportRequest {
  fileUrl: string;
  personalAccessToken: string;
  nodeId?: string;
  scale?: number;
}

export interface FigmaExportResponse {
  imageBase64: string;
  fileName: string;
  nodeId: string;
}

export interface ReportData {
  id: string;
  title: string;
  result: CompareResult;
  designImageBase64: string;
  implImageBase64: string;
  createdAt: string;
}

export interface ElementProperty {
  property: string;
  designValue: string;
  implValue: string;
  match: boolean;
}

export interface ElementDiff {
  element: string;
  category: "button" | "text" | "image" | "input" | "card" | "icon" | "layout" | "other";
  severity: "high" | "medium" | "low";
  properties: ElementProperty[];
  summary: string;
}

export interface ElementAnalysisResult {
  elements: ElementDiff[];
  overallSummary: string;
  matchRate: number;
  timestamp: string;
}

export type ViewMode = "diff" | "parallel";

export interface CompareState {
  designImage: string | null;
  implImage: string | null;
  designFileName: string | null;
  implFileName: string | null;
  result: CompareResult | null;
  elementAnalysis: ElementAnalysisResult | null;
  isComparing: boolean;
  isAnalyzingElements: boolean;
  viewMode: ViewMode;
  threshold: number;
  setDesignImage: (base64: string, fileName: string) => void;
  setImplImage: (base64: string, fileName: string) => void;
  setResult: (result: CompareResult | null) => void;
  setElementAnalysis: (analysis: ElementAnalysisResult | null) => void;
  setIsComparing: (v: boolean) => void;
  setIsAnalyzingElements: (v: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setThreshold: (v: number) => void;
  reset: () => void;
}
