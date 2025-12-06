import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft } from "lucide-react"

export default function SignUpSuccessPage() {
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
            href="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {/* Success Card */}
            <div className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>

              <h1 className="font-serif text-primary-foreground text-2xl font-light mb-3">Check Your Email</h1>

              <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
                We&apos;ve sent a confirmation link to your email address. Please click the link to activate your
                account and access the Sales Team dashboard.
              </p>

              <div className="space-y-3">
                <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
