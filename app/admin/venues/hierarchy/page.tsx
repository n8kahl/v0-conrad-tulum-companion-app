"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, Plus, Edit, Map, Building, Layers } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface VenueNode {
  id: string
  name: string
  venue_type: string
  map_image_url: string | null
  is_active: boolean
  parent_venue_id: string | null
  children?: VenueNode[]
}

export default function VenueHierarchyPage() {
  const supabase = createClient()
  const [venues, setVenues] = useState<VenueNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, venue_type, map_image_url, is_active, parent_venue_id")
      .order("venue_type")
      .order("name")

    if (data) {
      const tree = buildTree(data as VenueNode[])
      setVenues(tree)
    }
    setIsLoading(false)
  }

  const buildTree = (flatVenues: VenueNode[]): VenueNode[] => {
    const map: Record<string, VenueNode> = {}
    const roots: VenueNode[] = []

    // Initialize all nodes
    flatVenues.forEach((venue) => {
      map[venue.id] = { ...venue, children: [] }
    })

    // Build tree structure
    flatVenues.forEach((venue) => {
      const node = map[venue.id]
      if (venue.parent_venue_id) {
        const parent = map[venue.parent_venue_id]
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const toggleExpand = (venueId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(venueId)) {
        next.delete(venueId)
      } else {
        next.add(venueId)
      }
      return next
    })
  }

  const VenueTreeNode = ({ venue, level = 0 }: { venue: VenueNode; level?: number }) => {
    const hasChildren = venue.children && venue.children.length > 0
    const isExpanded = expandedNodes.has(venue.id)

    const getIcon = () => {
      switch (venue.venue_type) {
        case "property":
          return <Building className="h-4 w-4 text-blue-500" />
        case "building":
          return <Building className="h-4 w-4 text-green-500" />
        case "floor":
          return <Layers className="h-4 w-4 text-purple-500" />
        default:
          return <Map className="h-4 w-4 text-orange-500" />
      }
    }

    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors",
            !venue.is_active && "opacity-60"
          )}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => toggleExpand(venue.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {getIcon()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{venue.name}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {venue.venue_type.replace("_", " ")}
              </Badge>
              {venue.map_image_url && (
                <Badge variant="secondary" className="text-xs">
                  <Map className="h-3 w-3 mr-1" />
                  Has Map
                </Badge>
              )}
              {!venue.is_active && (
                <Badge variant="destructive" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            {hasChildren && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {venue.children!.length} {venue.children!.length === 1 ? "child" : "children"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {venue.map_image_url && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/venues/${venue.id}/map`}>
                  <Map className="h-3 w-3 mr-1" />
                  View Map
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/venues/${venue.id}`}>
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {venue.children!.map((child) => (
              <VenueTreeNode key={child.id} venue={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const getStats = () => {
    const count = (nodes: VenueNode[]): { total: number; withMaps: number; byType: Record<string, number> } => {
      let total = 0
      let withMaps = 0
      const byType: Record<string, number> = {}

      const traverse = (node: VenueNode) => {
        total++
        if (node.map_image_url) withMaps++
        byType[node.venue_type] = (byType[node.venue_type] || 0) + 1
        node.children?.forEach(traverse)
      }

      nodes.forEach(traverse)
      return { total, withMaps, byType }
    }

    return count(venues)
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">Venue Hierarchy</h1>
          <p className="text-muted-foreground mt-1">
            Manage the property structure and maps
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/venues/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Venue
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Venues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Maps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withMaps}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.withMaps / stats.total) * 100)}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Buildings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byType.building || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.byType.meeting_room || 0) +
                (stats.byType.ballroom || 0) +
                (stats.byType.restaurant || 0) +
                (stats.byType.outdoor || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Venue Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Structure</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {venues.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No venues created yet</p>
              <Button className="mt-4" asChild>
                <Link href="/admin/venues/new">Create Your First Venue</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {venues.map((venue) => (
                <VenueTreeNode key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
