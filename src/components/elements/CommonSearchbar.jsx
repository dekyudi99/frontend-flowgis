import { Search } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export default function CommonSearchBar() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
    // Add search logic here(future)
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold text-teal-700 mb-8">
        {/* Search for Information */}
        {t('searchBar.title')}
      </h1>

      <form onSubmit={handleSearch} className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchBar.placeholder')}
            className="w-full px-6 py-4 pr-14 text-lg rounded-full border-2 border-teal-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300 shadow-lg hover:shadow-xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-teal-600 text-white rounded-full hover:bg-blue-600 transition-all duration-300 hover:scale-110"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
