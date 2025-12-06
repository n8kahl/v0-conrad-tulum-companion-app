import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-svh bg-background">
      <AdminSidebar user={user} />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminHeader user={user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
