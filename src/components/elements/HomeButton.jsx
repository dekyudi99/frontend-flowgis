// import Home from '@/UserPages/HomePage'
import { LucideHome } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

export const HomeButton = () => {
  return (
    <div className="fixed top-1/2 -translate-y-36 right-4 z-50 flex items-center gap-2">
        {/* className="fixed top-20 right-4 z-1000" */}
        <Link to ="/">
            <button
                // onClick={() => setIsOpen(false)}
                className="bg-white border border-gray-200 text-teal-600 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                <LucideHome className="h-5 w-5" />
            </button>
        </Link>
    </div>
  )
}
