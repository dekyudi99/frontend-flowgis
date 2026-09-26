import { useState } from "react"
import { Search, X } from "lucide-react"

export default function SearchButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
  }

  return (
    <div className="fixed top-1/2 -translate-y-64 right-4 z-50 flex items-center gap-2">
      {/* Search Input - appears when open */}
      {isOpen && (
        <form onSubmit={handleSearch} className="animate-in slide-in-from-right duration-300">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find the name of the region/place..."
              className="w-64 px-4 py-2.5 pr-10 bg-white border-2 border-teal-500 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Search Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-200 text-teal-600 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        aria-label={isOpen ? "Close search" : "Open search"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>
    </div>
  )
}
