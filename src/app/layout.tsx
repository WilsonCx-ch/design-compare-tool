import type { Metadata } from 'next'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/sidebar'
import './globals.css'

export const metadata: Metadata = {
	title: 'Design Compare - 设计还原度对比平台',
	description: '面向产品、设计、开发团队的设计还原度自动化检测与协作工具'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="zh-CN" className="dark" suppressHydrationWarning>
			<body className="antialiased">
				<TooltipProvider>
					<div className="flex min-h-screen">
						<Sidebar />
						<main className="flex-1 ml-16">{children}</main>
					</div>
				</TooltipProvider>
			</body>
		</html>
	)
}
