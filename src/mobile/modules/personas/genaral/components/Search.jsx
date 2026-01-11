import React, { useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'

export default function Search({ isOpen, onClose, onSearch }) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch?.(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="p-4 border-b border-zinc-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-10 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
              >
                <X size={18} className="text-zinc-400" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 text-zinc-600 font-medium"
          >
            Cancel
          </button>
        </form>
      </div>

      <div className="p-4">
        <p className="text-sm text-zinc-500 text-center mt-8">
          {query ? 'Searching...' : 'Enter a search term'}
        </p>
      </div>
    </div>
  )
}
