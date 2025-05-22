"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, ChevronDown } from "lucide-react"

export function UserProfile() {
  const { data: session, status } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
      </Button>
    )
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/auth/login">Sign In</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/register">Sign Up</Link>
        </Button>
      </div>
    )
  }

  const userInitials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline-block">{session.user.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
