import type { NextRequest } from "next/server"

const VIDEO_URL = "https://conradtulumrivieramaya.com/wp-content/uploads/2024/08/home.mp4"
const UPSTREAM_HEADERS = {
  Referer: "https://conradtulumrivieramaya.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0",
  Accept: "*/*",
}

export async function GET(request: NextRequest) {
  const range = request.headers.get("range") || undefined

  const upstream = await fetch(VIDEO_URL, {
    headers: {
      ...UPSTREAM_HEADERS,
      ...(range ? { Range: range } : {}),
    },
  })

  if (!upstream.ok || !upstream.body) {
    return new Response("Unable to fetch video", { status: upstream.status })
  }

  const headers = new Headers()
  const contentType = upstream.headers.get("content-type")
  const contentLength = upstream.headers.get("content-length")
  const contentRange = upstream.headers.get("content-range")

  if (contentType) headers.set("content-type", contentType)
  if (contentLength) headers.set("content-length", contentLength)
  if (contentRange) headers.set("content-range", contentRange)

  headers.set("cache-control", "public, max-age=0, s-maxage=86400")

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
