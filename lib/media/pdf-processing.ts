/**
 * PDF processing utilities
 * For extracting text, generating thumbnails, detecting tables
 */

export interface PDFMetadata {
  pageCount: number
  title?: string
  author?: string
  subject?: string
  keywords?: string
}

export interface PDFPage {
  pageNumber: number
  text: string
  thumbnail?: string
  hasImages: boolean
  hasTables: boolean
}

/**
 * Extract basic PDF metadata
 * Requires pdf-lib or pdfjs-dist library
 */
export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  // TODO: Implement with pdf-lib or pdfjs-dist
  // For now, return basic info
  return {
    pageCount: 1,
    title: file.name,
  }
}

/**
 * Extract text from PDF
 * Requires pdfjs-dist library
 */
export async function extractPDFText(file: File): Promise<string> {
  // TODO: Implement with pdfjs-dist
  // import * as pdfjsLib from 'pdfjs-dist'
  return "PDF text extraction not yet implemented"
}

/**
 * Generate thumbnail from first page
 */
export async function generatePDFThumbnail(
  file: File,
  pageNumber: number = 1
): Promise<Blob | null> {
  // TODO: Implement with pdfjs-dist
  // Render first page to canvas, convert to blob
  return null
}

/**
 * Detect if PDF page contains tables
 */
export function detectTables(pageText: string): boolean {
  // Simple heuristic: look for grid-like patterns
  const lines = pageText.split("\n")
  let consecutiveTabLines = 0

  for (const line of lines) {
    // Lines with multiple tabs/spaces might be table rows
    if (line.includes("\t") || /\s{2,}/.test(line)) {
      consecutiveTabLines++
      if (consecutiveTabLines >= 3) {
        return true
      }
    } else {
      consecutiveTabLines = 0
    }
  }

  return false
}

/**
 * Extract tables from PDF page text
 */
export interface ExtractedTable {
  name?: string
  headers: string[]
  rows: string[][]
}

export function extractTables(pageText: string): ExtractedTable[] {
  // TODO: Implement proper table extraction
  // Use heuristics or ML-based table detection
  const tables: ExtractedTable[] = []

  // Look for capacity-style tables
  if (pageText.toLowerCase().includes("capacity") || 
      pageText.toLowerCase().includes("seating")) {
    // Basic pattern matching for capacity tables
    const lines = pageText.split("\n").filter(l => l.trim())
    
    // Try to find table-like structure
    const potentialHeaders = lines.find(line => 
      /setup|configuration|style/i.test(line)
    )
    
    if (potentialHeaders) {
      tables.push({
        name: "Capacity Chart",
        headers: ["Setup", "Capacity"],
        rows: [], // TODO: Extract actual rows
      })
    }
  }

  return tables
}

/**
 * Classify PDF document type
 */
export function classifyPDFDocument(filename: string, text: string): string {
  const lower = filename.toLowerCase() + " " + text.toLowerCase()

  if (lower.includes("floorplan") || lower.includes("floor plan")) {
    return "floorplan"
  }
  if (lower.includes("capacity") || lower.includes("seating chart")) {
    return "capacity_chart"
  }
  if (lower.includes("menu") && (lower.includes("food") || lower.includes("beverage"))) {
    return "menu"
  }
  if (lower.includes("contract") || lower.includes("agreement")) {
    return "contract"
  }
  if (lower.includes("brochure") || lower.includes("factsheet")) {
    return "marketing"
  }
  if (lower.includes("proposal") || lower.includes("quote")) {
    return "proposal"
  }

  return "document"
}

/**
 * Generate tags from PDF content
 */
export function generatePDFTags(filename: string, text: string): string[] {
  const tags = new Set<string>()
  const content = (filename + " " + text).toLowerCase()

  // Venue types
  if (content.includes("ballroom")) tags.add("ballroom")
  if (content.includes("meeting room")) tags.add("meeting")
  if (content.includes("conference")) tags.add("conference")
  if (content.includes("wedding")) tags.add("wedding")
  if (content.includes("spa")) tags.add("spa")
  if (content.includes("restaurant") || content.includes("dining")) tags.add("dining")
  if (content.includes("pool")) tags.add("pool")
  if (content.includes("beach")) tags.add("beach")

  // Document types
  if (content.includes("floorplan")) tags.add("floorplan")
  if (content.includes("capacity")) tags.add("capacity")
  if (content.includes("menu")) tags.add("menu")
  if (content.includes("pricing")) tags.add("pricing")
  if (content.includes("factsheet")) tags.add("factsheet")

  // Event types
  if (content.includes("mice")) tags.add("mice")
  if (content.includes("incentive")) tags.add("incentive")
  if (content.includes("corporate")) tags.add("corporate")
  if (content.includes("social")) tags.add("social")

  return Array.from(tags)
}

/**
 * Validate PDF file
 */
export function validatePDF(file: File): { valid: boolean; error?: string } {
  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "File must be a PDF",
    }
  }

  // Check file size (max 100MB for PDFs)
  const maxSize = 100 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "PDF too large. Maximum size: 100MB",
    }
  }

  return { valid: true }
}

/**
 * Check if PDF is searchable (has text layer)
 */
export async function isPDFSearchable(file: File): Promise<boolean> {
  // TODO: Implement by extracting text and checking if non-empty
  // If empty, it's likely a scanned document (image-only PDF)
  return true
}
