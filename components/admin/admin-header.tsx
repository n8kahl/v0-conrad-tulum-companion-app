"use client"

import type { User } from "@supabase/supabase-js"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LayoutDashboard, FileText, FolderOpen, MapPin, Calendar, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/assets", label: "Assets", icon: FileText },
  { href: "/admin/collections", label: "Collections", icon: FolderOpen },
  { href: "/admin/venues", label: "Venues", icon: MapPin },
  { href: "/admin/visits", label: "Site Visits", icon: Calendar },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

interface AdminHeaderProps {
  user: User
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-6 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <Link href="/admin" className="flex flex-col" onClick={() => setOpen(false)}>
              <span className="text-sidebar-foreground/70 text-[10px] font-medium tracking-[0.2em] uppercase">
                Conrad
              </span>
              <span className="text-sidebar-foreground text-sm font-light">Site Companion</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="mb-3 px-3">
              <p className="text-sidebar-foreground text-sm font-medium truncate">{user.email}</p>
              <p className="text-sidebar-foreground/60 text-xs">Sales Team</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col">
        <span className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">Conrad</span>
        <span className="text-foreground text-sm font-light">Site Companion</span>
      </div>
    </header>
  )
}
