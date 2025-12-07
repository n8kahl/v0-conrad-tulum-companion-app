import { dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

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
