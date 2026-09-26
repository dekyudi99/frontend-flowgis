import { useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { baseMaps } from "@/lib/basemap"
import { useTranslation } from "react-i18next";

export default function BasemapLayout({ isOpen, onClose, onSelectBasemap, selectedBasemapId }) {
  const { t } = useTranslation();
    const scrollContainerRef = useRef(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/15 z-[999] transition-opacity duration-300" onClick={onClose} />

      {/* Popup Container */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl p-6 mx-4 mb-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-teal-700">{t('basemapPopup.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label={t('basemapPopup.closeAriaLabel')}
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label={t('basemapPopup.scrollLeft')}
            >
              <ChevronLeft className="w-6 h-6 text-teal-600" />
            </button>

            {/* Basemap Grid */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-12 py-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {baseMaps.map((basemap) => (
                <div
                  key={basemap.id}
                  onClick={() => onSelectBasemap(basemap)}
                  className={`flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedBasemapId === basemap.id ? "ring-4 ring-teal-500 rounded-lg" : ""
                  }`}
                >
                  <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-teal-400 transition-colors duration-200">
                    <img
                      src={basemap.imageUrl || "/placeholder.svg?height=160&width=160&query=map"}
                      alt={t(`basemapPopup.maps.${basemap.id}`)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-gray-700 truncate">{basemap.name}</p>
                </div>
              ))}
            </div>

            {/* Right Arrow */}
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label={t('basemapPopup.scrollRight')}
            >
              <ChevronRight className="w-6 h-6 text-teal-600" />
            </button>
          </div>
        </div>
      </div>

    <style>
    {`
        .scrollbar-hide::-webkit-scrollbar {
        display: none;
        }
        .scrollbar-hide {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
        }
    `}
    </style>
    </>
  )
}
