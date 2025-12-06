"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Building2, Users, Calendar } from "lucide-react"

export default function NewVisitPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_company: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_title: "",
    group_type: "MICE" as const,
    estimated_attendees: "",
    visit_date: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get the first property (Conrad Tulum)
    const { data: property } = await supabase.from("properties").select("id").single()

    if (!property) {
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("site_visits")
      .insert({
        property_id: property.id,
        client_company: formData.client_company,
        client_contact: {
          name: formData.contact_name,
          email: formData.contact_email,
          phone: formData.contact_phone,
          title: formData.contact_title,
        },
        group_type: formData.group_type,
        estimated_attendees: formData.estimated_attendees ? Number.parseInt(formData.estimated_attendees) : null,
        visit_date: formData.visit_date || null,
        notes: formData.notes || null,
        status: "planning",
        created_by: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating site visit:", error)
      setIsLoading(false)
      return
    }

    router.push(`/admin/visits/${data.id}`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/visits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-light text-foreground">New Site Visit</h1>
          <p className="text-muted-foreground text-sm mt-1">Create a new client site inspection</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_company">Company Name *</Label>
              <Input
                id="client_company"
                required
                value={formData.client_company}
                onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_title">Title</Label>
                <Input
                  id="contact_title"
                  value={formData.contact_title}
                  onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                  placeholder="Event Director"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="john@acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="group_type">Group Type *</Label>
                <Select
                  value={formData.group_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, group_type: value as typeof formData.group_type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MICE">MICE</SelectItem>
                    <SelectItem value="incentive">Incentive</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="retreat">Retreat</SelectItem>
                    <SelectItem value="buyout">Buyout</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_attendees">Estimated Attendees</Label>
                <Input
                  id="estimated_attendees"
                  type="number"
                  value={formData.estimated_attendees}
                  onChange={(e) => setFormData({ ...formData, estimated_attendees: e.target.value })}
                  placeholder="150"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Visit Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Visit Date</Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements or interests..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
            <Link href="/admin/visits">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Site Visit"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
