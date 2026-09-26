"use client"

import { Layers } from "lucide-react"

export const LayerButton = ({ onClick, isOpen }) => {
  return (
    <div className="fixed top-1/2 -translate-y-12 right-4 z-50 flex items-center gap-2">
      <button
        onClick={onClick}
        className="bg-white border border-gray-200 text-teal-600 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label={isOpen ? "Close layers" : "Open layers"}
      >
        <Layers className="h-5 w-5" />
      </button>
    </div>
  )
}
