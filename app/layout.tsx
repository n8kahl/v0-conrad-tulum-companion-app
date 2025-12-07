import type React from "react"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/contexts/language-context"
import { getBrandingConfig } from "@/lib/branding/config"
import "./globals.css"

const branding = getBrandingConfig()

export const metadata: Metadata = {
  title: `Site Visit Companion | ${branding.property.name}`,
  description: branding.property.description,
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: branding.images.favicon,
        type: "image/svg+xml",
      },
    ],
    apple: branding.images.appleTouchIcon,
  },
}

export const viewport: Viewport = {
  themeColor: branding.colors.themeColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
