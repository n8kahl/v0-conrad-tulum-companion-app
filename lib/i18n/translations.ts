export type Locale = "en" | "es"

export const translations = {
  en: {
    // Navigation
    collections: "Collections",
    allAssets: "All Materials",
    venues: "Venues",
    salesLogin: "Sales Login",

    // Content Hub
    exploreTitle: "Explore Our Sales & Event Resources",
    exploreSubtitle: "Discover comprehensive materials to help plan your perfect group experience at Conrad Tulum.",
    featuredMaterials: "Featured Materials",
    popularMaterials: "Popular Materials",

    // Asset Detail
    backToLibrary: "Back to Library",
    accessMaterials: "Access Materials",
    downloadPdf: "Download PDF",
    viewFlipbook: "View Flipbook",
    share: "Share",
    shared: "Shared!",
    copied: "Link copied!",

    // Asset Types
    pdf: "PDF",
    flipbook: "Flipbook",
    image: "Image",
    video: "Video",
    virtual_tour: "Virtual Tour",
    diagram: "Diagram",

    // Categories
    sales: "Sales",
    weddings: "Weddings",
    spa: "Spa & Wellness",
    events: "Events",
    marketing: "Marketing",

    // Search
    search: "Search materials...",
    filter: "Filter",
    clearAll: "Clear all",
    clearFilters: "Clear filters",
    noResults: "No materials found",
    noResultsDescription: "Try adjusting your search or filters",
    tryDifferent: "Try a different search term or filter",
    showing: "Showing",
    of: "of",
    for: "for",
    materials: "materials",

    // Venues
    venuesTitle: "Venues & Spaces",
    venuesSubtitle: "Explore our exceptional venues for meetings, events, and celebrations.",
    capacity: "Capacity",
    dimensions: "Dimensions",
    features: "Features",
    viewFloorplan: "View Floorplan",

    // Collections
    resources: "resources",
    explore: "Explore",

    // Footer
    footerAddress: "Carretera Cancun Tulum 307 · Tulum, Quintana Roo, Mexico 77774",
    footerCopyright: "Conrad Hotels & Resorts. All rights reserved.",

    // Language
    switchToSpanish: "Espanol",
    switchToEnglish: "English",
  },
  es: {
    // Navigation
    collections: "Colecciones",
    allAssets: "Todos los Materiales",
    venues: "Espacios",
    salesLogin: "Acceso Ventas",

    // Content Hub
    exploreTitle: "Explora Nuestros Recursos de Ventas y Eventos",
    exploreSubtitle: "Descubre materiales completos para planificar tu experiencia grupal perfecta en Conrad Tulum.",
    featuredMaterials: "Materiales Destacados",
    popularMaterials: "Materiales Populares",

    // Asset Detail
    backToLibrary: "Volver a la Biblioteca",
    accessMaterials: "Acceder a Materiales",
    downloadPdf: "Descargar PDF",
    viewFlipbook: "Ver Flipbook",
    share: "Compartir",
    shared: "Compartido!",
    copied: "Enlace copiado!",

    // Asset Types
    pdf: "PDF",
    flipbook: "Flipbook",
    image: "Imagen",
    video: "Video",
    virtual_tour: "Tour Virtual",
    diagram: "Diagrama",

    // Categories
    sales: "Ventas",
    weddings: "Bodas",
    spa: "Spa y Bienestar",
    events: "Eventos",
    marketing: "Marketing",

    // Search
    search: "Buscar materiales...",
    filter: "Filtrar",
    clearAll: "Limpiar todo",
    clearFilters: "Limpiar filtros",
    noResults: "No se encontraron materiales",
    noResultsDescription: "Intenta ajustar tu busqueda o filtros",
    tryDifferent: "Intenta con otro termino de busqueda o filtro",
    showing: "Mostrando",
    of: "de",
    for: "para",
    materials: "materiales",

    // Venues
    venuesTitle: "Espacios y Salones",
    venuesSubtitle: "Explora nuestros espacios excepcionales para reuniones, eventos y celebraciones.",
    capacity: "Capacidad",
    dimensions: "Dimensiones",
    features: "Caracteristicas",
    viewFloorplan: "Ver Plano",

    // Collections
    resources: "recursos",
    explore: "Explorar",

    // Footer
    footerAddress: "Carretera Cancun Tulum 307 · Tulum, Quintana Roo, Mexico 77774",
    footerCopyright: "Conrad Hotels & Resorts. Todos los derechos reservados.",

    // Language
    switchToSpanish: "Espanol",
    switchToEnglish: "English",
  },
} as const

export type TranslationKey = keyof typeof translations.en
