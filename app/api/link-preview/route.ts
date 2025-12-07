import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)",
      },
      redirect: "follow",
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extract Open Graph and fallback metadata
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ||
                    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ""
    
    const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ||
                          html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || ""
    
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || ""

    return NextResponse.json({
      title: ogTitle.trim(),
      description: ogDescription.trim(),
      image: ogImage.trim(),
    })
  } catch (error) {
    console.error("Link preview error:", error)
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    )
  }
}
