"use client"

import type React from "react"

import type { Asset } from "@/lib/supabase/types"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, Trash2, Save, Loader2, FileText, Video, ImageIcon, Globe, Layout } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const assetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  flipbook: Layout,
  image: ImageIcon,
  video: Video,
  virtual_tour: Globe,
  diagram: Layout,
}

interface AssetDetailViewProps {
  asset: Asset
}

export function AssetDetailView({ asset: initialAsset }: AssetDetailViewProps) {
  const router = useRouter()
  const [asset, setAsset] = useState(initialAsset)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const TypeIcon = assetTypeIcons[asset.asset_type] || FileText

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("assets")
      .update({
        name: asset.name,
        description: asset.description,
        category: asset.category,
        language: asset.language,
        tags: asset.tags,
        urls: asset.urls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", asset.id)

    setIsSaving(false)
    if (!error) {
      router.refresh()
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from("assets").delete().eq("id", asset.id)

    if (!error) {
      router.push("/admin/assets")
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/assets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-light text-foreground">{asset.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit asset details</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 bg-transparent">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{asset.name}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive">
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] rounded-lg bg-muted overflow-hidden">
              {asset.thumbnail_url ? (
                <Image src={asset.thumbnail_url || "/placeholder.svg"} alt={asset.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <TypeIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary">{asset.asset_type.replace("_", " ")}</Badge>
              <Badge variant="outline" className="uppercase">
                {asset.language}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Details Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={asset.name} onChange={(e) => setAsset({ ...asset, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={asset.category}
                  onValueChange={(value) => setAsset({ ...asset, category: value as Asset["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="weddings">Weddings</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={asset.description || ""}
                onChange={(e) => setAsset({ ...asset, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={asset.tags.join(", ")}
                onChange={(e) =>
                  setAsset({
                    ...asset,
                    tags: e.target.value.split(",").map((t) => t.trim()),
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* URLs */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Asset URLs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(asset.urls).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="capitalize">
                    {key.replace("_", " ")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={key}
                      value={value as string}
                      onChange={(e) =>
                        setAsset({
                          ...asset,
                          urls: { ...asset.urls, [key]: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                    {value && (
                      <Button variant="outline" size="icon" asChild>
                        <a href={value as string} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
