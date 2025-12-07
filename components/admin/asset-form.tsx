"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Plus, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { AssetMediaManager } from "./asset-media-manager"
import type { AssetMediaLink } from "@/lib/supabase/types"

const assetTypes = [
  { value: "pdf", label: "PDF" },
  { value: "flipbook", label: "Flipbook" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "virtual_tour", label: "Virtual Tour" },
  { value: "diagram", label: "Diagram" },
]

const categories = [
  { value: "sales", label: "Sales" },
  { value: "weddings", label: "Weddings" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "events", label: "Events" },
  { value: "marketing", label: "Marketing" },
]

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "both", label: "Both (Bilingual)" },
]

const urlFields = [
  { key: "flipbook_en", label: "Flipbook URL (English)" },
  { key: "flipbook_es", label: "Flipbook URL (Spanish)" },
  { key: "pdf", label: "PDF Download URL" },
  { key: "video", label: "Video URL" },
  { key: "virtual_tour", label: "Virtual Tour URL" },
]

const commonTags = [
  "factsheet",
  "brochure",
  "floorplan",
  "menu",
  "pricing",
  "packages",
  "gallery",
  "overview",
]

interface Asset {
  id: string
  property_id: string
  name: string
  asset_type: string
  category: string
  language: string
  urls: Record<string, string>
  thumbnail_url: string | null
  tags: string[]
  description: string | null
  sort_order: number
  is_active: boolean
  is_featured?: boolean
}

interface AssetFormProps {
  asset?: Asset
  propertyId: string
  mode: "create" | "edit"
}

export function AssetForm({ asset, propertyId, mode }: AssetFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaLinks, setMediaLinks] = useState<AssetMediaLink[]>([])

  // Fetch media links if editing
  useEffect(() => {
    if (asset?.id) {
      const fetchMedia = async () => {
        const { data, error } = await supabase
          .from("asset_media")
          .select("*")
          .eq("asset_id", asset.id)
        
        if (data) {
          setMediaLinks(data as AssetMediaLink[])
        }
      }
      fetchMedia()
    }
  }, [asset?.id, supabase])

  // Form state
  const [name, setName] = useState(asset?.name || "")
  const [assetType, setAssetType] = useState(asset?.asset_type || "flipbook")
  const [category, setCategory] = useState(asset?.category || "sales")
  const [language, setLanguage] = useState(asset?.language || "en")
  const [description, setDescription] = useState(asset?.description || "")
  const [tags, setTags] = useState<string[]>([...new Set(asset?.tags || [])])
  const [newTag, setNewTag] = useState("")
  const [sortOrder, setSortOrder] = useState(asset?.sort_order || 0)
  const [isActive, setIsActive] = useState(asset?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(asset?.is_featured ?? false)

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
      setTags((prev) => [...prev, newTag.trim().toLowerCase()])
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const assetData = {
        property_id: propertyId,
        name,
        asset_type: assetType,
        category,
        language,
        description: description || null,
        urls: {}, // Legacy
        thumbnail_url: null, // Legacy
        tags,
        sort_order: sortOrder,
        is_active: isActive,
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      }

      let savedAssetId = asset?.id

      if (mode === "create") {
        const { data, error } = await supabase
          .from("assets")
          .insert(assetData)
          .select()
          .single()
        
        if (error) throw error
        savedAssetId = data.id
        toast.success("Asset created successfully")
      } else {
        const { error } = await supabase
          .from("assets")
          .update(assetData)
          .eq("id", asset?.id)
        
        if (error) throw error
        toast.success("Asset updated successfully")
      }

      // Save media links
      if (savedAssetId) {
        // Delete existing
        await supabase.from("asset_media").delete().eq("asset_id", savedAssetId)
        
        // Insert new
        if (mediaLinks.length > 0) {
          const linksToInsert = mediaLinks.map(link => ({
            asset_id: savedAssetId,
            media_id: link.media_id,
            role: link.role,
            language: link.language,
            version: link.version,
            is_current: link.is_current
          }))
          
          const { error: mediaError } = await supabase
            .from("asset_media")
            .insert(linksToInsert)
            
          if (mediaError) {
            console.error("Error saving media:", mediaError)
            toast.error("Asset saved but media update failed")
          }
        }
      }

      router.push("/admin/assets")
      router.refresh()
    } catch (error) {
      console.error("Error saving asset:", error)
      toast.error("Failed to save asset")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/assets">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-foreground">
              {mode === "create" ? "Add New Asset" : `Edit ${asset?.name}`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === "create"
                ? "Upload a new sales material or resource"
                : "Update asset details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/assets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "create" ? "Create Asset" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hotel Factsheet 2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Asset Type *</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this asset..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_active" className="font-normal">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_featured" className="font-normal">
                  Featured
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Manager */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Media & Files</CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "create" ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <p>Save the asset first to add files.</p>
              </div>
            ) : (
              <AssetMediaManager
                assetId={asset!.id}
                propertyId={propertyId}
                initialMedia={mediaLinks}
                onChange={setMediaLinks}
              />
            )}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {commonTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer select-none capitalize"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add custom tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomTag()
                  }
                }}
              />
              <Button type="button" onClick={addCustomTag} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground mr-2">Selected:</span>
                {tags.map((tag, index) => (
                  <Badge
                    key={`${tag}-${index}`}
                    variant="secondary"
                    className="capitalize gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
