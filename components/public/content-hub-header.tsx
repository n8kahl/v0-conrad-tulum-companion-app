"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Globe, Search } from "lucide-react"

export function ContentHubHeader() {
  const { locale, setLocale, t } = useLanguage()

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "es" : "en")
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="flex h-16 items-center justify-between px-6 max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-muted-foreground text-[10px] font-medium tracking-[0.2em] uppercase">
            Conrad
          </span>
          <span className="text-foreground text-sm font-light">
            Tulum Riviera Maya
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/explore"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {t("collections")}
          </Link>
          <Link
            href="/explore/assets"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("allAssets")}
          </Link>
          <Link
            href="/explore/venues"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("venues")}
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Search Button (links to search page) */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:flex text-muted-foreground hover:text-foreground"
          >
            <Link href="/explore/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-medium">{locale}</span>
          </Button>

          {/* Sales Login */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:flex bg-transparent"
          >
            <Link href="/auth/login">{t("salesLogin")}</Link>
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
                <Link
                  href="/explore"
                  className="text-lg font-medium text-foreground"
                >
                  {t("collections")}
                </Link>
                <Link
                  href="/explore/assets"
                  className="text-lg font-medium text-muted-foreground"
                >
                  {t("allAssets")}
                </Link>
                <Link
                  href="/explore/venues"
                  className="text-lg font-medium text-muted-foreground"
                >
                  {t("venues")}
                </Link>
                <Link
                  href="/explore/search"
                  className="text-lg font-medium text-muted-foreground flex items-center"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {t("search").replace("...", "")}
                </Link>
                <hr className="my-4" />
                <Button
                  variant="ghost"
                  onClick={toggleLanguage}
                  className="justify-start text-muted-foreground"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {locale === "en" ? t("switchToSpanish") : t("switchToEnglish")}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/login">{t("salesLogin")}</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
