"use client"

import { useState } from "react"
import { Plus, X, Upload } from "lucide-react"

export default function FileUploadButton({ onClick }) {
  return (
    <div className="fixed top-1/2 -translate-y-28 right-4 z-[501]">
      <button
        onClick={onClick}
        className="bg-white border border-gray-200 text-teal-600 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label="Upload file"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}