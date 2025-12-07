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
  turbopack: {
    // Force Turbopack to treat this project folder as the workspace root
    root: __dirname,
  },
}

export default nextConfig
