"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { ImageUploadField } from "@/components/admin/image-upload-field"
import type { BrandingConfig } from "@/lib/branding/config"

interface BrandingSettingsProps {
  propertyId: string
  initialConfig: BrandingConfig
  onSave: (config: BrandingConfig) => Promise<void>
}

export function BrandingSettings({ propertyId, initialConfig, onSave }: BrandingSettingsProps) {
  const [config, setConfig] = useState<BrandingConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateConfig = (section: keyof BrandingConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const updateImageConfig = (field: string, mediaId: string, url: string) => {
    setConfig(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [field]: url,
        [`${field}MediaId`]: mediaId || undefined
      }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(config)
      setHasChanges(false)
      toast.success("Branding settings saved successfully")
    } catch (error) {
      toast.error("Failed to save branding settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(initialConfig)
    setHasChanges(false)
    toast.info("Changes reset")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">Branding Configuration</CardTitle>
            <CardDescription>Customize your property's branding and appearance</CardDescription>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          {/* Property Information */}
          <TabsContent value="property" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="propertyName">Full Property Name</Label>
                <Input
                  id="propertyName"
                  value={config.property.name}
                  onChange={(e) => updateConfig('property', 'name', e.target.value)}
                  placeholder="Conrad Tulum Riviera Maya"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Short Name</Label>
                <Input
                  id="shortName"
                  value={config.property.shortName}
                  onChange={(e) => updateConfig('property', 'shortName', e.target.value)}
                  placeholder="Conrad Tulum"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={config.property.tagline}
                onChange={(e) => updateConfig('property', 'tagline', e.target.value)}
                placeholder="Crafted Experiences"
              />
              <p className="text-xs text-muted-foreground">
                Will be split across lines on the welcome screen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Description</Label>
              <Input
                id="destination"
                value={config.property.destination}
                onChange={(e) => updateConfig('property', 'destination', e.target.value)}
                placeholder="Caribbean's most extraordinary destinations"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={config.property.description}
                onChange={(e) => updateConfig('property', 'description', e.target.value)}
                placeholder="Your personalized guide to planning unforgettable group experiences..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Used in meta tags and hero sections
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-4">Brand Assets</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploadField
                  propertyId={propertyId}
                  label="Logo (Light)"
                  value={config.images.logoLight}
                  onUpload={(mediaId, url) => updateImageConfig('logoLight', mediaId, url)}
                  onRemove={() => updateImageConfig('logoLight', '', '')}
                  aspectRatio="4/1"
                  compact
                  helpText="Logo for dark backgrounds"
                />

                <ImageUploadField
                  propertyId={propertyId}
                  label="Logo (Dark)"
                  value={config.images.logoDark}
                  onUpload={(mediaId, url) => updateImageConfig('logoDark', mediaId, url)}
                  onRemove={() => updateImageConfig('logoDark', '', '')}
                  aspectRatio="4/1"
                  compact
                  helpText="Logo for light backgrounds"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <ImageUploadField
                  propertyId={propertyId}
                  label="Favicon"
                  value={config.images.favicon}
                  onUpload={(mediaId, url) => updateImageConfig('favicon', mediaId, url)}
                  onRemove={() => updateImageConfig('favicon', '', '')}
                  aspectRatio="1/1"
                  compact
                  maxSizeMB={1}
                  helpText="Browser tab icon (32x32 or 64x64 pixels)"
                  required
                />

                <ImageUploadField
                  propertyId={propertyId}
                  label="Apple Touch Icon"
                  value={config.images.appleTouchIcon}
                  onUpload={(mediaId, url) => updateImageConfig('appleTouchIcon', mediaId, url)}
                  onRemove={() => updateImageConfig('appleTouchIcon', '', '')}
                  aspectRatio="1/1"
                  compact
                  maxSizeMB={1}
                  helpText="iOS home screen icon (180x180 pixels)"
                  required
                />
              </div>
            </div>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-4 mt-4">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={config.colors.primary}
                    onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.colors.primary}
                    onChange={(e) => updateConfig('colors', 'primary', e.target.value)}
                    placeholder="#C4A052"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Buttons, accents, highlights
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={config.colors.secondary}
                    onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.colors.secondary}
                    onChange={(e) => updateConfig('colors', 'secondary', e.target.value)}
                    placeholder="#2D2D2D"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Text, backgrounds
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeColor">Theme Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="themeColor"
                    type="color"
                    value={config.colors.themeColor}
                    onChange={(e) => updateConfig('colors', 'themeColor', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    value={config.colors.themeColor}
                    onChange={(e) => updateConfig('colors', 'themeColor', e.target.value)}
                    placeholder="#C4A052"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Browser theme bar (mobile)
                </p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Preview</p>
              <div className="flex gap-4">
                <div
                  className="w-24 h-24 rounded-lg border"
                  style={{ backgroundColor: config.colors.primary }}
                />
                <div
                  className="w-24 h-24 rounded-lg border"
                  style={{ backgroundColor: config.colors.secondary }}
                />
                <div
                  className="w-24 h-24 rounded-lg border"
                  style={{ backgroundColor: config.colors.themeColor }}
                />
              </div>
            </div>

            <div className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-r">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Note:</strong> After changing colors, you may need to refresh the page to see all changes applied.
                For advanced theming, edit <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded text-xs">app/globals.css</code>.
              </p>
            </div>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="space-y-4">
              <ImageUploadField
                propertyId={propertyId}
                label="Welcome Screen Background"
                value={config.images.welcomeBackground}
                onUpload={(mediaId, url) => updateImageConfig('welcomeBackground', mediaId, url)}
                onRemove={() => updateImageConfig('welcomeBackground', '', '')}
                aspectRatio="16/9"
                helpText="High-quality hero image for welcome screen (recommended: 2000px+ width)"
                required
              />

              <ImageUploadField
                propertyId={propertyId}
                label="Login Background"
                value={config.images.loginBackground}
                onUpload={(mediaId, url) => updateImageConfig('loginBackground', mediaId, url)}
                onRemove={() => updateImageConfig('loginBackground', '', '')}
                aspectRatio="16/9"
                helpText="Background image for login page"
                required
              />

              <div className="space-y-2">
                <Label htmlFor="loginBackgroundVideo">Login Background Video (optional)</Label>
                <Input
                  id="loginBackgroundVideo"
                  value={config.images.loginBackgroundVideo || ''}
                  onChange={(e) => updateConfig('images', 'loginBackgroundVideo', e.target.value)}
                  placeholder="/api/media/home-video"
                />
                <p className="text-xs text-muted-foreground">API route or video URL for animated background</p>
              </div>

              <ImageUploadField
                propertyId={propertyId}
                label="Sign Up Background"
                value={config.images.signUpBackground}
                onUpload={(mediaId, url) => updateImageConfig('signUpBackground', mediaId, url)}
                onRemove={() => updateImageConfig('signUpBackground', '', '')}
                aspectRatio="16/9"
                helpText="Background image for sign-up page"
                required
              />

              <ImageUploadField
                propertyId={propertyId}
                label="Visit Hero Default"
                value={config.images.visitHeroDefault}
                onUpload={(mediaId, url) => updateImageConfig('visitHeroDefault', mediaId, url)}
                onRemove={() => updateImageConfig('visitHeroDefault', '', '')}
                aspectRatio="16/9"
                helpText="Default hero image for site visit pages"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploadField
                  propertyId={propertyId}
                  label="Resort Map (optional)"
                  value={config.images.resortMap}
                  onUpload={(mediaId, url) => updateImageConfig('resortMap', mediaId, url)}
                  onRemove={() => updateImageConfig('resortMap', '', '')}
                  aspectRatio="4/3"
                  compact
                  helpText="Property layout map"
                />

                <ImageUploadField
                  propertyId={propertyId}
                  label="Aerial View (optional)"
                  value={config.images.aerialView}
                  onUpload={(mediaId, url) => updateImageConfig('aerialView', mediaId, url)}
                  onRemove={() => updateImageConfig('aerialView', '', '')}
                  aspectRatio="16/9"
                  compact
                  helpText="Aerial property photo"
                />
              </div>

              <ImageUploadField
                propertyId={propertyId}
                label="Placeholder Image"
                value={config.images.placeholder}
                onUpload={(mediaId, url) => updateImageConfig('placeholder', mediaId, url)}
                onRemove={() => updateImageConfig('placeholder', '', '')}
                aspectRatio="4/3"
                compact
                helpText="Default placeholder for missing images"
                required
              />
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Image Guidelines:</strong> Use high-quality images (2000px+ width).
                Store files in <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">/public/images/</code> or use CDN URLs.
              </p>
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salesEmail">Sales Email</Label>
                <Input
                  id="salesEmail"
                  type="email"
                  value={config.contact.salesEmail || ''}
                  onChange={(e) => updateConfig('contact', 'salesEmail', e.target.value)}
                  placeholder="sales@yourproperty.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={config.contact.phone || ''}
                  onChange={(e) => updateConfig('contact', 'phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Textarea
                id="address"
                value={config.contact.address || ''}
                onChange={(e) => updateConfig('contact', 'address', e.target.value)}
                placeholder="123 Beach Drive, Paradise City, PC 12345"
                rows={2}
              />
            </div>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={config.social.website || ''}
                  onChange={(e) => updateConfig('social', 'website', e.target.value)}
                  placeholder="https://www.yourproperty.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL (optional)</Label>
                <Input
                  id="instagram"
                  type="url"
                  value={config.social.instagram || ''}
                  onChange={(e) => updateConfig('social', 'instagram', e.target.value)}
                  placeholder="https://instagram.com/yourproperty"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL (optional)</Label>
                <Input
                  id="facebook"
                  type="url"
                  value={config.social.facebook || ''}
                  onChange={(e) => updateConfig('social', 'facebook', e.target.value)}
                  placeholder="https://facebook.com/yourproperty"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
