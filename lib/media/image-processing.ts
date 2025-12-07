/**
 * Client-side image processing utilities
 * Used for generating thumbnails and previews before upload
 * or as fallback when Edge Function processing is unavailable
 */

export interface ProcessedImage {
  thumbnail: Blob
  preview: Blob
  metadata: {
    width: number
    height: number
    aspectRatio: number
  }
}

/**
 * Process an image file to generate thumbnail and preview
 */
export async function processImageFile(
  file: File
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = async () => {
      URL.revokeObjectURL(url)

      try {
        // Get original dimensions
        const originalWidth = img.width
        const originalHeight = img.height
        const aspectRatio = originalWidth / originalHeight

        // Generate thumbnail (400x300 cover)
        const thumbnail = await resizeImage(img, 400, 300, "cover")

        // Generate preview (1200x800 contain)
        const preview = await resizeImage(img, 1200, 800, "contain")

        resolve({
          thumbnail,
          preview,
          metadata: {
            width: originalWidth,
            height: originalHeight,
            aspectRatio,
          },
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Resize image using canvas
 */
async function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  fit: "contain" | "cover" = "contain"
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  let { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight,
    fit
  )

  canvas.width = fit === "cover" ? maxWidth : width
  canvas.height = fit === "cover" ? maxHeight : height

  if (fit === "cover") {
    // Center crop for cover
    const scale = Math.max(maxWidth / img.width, maxHeight / img.height)
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale
    const x = (maxWidth - scaledWidth) / 2
    const y = (maxHeight - scaledHeight) / 2

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
  } else {
    // Contain - fit entire image
    ctx.drawImage(img, 0, 0, width, height)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob"))
        }
      },
      "image/jpeg",
      0.85
    )
  })
}

/**
 * Calculate dimensions for resize
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
  fit: "contain" | "cover"
): { width: number; height: number } {
  const aspectRatio = width / height

  if (fit === "contain") {
    // Fit inside bounds
    if (width > height) {
      if (width > maxWidth) {
        return {
          width: maxWidth,
          height: maxWidth / aspectRatio,
        }
      }
    } else {
      if (height > maxHeight) {
        return {
          width: maxHeight * aspectRatio,
          height: maxHeight,
        }
      }
    }
    return { width, height }
  } else {
    // Cover bounds
    const scale = Math.max(maxWidth / width, maxHeight / height)
    return {
      width: width * scale,
      height: height * scale,
    }
  }
}

/**
 * Generate a simple blurhash-style placeholder
 * (Simplified version - use actual blurhash library in production)
 */
export function generatePlaceholder(
  width: number = 32,
  height: number = 24
): string {
  // Return base64 encoded tiny image
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return ""

  // Fill with neutral gray
  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL("image/jpeg", 0.1)
}

/**
 * Extract EXIF data from image file
 */
export async function extractExif(file: File): Promise<Record<string, unknown>> {
  // TODO: Implement EXIF extraction
  // Use exif-js or piexifjs library
  return {
    extracted: false,
    message: "EXIF extraction not yet implemented",
  }
}

/**
 * Validate image file
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Supported: JPEG, PNG, WebP, GIF`,
    }
  }

  // Check file size (max 50MB for images)
  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image too large. Maximum size: 50MB`,
    }
  }

  return { valid: true }
}
