import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseHost = supabaseUrl.replace(/^https?:\/\//, "").split("/")[0] || "supabase.co"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.cntraveler.com",
      },
      // Supabase storage bucket host
      {
        protocol: "https",
        hostname: supabaseHost,
      },
      // Common external hosts used in seeded data
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "heyzine.com" },
      { protocol: "https", hostname: "hilton-hotels-and-resorts.spazious.com" },
      { protocol: "https", hostname: "conrad-tulum-riviera-maya.firstview.us" },
    ],
  },
  // Disable font optimization to prevent build failures when Google Fonts can't be fetched
  optimizeFonts: false,
  turbopack: {
    // Force Turbopack to treat this project folder as the workspace root
    root: __dirname,
  },
}

export default nextConfig
