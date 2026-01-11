import React, { useState, useEffect, useRef } from 'react'

// Global search component (Notion-like command palette)
// Props:
// - isOpen: boolean
// - onClose: () => void
// - resources: array of { id, title, url, folder, description, tags }
// - tags: array of tag objects with { _id, name, color }
// - tagMap: map of tag ID to tag data
export default function Search({ isOpen, onClose, resources = [], tags = [], tagMap = {} }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setActive(0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!query) {
      setResults([])
      setActive(0)
      return
    }

    const q = query.trim().toLowerCase()

    const matches = resources
      .map((b) => {
        // Extract tag names for search
        const tagNames = (b.tags || []).map(t => {
          const tagData = typeof t === 'object' ? t : tagMap[t]
          const tagName = typeof tagData?.name === 'object' 
            ? String(tagData.name._id || tagData.name)
            : tagData?.name || t
          return tagName
        }).filter(Boolean).join(' ')

        const folderName = typeof b.folder === 'object' ? b.folder.name : b.folder
        
        const hay = [b.title, folderName, b.description, tagNames, b.url]
          .filter(Boolean)
          .join(' | ')
          .toLowerCase()
        const score = hay.includes(q) ? 1 : 0
        return { score, item: b }
      })
      .filter(r => r.score > 0)
      .map(r => r.item)

    // also search tags list and include resources that have those tags
    const tagMatches = tags.filter(t => {
      const tagName = typeof t === 'object' ? t.name : t
      return typeof tagName === 'string' && tagName.toLowerCase().includes(q)
    })
    const tagIds = tagMatches.map(t => typeof t === 'object' ? t._id : t)
    const fromTags = resources.filter(b => 
      (b.tags || []).some(t => {
        const tagId = typeof t === 'object' ? t._id : t
        return tagIds.includes(tagId)
      })
    )

    const merged = Array.from(new Map([...matches, ...fromTags].map(b => [b._id || b.id, b])).values())
    setResults(merged.slice(0, 25))
    setActive(0)
  }, [query, resources, tags, tagMap])

  const close = () => {
    onClose?.()
    setQuery('')
    setResults([])
  }

  const openItem = (item) => {
    if (!item) return
    if (item.type === 'url' && item.url) {
      window.open(item.url, '_blank');
    } else if (item.type === 'document' && item.file?.path) {
      const filename = item.file.path.split('\\').pop().split('/').pop();
      window.open(`http://localhost:3000/uploads/${filename}`, '_blank');
    }
    close()
  }

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault(); close();
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1))
      scrollIntoView(active + 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault(); setActive(i => Math.max(i - 1, 0))
      scrollIntoView(active - 1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault(); openItem(results[active])
    }
  }

  const scrollIntoView = (index) => {
    const node = listRef.current?.children?.[index]
    if (node) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  const highlight = (text = '', q = '') => {
    if (!q) return text
    const iq = q.trim()
    const idx = text.toLowerCase().indexOf(iq.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.substring(0, idx)}
        <mark className="bg-yellow-100 text-yellow-900 px-0.5">{text.substring(idx, idx + iq.length)}</mark>
        {text.substring(idx + iq.length)}
      </>
    )
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40" onClick={close} />

      <div className="fixed left-1/2 top-20 transform -translate-x-1/2 z-50 w-[min(900px,92%)]">
        <div className="bg-white rounded-lg shadow-lg border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full bg-white text-zinc-900 placeholder-zinc-400 px-3 py-2 rounded-md border border-zinc-200 focus:outline-none focus:ring-0.5 focus:ring-zinc-300 text-sm"
                placeholder="Search bookmarks, folders, tags or keywords..."
                aria-label="Global search"
              />
              <button onClick={close} className="text-zinc-500 hover:text-zinc-700 p-2 rounded">
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <ul ref={listRef} className="divide-y divide-zinc-100">
              {results.length === 0 && query ? (
                <li className="p-4 text-sm text-zinc-500">No results</li>
              ) : results.length === 0 ? (
                <li className="p-4 text-sm text-zinc-500">Type to search...</li>
              ) : (
                results.map((r, idx) => (
                  <li
                    key={r._id || r.id || idx}
                    onClick={() => openItem(r)}
                    className={`cursor-pointer p-2 hover:bg-white flex items-start gap-3 ${idx === active ? 'bg-zinc-50' : ''}`}
                  >
                    {r.type === 'url' ? (
                      <>
                        <img
                          src={getFavicon(r.url)}
                          alt=""
                          className="w-4 h-4 flex-shrink-0 mt-1"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex')
                          }}
                        />
                        <div className="w-4 h-4 rounded bg-zinc-200 flex-shrink-0 mt-1 hidden items-center justify-center text-[8px] text-zinc-600 font-medium">
                          {r.title ? r.title.charAt(0).toUpperCase() : ''}
                        </div>
                      </>
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0 mt-1 text-zinc-500">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm text-zinc-900 truncate">{highlight(r.title, query)}</h3>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{highlight(r.description || r.url, query)}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {/* Display Tags */}
                        {r.tags && r.tags.length > 0 && r.tags.slice(0, 3).map((tag, index) => {
                          const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                          const tagId = typeof tag === 'object' ? tag._id : tag
                          let tagName = typeof tag === 'object' ? tag.name : (tagMap[tag]?.name || tag)
                          
                          // Ensure tagName is always a string, even if it's an object
                          if (typeof tagName === 'object') {
                            tagName = tagName?._id ? String(tagName._id).slice(-6) : 'Tag'
                          }
                          
                          const displayName = String(tagName || tagId || 'Unknown')
                          const bgColor = tagData?.color ? `${tagData.color}20` : '#DBEAFE'
                          const textColor = tagData?.color || '#2563EB'
                          
                          return (
                            <span 
                              key={String(tagId || index)}
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: bgColor, color: textColor }}
                            >
                              {displayName}
                            </span>
                          )
                        })}
                        {r.tags && r.tags.length > 3 && (
                          <span className="text-[10px] text-zinc-400">+{r.tags.length - 3}</span>
                        )}
                        {r.platform && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{r.platform}</span>
                        )}
                        {r.contentType && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">{r.contentType}</span>
                        )}
                        {(r.folder?.name || r.folder) && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded flex items-center gap-0.5">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            {r.folder?.name || r.folder}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-500 transition-opacity">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
