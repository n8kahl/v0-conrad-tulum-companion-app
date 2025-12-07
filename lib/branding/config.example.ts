/**
 * Example: Custom Property Branding
 * Copy this file's content to lib/branding/config.ts and customize for your property
 */

import type { BrandingConfig } from "./config"

/**
 * Example branding configuration for a different property
 * This shows how to customize the application for your hotel/resort
 */
export const customBrandingExample: BrandingConfig = {
  property: {
    // Full property name as it appears in formal contexts
    name: "Hilton Cancun All-Inclusive Resort",
    
    // Shortened name for headers and mobile views
    shortName: "Hilton Cancun",
    
    // Hero tagline (words will be split across lines)
    tagline: "Paradise Awaits",
    
    // Location description
    destination: "Cancun's premier beachfront destination",
    
    // Full description for meta tags and hero text
    description: "Your personalized guide to planning unforgettable group experiences at Hilton Cancun, where luxury meets adventure on the Caribbean coast.",
  },
  
  colors: {
    // Primary brand color (buttons, accents, highlights)
    // Hilton blue: #0057B8
    primary: "#0057B8",
    
    // Secondary/dark color for text and backgrounds
    secondary: "#1A1A1A",
    
    // Browser theme bar color (mobile)
    themeColor: "#0057B8",
  },
  
  images: {
    // Welcome/Home Screen
    // Use your property's hero shot - lobby, pool, or beach view
    welcomeBackground: "https://your-cdn.com/images/hero-lobby.jpg",
    welcomeBackgroundAlt: "/images/fallback-hero.jpg", // Optional local fallback
    
    // Login Page
    // Can use same as welcome or a different view
    loginBackground: "https://your-cdn.com/images/sunset-pool.jpg",
    loginBackgroundVideo: "/api/media/property-video", // Optional video
    
    // Sign-up Page
    // Use an inviting, aspirational image
    signUpBackground: "https://your-cdn.com/images/aerial-resort.jpg",
    
    // Visit Pages (client-facing tour pages)
    // Default header image for site visit pages
    visitHeroDefault: "https://your-cdn.com/images/beachfront.jpg",
    
    // Logos (optional)
    // If you have custom logos, add them here
    logoLight: "/images/brand/logo-light.svg",
    logoDark: "/images/brand/logo-dark.svg",
    
    // Favicons
    favicon: "/icon.svg",
    appleTouchIcon: "/apple-icon.png",
    
    // Resort Map
    // PDF or high-res PNG of your property layout
    resortMap: "/images/property-map.png",
    
    // Aerial View
    // Bird's eye view of your property
    aerialView: "https://your-cdn.com/images/aerial-view.jpg",
    
    // Fallback/Placeholder
    // Default image when content is missing
    placeholder: "/images/placeholder.jpg",
  },
  
  typography: {
    fontFamily: {
      // Body text font
      sans: "var(--font-geist-sans)", // Or your brand font
      
      // Elegant headings font
      serif: "var(--font-serif)", // Or your preferred serif
      
      // Monospace for code/data
      mono: "var(--font-geist-mono)",
    },
  },
  
  contact: {
    // Sales team email
    salesEmail: "sales@hiltoncancun.com",
    
    // Main property phone
    phone: "+52 998 123 4567",
    
    // Physical address (optional, used in footers)
    address: "Blvd. Kukulcan Km 17, Zona Hotelera, 77500 Cancún, Q.R., Mexico",
  },
  
  social: {
    // Property website
    website: "https://www.hilton.com/en/hotels/cuncchh-hilton-cancun",
    
    // Social media profiles (optional)
    instagram: "https://instagram.com/hiltoncancun",
    facebook: "https://facebook.com/hiltoncancun",
  },
}

// Instructions to apply:
// 1. Copy this example to lib/branding/config.ts
// 2. Update the exported `brandingConfig` constant with your values
// 3. Update your image files in /public/images/
// 4. If changing colors, also update app/globals.css Tailwind variables
// 5. Run `pnpm build` to verify all TypeScript types
// 6. Test all pages to ensure branding appears correctly
