"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Users, ArrowRight } from "lucide-react"

export function WelcomeScreen() {
  const [shareToken, setShareToken] = useState("")

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg"
          alt="Conrad Tulum Riviera Maya"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-svh flex-col">
        {/* Header */}
        <header className="flex items-center justify-center px-6 pt-12 pb-6">
          <div className="flex flex-col items-center gap-2">
            <div className="text-primary-foreground/90 text-sm font-medium tracking-[0.3em] uppercase">Conrad</div>
            <h1 className="text-primary-foreground text-2xl font-light tracking-wide">Tulum Riviera Maya</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm space-y-8">
            {/* Tagline */}
            <div className="text-center space-y-3">
              <h2 className="font-serif text-primary-foreground text-3xl font-light leading-tight">
                Site Visit Companion
              </h2>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                Your personalized guide to planning unforgettable group experiences
              </p>
            </div>

            {/* Action Cards */}
            <div className="space-y-4">
              {/* Sales Team Login */}
              <Link href="/auth/login" className="block">
                <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 transition-all hover:bg-white/15 hover:border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-foreground">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-primary-foreground font-medium">Sales Team</h3>
                      <p className="text-primary-foreground/70 text-sm">Log in to manage site visits</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary-foreground/50 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-primary-foreground/60 text-xs tracking-wider uppercase">or</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              {/* Client Access */}
              <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-primary-foreground font-medium">Client Access</h3>
                    <p className="text-primary-foreground/70 text-sm">Enter your visit code</p>
                  </div>
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (shareToken.trim()) {
                      window.location.href = `/visit/${shareToken.trim()}`
                    }
                  }}
                >
                  <Input
                    type="text"
                    placeholder="Enter access code"
                    value={shareToken}
                    onChange={(e) => setShareToken(e.target.value)}
                    className="flex-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary focus:ring-primary"
                  />
                  <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Explore Content Hub Link */}
            <div className="text-center pt-4">
              <Link
                href="/explore"
                className="text-primary-foreground/80 text-sm underline-offset-4 hover:underline hover:text-primary-foreground transition-colors"
              >
                Explore our content library
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 pb-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-primary-foreground/60 text-xs">
              Carretera Cancún Tulum 307 · Tulum, Quintana Roo, México
            </p>
            <p className="text-primary-foreground/40 text-xs">© {new Date().getFullYear()} Conrad Hotels & Resorts</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
