import { create } from "zustand";
import type { CompareState } from "@/types/compare";

export const useCompareStore = create<CompareState>((set) => ({
  designImage: null,
  implImage: null,
  designFileName: null,
  implFileName: null,
  result: null,
  elementAnalysis: null,
  isComparing: false,
  isAnalyzingElements: false,
  viewMode: "parallel",
  threshold: 90,

  setDesignImage: (base64, fileName) =>
    set({ designImage: base64, designFileName: fileName, result: null, elementAnalysis: null }),
  setImplImage: (base64, fileName) =>
    set({ implImage: base64, implFileName: fileName, result: null, elementAnalysis: null }),
  setResult: (result) => set({ result, isComparing: false }),
  setElementAnalysis: (analysis) => set({ elementAnalysis: analysis, isAnalyzingElements: false }),
  setIsComparing: (v) => set({ isComparing: v }),
  setIsAnalyzingElements: (v) => set({ isAnalyzingElements: v }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setThreshold: (v) => set({ threshold: v }),
  reset: () =>
    set({
      designImage: null,
      implImage: null,
      designFileName: null,
      implFileName: null,
      result: null,
      elementAnalysis: null,
      isComparing: false,
      isAnalyzingElements: false,
      viewMode: "parallel",
    }),
}));
