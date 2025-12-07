"use client"

import { useState, useEffect } from "react"
import { X, FileText, Table as TableIcon, Image as ImageIcon, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { MediaLibraryItem, PDFExtraction } from "@/lib/supabase/types"

interface PDFPreviewProps {
  isOpen: boolean
  onClose: () => void
  mediaItem: MediaLibraryItem | null
}

export function PDFPreview({ isOpen, onClose, mediaItem }: PDFPreviewProps) {
  const [extractions, setExtractions] = useState<PDFExtraction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPage, setSelectedPage] = useState<number>(1)
  const [viewMode, setViewMode] = useState<"preview" | "data">("preview")

  useEffect(() => {
    if (isOpen && mediaItem) {
      fetchExtractions()
    } else {
      setExtractions([])
      setSelectedPage(1)
    }
  }, [isOpen, mediaItem])

  const fetchExtractions = async () => {
    if (!mediaItem) return
    
    setIsLoading(true)
    try {
      // In a real app, this would be a specific endpoint or a join query
      // For now, we'll simulate fetching extractions or use a placeholder endpoint
      // Assuming we have an endpoint /api/media/[id]/extractions
      const response = await fetch(`/api/media/${mediaItem.id}/extractions`)
      if (response.ok) {
        const data = await response.json()
        setExtractions(data.extractions || [])
      }
    } catch (error) {
      console.error("Failed to fetch PDF extractions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mediaItem) return null

  const currentPageData = extractions.find(e => e.page_number === selectedPage)
  const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${mediaItem.storage_path}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span className="truncate max-w-md">{mediaItem.original_filename}</span>
              <Badge variant="outline" className="ml-2">
                {mediaItem.file_size_bytes ? `${(mediaItem.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : 'PDF'}
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar - Page Thumbnails */}
          <div className="w-64 border-r flex flex-col bg-gray-50">
            <div className="p-4 border-b">
              <h3 className="font-medium text-sm text-gray-500">Pages ({extractions.length || 1})</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {extractions.length > 0 ? (
                  extractions.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPage(page.page_number)}
                      className={cn(
                        "w-full flex flex-col gap-2 p-2 rounded-lg border transition-all text-left",
                        selectedPage === page.page_number
                          ? "border-primary ring-1 ring-primary bg-white shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                      )}
                    >
                      <div className="aspect-[3/4] bg-gray-200 rounded overflow-hidden relative">
                        {page.page_thumbnail_path ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${page.page_thumbnail_path}`}
                            alt={`Page ${page.page_number}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                          {page.page_number}
                        </div>
                      </div>
                      {page.content_type && (
                        <Badge variant="secondary" className="text-[10px] w-fit">
                          {page.content_type}
                        </Badge>
                      )}
                    </button>
                  ))
                ) : (
                  // Fallback if no extractions yet
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>No page previews available.</p>
                    <p className="mt-2 text-xs">Processing might be in progress.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="border-b px-6 py-2 flex items-center justify-between">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="preview">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="data">
                    <TableIcon className="h-4 w-4 mr-2" />
                    Extracted Data
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={selectedPage <= 1}
                  onClick={() => setSelectedPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {selectedPage}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={selectedPage >= (extractions.length || 1)}
                  onClick={() => setSelectedPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-gray-100">
              {viewMode === "preview" ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                  {currentPageData?.page_thumbnail_path ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-library/${currentPageData.page_thumbnail_path}`}
                      alt={`Page ${selectedPage}`}
                      className="max-w-full max-h-full object-contain shadow-lg"
                    />
                  ) : (
                    <iframe
                      src={`${pdfUrl}#page=${selectedPage}`}
                      className="w-full h-full rounded shadow-sm bg-white"
                      title="PDF Preview"
                    />
                  )}
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-8 max-w-3xl mx-auto space-y-8">
                    {currentPageData ? (
                      <>
                        {/* Tables */}
                        {currentPageData.tables && currentPageData.tables.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <TableIcon className="h-5 w-5" />
                              Extracted Tables
                            </h3>
                            {currentPageData.tables.map((table, idx) => (
                              <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                {table.name && (
                                  <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm">
                                    {table.name}
                                  </div>
                                )}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-gray-50 border-b">
                                        {table.headers.map((header, hIdx) => (
                                          <th key={hIdx} className="px-4 py-2 text-left font-medium text-gray-500">
                                            {header}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {table.rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                          {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-2">
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text */}
                        {currentPageData.page_text && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Extracted Text
                            </h3>
                            <div className="bg-white p-6 rounded-lg border shadow-sm whitespace-pre-wrap font-mono text-sm text-gray-600">
                              {currentPageData.page_text}
                            </div>
                          </div>
                        )}

                        {!currentPageData.tables?.length && !currentPageData.page_text && (
                          <div className="text-center py-12 text-gray-500">
                            No data extracted for this page.
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Select a page to view extracted data.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
