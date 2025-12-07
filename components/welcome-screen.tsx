"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Users, ArrowRight, Sparkles } from "lucide-react"
import { getBrandingConfig } from "@/lib/branding/config"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export function WelcomeScreen() {
  const [shareToken, setShareToken] = useState("")
  const branding = getBrandingConfig()

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={branding.images.welcomeBackground}
          alt={branding.property.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-svh flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center justify-center px-6 pt-12 pb-6"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/70 text-xs font-medium tracking-[0.4em] uppercase">
              {branding.property.shortName.split(' ')[0]}
            </span>
            <h1 className="text-white text-xl font-light tracking-widest">
              {branding.property.shortName.split(' ').slice(1).join(' ').toUpperCase()}
            </h1>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col lg:flex-row items-center justify-center px-6 pb-12 gap-12 lg:gap-24">
          {/* Left Column - Editorial Content */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-md"
          >
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex items-center gap-2 mb-4"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary text-xs font-medium tracking-[0.3em] uppercase">
                Site Visit Companion
              </span>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="font-serif text-white text-4xl lg:text-5xl font-light leading-tight mb-6"
            >
              {branding.property.tagline.split(' ').map((word, i, arr) => (
                <span key={i}>{word}{i < arr.length - 1 && <br />}</span>
              ))}
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="text-white/70 text-base leading-relaxed max-w-sm"
            >
              {branding.property.description}
            </motion.p>

            {/* Explore Link - Desktop */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              className="hidden lg:block mt-8"
            >
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors group"
              >
                <span>Explore our content library</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Action Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="w-full max-w-sm space-y-4"
          >
            {/* Sales Team Login */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            >
              <Link href="/auth/login" className="block">
                <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 transition-all duration-300 hover:bg-white/15 hover:border-white/30 hover:shadow-xl hover:shadow-black/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-white transition-colors group-hover:bg-primary/30">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Sales Team</h3>
                      <p className="text-white/60 text-sm">
                        Log in to manage site visits
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/70" />
                  </div>
                  {/* Subtle gold accent line */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-accent transition-all duration-500 group-hover:w-full" />
                </div>
              </Link>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              className="flex items-center gap-4 py-2"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-white/40 text-xs tracking-widest uppercase">
                or
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.div>

            {/* Client Access */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
              className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Client Access</h3>
                  <p className="text-white/60 text-sm">
                    Enter your visit code
                  </p>
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
                  className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-primary focus:ring-primary/50 h-11"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-11 shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </motion.div>

            {/* Explore Content Hub Link - Mobile */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
              className="text-center pt-4 lg:hidden"
            >
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-white/60 text-sm hover:text-white transition-colors"
              >
                <span>Explore our content library</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="px-6 pb-8"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-white/50 text-xs tracking-wide">
              Carretera Cancún Tulum 307 · Tulum, Quintana Roo, México
            </p>
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} Conrad Hotels & Resorts
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}
