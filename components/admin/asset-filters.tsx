"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const categories = [
  { value: "all", label: "All Categories" },
  { value: "sales", label: "Sales" },
  { value: "weddings", label: "Weddings" },
  { value: "spa", label: "Spa" },
  { value: "events", label: "Events" },
  { value: "marketing", label: "Marketing" },
]

const assetTypes = [
  { value: "all", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "flipbook", label: "Flipbook" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "virtual_tour", label: "Virtual Tour" },
  { value: "diagram", label: "Diagram" },
]

export function AssetFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") || "all"
  const currentType = searchParams.get("type") || "all"
  const currentSearch = searchParams.get("search") || ""

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/assets?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/admin/assets")
  }

  const hasFilters = currentCategory !== "all" || currentType !== "all" || currentSearch

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search assets..."
          value={currentSearch}
          onChange={(e) => updateFilters("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Filter */}
      <Select value={currentCategory} onValueChange={(value) => updateFilters("category", value)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select value={currentType} onValueChange={(value) => updateFilters("type", value)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {assetTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
