"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin`,
          data: {
            full_name: fullName,
            role: "sales",
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-svh flex-col">
        {/* Back Button */}
        <header className="p-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to login</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-primary-foreground/80 text-xs font-medium tracking-[0.3em] uppercase mb-2">
                Conrad Tulum
              </div>
              <h1 className="font-serif text-primary-foreground text-2xl font-light">Request Access</h1>
            </div>

            {/* Sign Up Card */}
            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-primary-foreground/90 text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-foreground/90 text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@conradhotels.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary-foreground/90 text-sm">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-primary focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-primary-foreground/90 text-sm">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-primary focus:ring-primary"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/20 border border-destructive/30 px-4 py-3">
                    <p className="text-destructive-foreground text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-primary-foreground/60 text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
