import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
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
          <CardDescription>Basic details about Conrad Tulum Riviera Maya</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Property Name</Label>
              <Input id="propertyName" defaultValue="Conrad Tulum Riviera Maya" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airportCode">Airport Code</Label>
              <Input id="airportCode" defaultValue="CUN" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="Carretera Cancún Tulum 307, Tulum, Quintana Roo, México 77774" />
          </div>
          <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
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
                <div className="h-10 w-10 rounded-lg bg-primary" />
                <Input id="primaryColor" defaultValue="#C4A052" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-lg bg-secondary" />
                <Input id="secondaryColor" defaultValue="#2D2D2D" className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-lg bg-accent" />
                <Input id="accentColor" defaultValue="#D4AF37" className="flex-1" />
              </div>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Save Colors</Button>
        </CardContent>
      </Card>
    </div>
  )
}
