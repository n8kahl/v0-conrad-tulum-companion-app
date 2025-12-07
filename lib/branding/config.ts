/**
 * Centralized branding configuration for the Site Visit Companion
 * 
 * This file contains all brand-specific elements including:
 * - Property information (name, taglines)
 * - Colors and theme values
 * - Image URLs for all pages and components
 * - Typography settings
 * - Social media links
 * 
 * To customize for a different property, update the values in this file.
 */

export interface BrandingConfig {
  property: {
    name: string
    shortName: string
    tagline: string
    destination: string
    description: string
  }
  colors: {
    primary: string // Gold/accent color
    secondary: string // Dark color
    themeColor: string // Browser theme color
  }
  images: {
    // Welcome/Home screen
    welcomeBackground: string
    welcomeBackgroundAlt?: string // Optional fallback
    
    // Auth pages
    loginBackground: string
    loginBackgroundVideo?: string // Optional video background
    signUpBackground: string
    
    // Visit pages
    visitHeroDefault: string
    
    // Headers/logos
    logoLight?: string
    logoDark?: string
    favicon: string
    appleTouchIcon: string
    
    // Resort/property specific
    resortMap?: string
    aerialView?: string
    
    // Fallback/placeholder
    placeholder: string
  }
  typography: {
    fontFamily: {
      sans: string
      serif: string
      mono: string
    }
  }
  contact: {
    salesEmail?: string
    phone?: string
    address?: string
  }
  social: {
    website?: string
    instagram?: string
    facebook?: string
  }
}

/**
 * Default branding configuration for Conrad Tulum Riviera Maya
 */
export const brandingConfig: BrandingConfig = {
  property: {
    name: "Conrad Tulum Riviera Maya",
    shortName: "Conrad Tulum",
    tagline: "Crafted Experiences",
    destination: "Caribbean's most extraordinary destinations",
    description: "Your personalized guide to planning unforgettable group experiences at one of the Caribbean's most extraordinary destinations.",
  },
  
  colors: {
    primary: "#C4A052", // Conrad Gold
    secondary: "#2D2D2D", // Dark charcoal
    themeColor: "#C4A052",
  },
  
  images: {
    // Welcome/Home screen - lobby view
    welcomeBackground: "https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg",
    
    // Auth pages
    loginBackground: "https://media.cntraveler.com/photos/6245d3ef538c15fb628ae3cb/16:9/w_2240,c_limit/Conrad%20Tulum_%C2%A9Victor%20Elias_Lobby%20(3).jpg",
    loginBackgroundVideo: "/api/media/home-video", // Route that serves property video
    signUpBackground: "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    
    // Visit pages - aerial ocean view
    visitHeroDefault: "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    
    // Headers/logos (optional - can be added)
    favicon: "/icon.svg",
    appleTouchIcon: "/apple-icon.png",
    
    // Resort specific
    resortMap: "/images/assets/resort-map.png",
    aerialView: "/luxury-resort-ocean-view-sunset-conrad-tulum-aeria.jpg",
    
    // Fallback
    placeholder: "/images/conrad/p01_img01_xref250.png",
  },
  
  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans)",
      serif: "var(--font-serif)", // Playfair Display
      mono: "var(--font-geist-mono)",
    },
  },
  
  contact: {
    salesEmail: "sales@conradtulum.com",
    phone: "+52 984 123 4567",
  },
  
  social: {
    website: "https://www.hilton.com/en/hotels/tqrcici-conrad-tulum-riviera-maya/",
  },
}

/**
 * Helper function to get branding config
 * This allows for future dynamic property switching
 * 
 * Note: This returns the static config. For dynamic config from database,
 * use the /api/branding endpoint or load from properties.branding_config
 */
export function getBrandingConfig(): BrandingConfig {
  return brandingConfig
}

/**
 * Helper to merge database config with defaults
 * Used when loading from database
 */
export function mergeBrandingConfig(dbConfig: Partial<BrandingConfig>): BrandingConfig {
  return {
    property: {
      ...brandingConfig.property,
      ...dbConfig.property
    },
    colors: {
      ...brandingConfig.colors,
      ...dbConfig.colors
    },
    images: {
      ...brandingConfig.images,
      ...dbConfig.images
    },
    typography: {
      ...brandingConfig.typography,
      ...dbConfig.typography
    },
    contact: {
      ...brandingConfig.contact,
      ...dbConfig.contact
    },
    social: {
      ...brandingConfig.social,
      ...dbConfig.social
    }
  }
}

/**
 * Helper to get property-specific text with proper formatting
 */
export function getPropertyName(format: "full" | "short" = "full"): string {
  const config = getBrandingConfig()
  return format === "full" ? config.property.name : config.property.shortName
}

/**
 * Helper to get brand colors for inline styles or dynamic theming
 */
export function getBrandColors() {
  const config = getBrandingConfig()
  return config.colors
}

/**
 * Helper to get all image URLs
 */
export function getBrandImages() {
  const config = getBrandingConfig()
  return config.images
}
