"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompareArrows, LayoutDashboard, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "首页" },
  { href: "/compare", icon: GitCompareArrows, label: "对比" },
  { href: "/demo", icon: PlayCircle, label: "Demo" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center justify-center border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          DC
        </div>
      </div>
      <nav className="flex-1 flex flex-col items-center gap-1 py-3 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/demo"
                ? pathname === "/demo" || pathname.startsWith("/demo/")
                : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-colors relative group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-2 pb-3 px-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
