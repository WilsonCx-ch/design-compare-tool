'use client'

import { useState } from 'react'
import { Figma, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'

interface FigmaImportProps {
	onImageImported: (base64: string, fileName: string) => void
	/** button：小按钮；panel：占满上传区，与实现稿同高 */
	variant?: 'button' | 'panel'
}

export function FigmaImport({
	onImageImported,
	variant = 'button'
}: FigmaImportProps) {
	const [open, setOpen] = useState(false)
	const [fileUrl, setFileUrl] = useState('')
	const [token, setToken] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleImport = async () => {
		if (!fileUrl || !token) return
		setLoading(true)
		setError(null)

		try {
			const resp = await fetch('/api/figma/export', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileUrl,
					personalAccessToken: token
				})
			})

			const data = await resp.json()
			if (!resp.ok) throw new Error(data.error || 'Export failed')

			if (data.requiresNodeSelection) {
				setError(
					'请在 Figma URL 中包含 node-id 参数，或直接在 Figma 中右键复制链接（包含 ?node-id=...）'
				)
				return
			}

			onImageImported(data.imageBase64, `figma-${data.nodeId}.png`)
			setOpen(false)
			setFileUrl('')
		} catch (err) {
			setError(err instanceof Error ? err.message : '导入失败')
		} finally {
			setLoading(false)
		}
	}

	const trigger =
		variant === 'panel' ? (
			<DialogTrigger asChild>
				<button
					type="button"
					className="relative flex flex-col items-stretch gap-0 rounded-xl border-2 border-dashed border-border/60 cursor-pointer transition-all duration-200 h-[340px] w-full hover:border-primary/50 hover:bg-muted/30 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden"
				>
					<div className="flex flex-col items-center justify-center gap-4 flex-1 p-8 min-h-0">
					<div className="flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 shadow-sm bg-background border border-border">
						<Figma className="w-6 h-6 text-muted-foreground" />
					</div>
					<div className="text-center space-y-1 px-2">
						<p className="text-sm font-medium text-foreground">Figma 稿件上传</p>
						<p className="text-xs text-muted-foreground">
							粘贴 Figma 链接与 Token 导出截图（不支持本地上传文件）
						</p>
					</div>
					<p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
						点击此区域打开导入
					</p>
					</div>
				</button>
			</DialogTrigger>
		) : (
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="gap-1.5">
					<Figma className="w-3.5 h-3.5" />
					Figma
				</Button>
			</DialogTrigger>
		)

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger}
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Figma className="w-5 h-5" />从 Figma 导入设计稿
					</DialogTitle>
					<DialogDescription>
						粘贴 Figma 文件链接和 Personal Access Token 以导出设计稿截图
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div className="space-y-2">
						<Label htmlFor="figma-url">Figma 文件链接</Label>
						<Input
							id="figma-url"
							placeholder="https://www.figma.com/design/xxxxx/...?node-id=..."
							value={fileUrl}
							onChange={(e) => setFileUrl(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							在 Figma 中右键点击 Frame → Copy link 获取包含 node-id 的链接
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="figma-token">Personal Access Token</Label>
						<Input
							id="figma-token"
							type="password"
							placeholder="figd_..."
							value={token}
							onChange={(e) => setToken(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							在 Figma Settings → Personal Access Tokens 中生成
						</p>
					</div>
					{error && (
						<p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
							{error}
						</p>
					)}
					<Button
						onClick={handleImport}
						disabled={!fileUrl || !token || loading}
						className="w-full gap-2"
					>
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Download className="w-4 h-4" />
						)}
						{loading ? '正在导出...' : '导出并导入'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
