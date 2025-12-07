"use client"

import { AssetCard } from "@/components/public/asset-card"
import type { Asset } from "@/lib/supabase/types"

interface AssetCarouselProps {
  assets: Asset[]
}

export function AssetCarousel({ assets }: AssetCarouselProps) {
  return (
    <div className="relative -mx-6 px-6">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
        {assets.map((asset) => (
          <div key={asset.id} className="flex-shrink-0 w-[260px] snap-start">
            <AssetCard asset={asset} variant="compact" />
          </div>
        ))}
      </div>
    </div>
  )
}
