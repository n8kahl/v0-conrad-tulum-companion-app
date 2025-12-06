"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Save, ArrowLeft, FileText, GripVertical } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Collection {
  id: string
  property_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  asset_ids: string[]
  sort_order: number
  is_active: boolean
}

interface Asset {
  id: string
  name: string
  asset_type: string
  category: string
  thumbnail_url: string | null
}

interface CollectionFormProps {
  collection?: Collection
  propertyId: string
  mode: "create" | "edit"
}

export function CollectionForm({ collection, propertyId, mode }: CollectionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [allAssets, setAllAssets] = useState<Asset[]>([])

  // Form state
  const [name, setName] = useState(collection?.name || "")
  const [description, setDescription] = useState(collection?.description || "")
  const [coverImageUrl, setCoverImageUrl] = useState(collection?.cover_image_url || "")
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(collection?.asset_ids || [])
  const [sortOrder, setSortOrder] = useState(collection?.sort_order || 0)
  const [isActive, setIsActive] = useState(collection?.is_active ?? true)
  const [searchQuery, setSearchQuery] = useState("")

  // Load all assets on mount
  useEffect(() => {
    async function loadAssets() {
      const { data } = await supabase
        .from("assets")
        .select("id, name, asset_type, category, thumbnail_url")
        .eq("is_active", true)
        .order("name")

      setAllAssets(data || [])
      setIsLoadingAssets(false)
    }
    loadAssets()
  }, [supabase])

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  const removeAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => prev.filter((id) => id !== assetId))
  }

  const moveAsset = (index: number, direction: "up" | "down") => {
    const newIds = [...selectedAssetIds]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newIds.length) return
    ;[newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]]
    setSelectedAssetIds(newIds)
  }

  const filteredAssets = allAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedAssets = selectedAssetIds
    .map((id) => allAssets.find((a) => a.id === id))
    .filter((a): a is Asset => a !== undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const collectionData = {
        property_id: propertyId,
        name,
        description: description || null,
        cover_image_url: coverImageUrl || null,
        asset_ids: selectedAssetIds,
        sort_order: sortOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      }

      if (mode === "create") {
        const { error } = await supabase.from("collections").insert(collectionData)
        if (error) throw error
        toast.success("Collection created successfully")
      } else {
        const { error } = await supabase
          .from("collections")
          .update(collectionData)
          .eq("id", collection?.id)
        if (error) throw error
        toast.success("Collection updated successfully")
      }

      router.push("/admin/collections")
      router.refresh()
    } catch (error) {
      console.error("Error saving collection:", error)
      toast.error("Failed to save collection")
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
            <Link href="/admin/collections">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-foreground">
              {mode === "create" ? "Create Collection" : `Edit ${collection?.name}`}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === "create"
                ? "Create a curated bundle of assets"
                : "Update collection details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/collections">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "create" ? "Create Collection" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wedding Planning Kit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's included in this collection..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image URL</Label>
              <Input
                id="cover_image"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
              {coverImageUrl && (
                <div className="mt-2">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-48 h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
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
            </div>
          </CardContent>
        </Card>

        {/* Selected Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Selected Assets ({selectedAssetIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No assets selected. Choose from the list below.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedAssets.map((asset, index) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {asset.thumbnail_url ? (
                        <Image
                          src={asset.thumbnail_url}
                          alt={asset.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {asset.category} · {asset.asset_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveAsset(index, "up")}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveAsset(index, "down")}
                        disabled={index === selectedAssets.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeAsset(asset.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Assets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Available Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
            />

            {isLoadingAssets ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetIds.includes(asset.id)
                  return (
                    <div
                      key={asset.id}
                      onClick={() => toggleAsset(asset.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        {asset.thumbnail_url ? (
                          <Image
                            src={asset.thumbnail_url}
                            alt={asset.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{asset.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {asset.category}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
