"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileTextIcon, LayoutDashboardIcon, MessageSquareIcon, UploadIcon, FolderIcon, HistoryIcon } from "lucide-react"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboardIcon className="mr-2 h-4 w-4" />,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: <FileTextIcon className="mr-2 h-4 w-4" />,
  },
  {
    title: "Collections",
    href: "/dashboard/collections",
    icon: <FolderIcon className="mr-2 h-4 w-4" />,
  },
  {
    title: "Chat History",
    href: "/dashboard/chat-history",
    icon: <HistoryIcon className="mr-2 h-4 w-4" />,
  },
  {
    title: "Chat",
    href: "/chat",
    icon: <MessageSquareIcon className="mr-2 h-4 w-4" />,
  },
  {
    title: "Upload",
    href: "/upload",
    icon: <UploadIcon className="mr-2 h-4 w-4" />,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {items.map((item, index) => (
        <Link key={index} href={item.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === item.href &&
                "bg-accent-light/10 dark:bg-accent-dark/10 text-accent-light dark:text-accent-dark",
            )}
          >
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
