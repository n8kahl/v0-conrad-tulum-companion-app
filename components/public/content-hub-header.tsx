"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Globe } from "lucide-react"

export function ContentHubHeader() {
  const [language, setLanguage] = useState<"en" | "es">("en")

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">Conrad</span>
          <span className="text-foreground text-sm font-light">Tulum Riviera Maya</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/explore" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Collections
          </Link>
          <Link
            href="/explore/assets"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            All Assets
          </Link>
          <Link
            href="/explore/venues"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Venues
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-medium">{language}</span>
          </Button>

          {/* Sales Login */}
          <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-transparent">
            <Link href="/auth/login">Sales Login</Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/explore" className="text-lg font-medium text-foreground">
                  Collections
                </Link>
                <Link href="/explore/assets" className="text-lg font-medium text-muted-foreground">
                  All Assets
                </Link>
                <Link href="/explore/venues" className="text-lg font-medium text-muted-foreground">
                  Venues
                </Link>
                <hr className="my-4" />
                <Button
                  variant="ghost"
                  onClick={() => setLanguage(language === "en" ? "es" : "en")}
                  className="justify-start text-muted-foreground"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {language === "en" ? "Español" : "English"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/login">Sales Login</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
