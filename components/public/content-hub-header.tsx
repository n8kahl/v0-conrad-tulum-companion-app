"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/lib/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Globe, Search, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getBrandingConfig } from "@/lib/branding/config"

const navLinks = [
  { href: "/explore", labelKey: "collections" as const },
  { href: "/explore/assets", labelKey: "allAssets" as const },
  { href: "/explore/venues", labelKey: "venues" as const },
]

export function ContentHubHeader() {
  const { locale, setLocale, t } = useLanguage()
  const pathname = usePathname()
  const branding = getBrandingConfig()

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "es" : "en")
  }

  const isActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/explore"
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <span className="text-primary font-serif text-lg font-semibold">
              C
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[9px] font-medium tracking-[0.2em] uppercase">
              {branding.property.shortName.split(' ')[0]}
            </span>
            <span className="text-foreground text-sm font-medium -mt-0.5">
              {branding.property.shortName.split(' ').slice(1).join(' ')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(link.labelKey)}
                {/* Underline animation */}
                <span
                  className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary rounded-full transition-all duration-300",
                    active ? "w-6" : "w-0 group-hover:w-6"
                  )}
                />
              </Link>
            )
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:flex text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Link href="/explore/search">
              <Search className="h-4 w-4" />
              <span className="sr-only">{t("search")}</span>
            </Link>
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 px-3"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-semibold tracking-wide">
              {locale}
            </span>
          </Button>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-border mx-1" />

          {/* Sales Login */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2 bg-transparent border-border hover:bg-muted/50 hover:border-primary/50 h-9"
          >
            <Link href="/auth/login">
              <User className="h-3.5 w-3.5" />
              <span>{t("salesLogin")}</span>
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center gap-3 p-6 border-b border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-primary font-serif text-lg font-semibold">
                      C
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[9px] font-medium tracking-[0.2em] uppercase">
                      Conrad
                    </span>
                    <span className="text-foreground text-sm font-medium -mt-0.5">
                      Tulum
                    </span>
                  </div>
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 p-6 space-y-1">
                  {navLinks.map((link) => {
                    const active = isActive(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors",
                          active
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {t(link.labelKey)}
                      </Link>
                    )
                  })}
                  <Link
                    href="/explore/search"
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    {t("search").replace("...", "")}
                  </Link>
                </nav>

                {/* Mobile Footer */}
                <div className="p-6 border-t border-border space-y-3">
                  <Button
                    variant="ghost"
                    onClick={toggleLanguage}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="mr-3 h-4 w-4" />
                    {locale === "en" ? t("switchToSpanish") : t("switchToEnglish")}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-center"
                  >
                    <Link href="/auth/login">
                      <User className="mr-2 h-4 w-4" />
                      {t("salesLogin")}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
