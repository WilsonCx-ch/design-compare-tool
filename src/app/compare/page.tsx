'use client'

import { useCallback } from 'react'
import { GitCompareArrows, RotateCcw, Loader2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { useCompareStore } from '@/store/compare-store'
import { ImageUploader } from '@/components/compare/image-uploader'
import { FigmaImport } from '@/components/compare/figma-import'
import { CompareViewer } from '@/components/compare/compare-viewer'
import { ScoreDashboard } from '@/components/compare/score-dashboard'
import { ReportPreview } from '@/components/report/report-preview'

export default function ComparePage() {
	const {
		designImage,
		implImage,
		designFileName,
		implFileName,
		result,
		isComparing,
		viewMode,
		threshold,
		setDesignImage,
		setImplImage,
		setResult,
		setElementAnalysis,
		setIsComparing,
		setViewMode,
		setThreshold,
		reset
	} = useCompareStore()

	const runCompare = useCallback(async () => {
		if (!designImage || !implImage) return
		setIsComparing(true)
		setResult(null)
		setElementAnalysis(null)

		try {
			const resp = await fetch('/api/compare', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					designImage,
					implImage,
					threshold
				})
			})

			if (!resp.ok) {
				const err = await resp.json()
				throw new Error(err.error || 'Comparison failed')
			}

			const data = await resp.json()
			setResult(data)
		} catch (err) {
			console.error('Compare failed:', err)
			setIsComparing(false)
		}
	}, [
		designImage,
		implImage,
		threshold,
		setIsComparing,
		setResult,
		setElementAnalysis
	])

	const canCompare = designImage && implImage && !isComparing

	return (
		<div className="min-h-screen">
			<header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
				<div className="flex items-center justify-between h-14 px-6">
					<div className="flex items-center gap-3">
						<GitCompareArrows className="w-5 h-5 text-primary" />
						<h1 className="font-semibold">设计还原度对比</h1>
					</div>
					<div className="flex items-center gap-2">
						{result && (
							<Dialog>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5 text-primary border-primary/20 bg-primary/10 hover:bg-primary/20 font-mono font-bold"
									>
										{result.finalScore.toFixed(1)} 分
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px] overflow-hidden max-h-[85vh] flex flex-col">
									<DialogHeader className="shrink-0 mb-2">
										<DialogTitle>分析报告</DialogTitle>
										<p className="text-sm text-muted-foreground">
											查看对比得分与详细报告
										</p>
									</DialogHeader>
									<div className="flex-1 overflow-y-auto space-y-4 px-1 pb-2">
										<ScoreDashboard result={result} />
										<div className="flex gap-2 justify-end">
											<ReportPreview
												result={result}
												designFileName={designFileName ?? undefined}
												implFileName={implFileName ?? undefined}
											/>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setResult(null)
												}}
												className="gap-1.5"
											>
												<RotateCcw className="w-3.5 h-3.5" />
												重新上传
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						)}
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Settings2 className="w-4 h-4" />
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-sm">
								<DialogHeader>
									<DialogTitle>对比设置</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 pt-2">
									<div className="space-y-2">
										<Label>通过阈值: {threshold} 分</Label>
										<Slider
											value={[threshold]}
											onValueChange={([v]) => setThreshold(v)}
											min={50}
											max={100}
											step={1}
										/>
										<p className="text-xs text-muted-foreground">
											综合评分高于此阈值则判定为 PASS
										</p>
									</div>
								</div>
							</DialogContent>
						</Dialog>
						{(designImage || implImage) && (
							<Button
								variant="ghost"
								size="sm"
								onClick={reset}
								className="gap-1.5 text-muted-foreground"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								重置
							</Button>
						)}
					</div>
				</div>
			</header>

			<div className="px-3 py-4 sm:px-4 space-y-4 mx-3">
				{!result ? (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<ImageUploader
								label="Figma"
								hideLabel
								sublabel="仅支持从 Figma 链接导出截图"
								image={designImage}
								fileName={designFileName}
								onImageSet={setDesignImage}
								onClear={() =>
									useCompareStore.setState({
										designImage: null,
										designFileName: null,
										result: null,
										elementAnalysis: null
									})
								}
								accentColor="primary"
								emptySlot={
									<FigmaImport
										variant="panel"
										onImageImported={(base64, name) => {
											setDesignImage(base64, name)
										}}
									/>
								}
							/>
							<ImageUploader
								label="实现稿"
								hideLabel
								sublabel="开发产物的页面截图"
								image={implImage}
								fileName={implFileName}
								onImageSet={setImplImage}
								onClear={() =>
									useCompareStore.setState({
										implImage: null,
										implFileName: null,
										result: null,
										elementAnalysis: null
									})
								}
								accentColor="secondary"
							/>
						</div>

						<div className="flex justify-center pt-2">
							<Button
								size="lg"
								disabled={!canCompare}
								onClick={runCompare}
								className="gap-2 px-10"
							>
								{isComparing ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										正在对比分析...
									</>
								) : (
									<>
										<GitCompareArrows className="w-4 h-4" />
										开始对比
									</>
								)}
							</Button>
						</div>
					</>
				) : (
					<div className="space-y-4">
						<CompareViewer
							designImage={designImage!}
							implImage={implImage!}
							diffImage={result.diffImageBase64}
							referenceDimensions={result.dimensions}
							viewMode={viewMode}
							onViewModeChange={setViewMode}
						/>
					</div>
				)}
			</div>
		</div>
	)
}
