"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BrandingSettings } from "@/components/admin/branding-settings"
import type { BrandingConfig } from "@/lib/branding/config"

interface Property {
  id: string
  name: string
  slug: string
  brand_colors: {
    primary: string
    secondary: string
    accent: string
  }
  location: {
    address?: string
    airport_code?: string
  }
}

export default function SettingsPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProperty, setIsSavingProperty] = useState(false)
  const [isSavingColors, setIsSavingColors] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null)

  // Form state
  const [propertyName, setPropertyName] = useState("")
  const [airportCode, setAirportCode] = useState("")
  const [address, setAddress] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#C4A052")
  const [secondaryColor, setSecondaryColor] = useState("#2D2D2D")
  const [accentColor, setAccentColor] = useState("#D4AF37")

  useEffect(() => {
    async function loadProperty() {
      const { data } = await supabase.from("properties").select("*").single()

      if (data) {
        setProperty(data)
        setPropertyName(data.name || "")
        setAirportCode(data.location?.airport_code || "")
        setAddress(data.location?.address || "")
        setPrimaryColor(data.brand_colors?.primary || "#C4A052")
        setSecondaryColor(data.brand_colors?.secondary || "#2D2D2D")
        setAccentColor(data.brand_colors?.accent || "#D4AF37")
      }
      setIsLoading(false)
    }
    loadProperty()
  }, [supabase])

  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await fetch("/api/branding")
        if (response.ok) {
          const data = await response.json()
          setBrandingConfig(data)
        }
      } catch (error) {
        console.error("Failed to load branding config:", error)
      }
    }
    loadBranding()
  }, [])

  const savePropertyInfo = async () => {
    if (!property) return
    setIsSavingProperty(true)

    const { error } = await supabase
      .from("properties")
      .update({
        name: propertyName,
        location: {
          ...property.location,
          address,
          airport_code: airportCode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", property.id)

    if (error) {
      toast.error("Failed to save property info")
    } else {
      toast.success("Property info saved")
      setProperty({
        ...property,
        name: propertyName,
        location: { ...property.location, address, airport_code: airportCode },
      })
    }
    setIsSavingProperty(false)
  }

  const saveColors = async () => {
    if (!property) return
    setIsSavingColors(true)

    const { error } = await supabase
      .from("properties")
      .update({
        brand_colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", property.id)

    if (error) {
      toast.error("Failed to save colors")
    } else {
      toast.success("Brand colors saved")
      setProperty({
        ...property,
        brand_colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
      })
    }
    setIsSavingColors(false)
  }

  const handleSaveBranding = async (config: BrandingConfig) => {
    try {
      const response = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branding_config: config,
          brand_colors: config.colors
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save branding")
      }

      setBrandingConfig(config)
    } catch (error) {
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage property settings and preferences</p>
      </div>

      {/* Property Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Property Information</CardTitle>
          <CardDescription>Basic details about {propertyName || "your property"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input
                id="propertyName"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airportCode">Airport Code</Label>
              <Input
                id="airportCode"
                value={airportCode}
                onChange={(e) => setAirportCode(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Button
            onClick={savePropertyInfo}
            disabled={isSavingProperty}
            className="bg-primary hover:bg-primary/90"
          >
            {isSavingProperty && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Brand Colors</CardTitle>
          <CardDescription>Customize the appearance of client-facing pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <div
                  className="h-10 w-10 rounded-lg border"
                  style={{ backgroundColor: primaryColor }}
                />
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <div
                  className="h-10 w-10 rounded-lg border"
                  style={{ backgroundColor: secondaryColor }}
                />
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <div
                  className="h-10 w-10 rounded-lg border"
                  style={{ backgroundColor: accentColor }}
                />
                <Input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={saveColors}
            disabled={isSavingColors}
            className="bg-primary hover:bg-primary/90"
          >
            {isSavingColors && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Colors
          </Button>
        </CardContent>
      </Card>

      {/* Branding Configuration */}
      {brandingConfig && (
        <BrandingSettings
          initialConfig={brandingConfig}
          onSave={handleSaveBranding}
        />
      )}
    </div>
  )
}
