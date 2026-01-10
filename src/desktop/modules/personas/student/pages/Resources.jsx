import React, { useMemo, useState, useEffect } from 'react'
import apiClient from '../../../shared/api/apiClient'
import EditResource from '../components/EditResource'
import MoveToFolder from '../components/MoveToFolder'

function getFavicon(url) {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}`
  } catch (e) {
    return ''
  }
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState(new Set())
  const [selectedTags, setSelectedTags] = useState(new Set())
  const [selectedFolder, setSelectedFolder] = useState('All')
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [tags, setTags] = useState([])
  const [tagMap, setTagMap] = useState({})
  const [folders, setFolders] = useState([])
  const [folderMap, setFolderMap] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState(null)

  // Fetch resources and tags on mount
  useEffect(() => {
    fetchTags()
    fetchFolders()
    fetchResources()
  }, [])

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

  // API Functions
  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags')
      console.log('🔍 Bookmarks - RAW API RESPONSE:', response.data)
      if (response.data.success) {
        const tagsData = response.data.data
        setTags(tagsData)
        
        // Create a map of tag ID to tag data (name and color)
        // Handle case where tag.name might be an ObjectId
        const map = {}
        tagsData.forEach(tag => {
          // Check if tag.name is actually an ObjectId (24 hex characters)
          const isObjectId = typeof tag.name === 'string' && /^[0-9a-f]{24}$/i.test(tag.name)
          
          if (isObjectId) {
            console.warn('⚠️ Bookmarks - Tag name is ObjectId:', tag._id, '->', tag.name)
            // Try to find the actual tag that this ObjectId references
            const referencedTag = tagsData.find(t => t._id === tag.name)
            if (referencedTag) {
              map[tag._id] = { name: referencedTag.name, color: tag.color }
            } else {
              map[tag._id] = { name: `Tag-${tag.name.slice(-6)}`, color: tag.color }
            }
          } else {
            map[tag._id] = { name: tag.name, color: tag.color }
          }
        })
        setTagMap(map)
        console.log('✨ Bookmarks - Tag map created:', map)
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await apiClient.get('/folders')
      if (response.data.success) {
        const foldersData = response.data.data
        setFolders(foldersData)
        
        // Create a map of folder ID to folder name
        const map = {}
        foldersData.forEach(folder => {
          map[folder._id] = folder.name
        })
        setFolderMap(map)
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to view resources')
        setLoading(false)
        return
      }
      
      const response = await apiClient.get('/resources', {
        params: { limit: 1000, populate: 'folder' }
      })
      
      if (response.data.success) {
        setResources(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching resources:', err)
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else {
        setError(err.response?.data?.message || 'Failed to load resources')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateResource = async (id, updates) => {
    try {
      const response = await apiClient.put(`/resources/${id}`, updates)
      if (response.data.success) {
        await fetchResources()
        return response.data.data
      }
    } catch (err) {
      console.error('Error updating resource:', err)
      throw err
    }
  }

  const deleteResource = async (id) => {
    try {
      await apiClient.delete(`/resources/${id}`)
      await fetchResources()
    } catch (err) {
      console.error('Error deleting resource:', err)
      throw err
    }
  }

  // Action Handlers
  const handleEditResource = (resource) => {
    setEditingResource(resource)
    setShowEditModal(true)
  }

  const handleDeleteResource = async (resourceId) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(resourceId)
      } catch (err) {
        alert('Failed to delete resource')
      }
    }
  }

  const handleMoveToFolder = (resource) => {
    setFolderMenuOpen(folderMenuOpen === resource._id ? null : resource._id)
  }

  const handleCopyLink = (resource) => {
    const linkToCopy = resource.type === 'url' && resource.url 
      ? resource.url 
      : resource.type === 'document' && resource.file?.path
      ? `http://localhost:3000/uploads/${resource.file.path.split('\\').pop().split('/').pop()}`
      : null;
    
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy).then(() => {
        alert('Link copied to clipboard!')
      }).catch(() => {
        alert('Failed to copy link')
      })
    } else {
      alert('No link available for this resource')
    }
  }

  const handleToggleFavorite = async (resource) => {
    try {
      await updateResource(resource._id, { isFavorite: !resource.isFavorite })
    } catch (err) {
      alert('Failed to update favorite status')
    }
  }

  const platforms = useMemo(() => ['All', ...Array.from(new Set(resources.map(b => b.metadata?.platform).filter(Boolean)))], [resources])

  const allTags = useMemo(() => {
    const tagSet = new Map()
    resources.forEach(r => {
      (r.tags || []).forEach(tag => {
        const tagId = typeof tag === 'object' ? tag._id : tag
        const tagData = typeof tag === 'object' ? tag : tagMap[tag]
        if (tagId && !tagSet.has(tagId)) {
          tagSet.set(tagId, tagData || { _id: tagId, name: tagId })
        }
      })
    })
    return Array.from(tagSet.values())
  }, [resources, tagMap])
  
  const allFolders = useMemo(() => {
    const folderSet = new Map()
    let hasUncategorized = false
    
    resources.forEach(r => {
      // Extract folder info from multiple possible structures
      let folderId = null
      let folderName = null
      
      if (r.folder) {
        if (typeof r.folder === 'object') {
          folderId = r.folder._id || r.folder.id
          folderName = r.folder.name || folderMap[folderId]
        } else {
          folderId = r.folder
          folderName = folderMap[r.folder] || r.folder
        }
      } else if (r.folderId) {
        if (typeof r.folderId === 'object') {
          folderId = r.folderId._id || r.folderId.id
          folderName = r.folderId.name || folderMap[folderId]
        } else {
          folderId = r.folderId
          folderName = folderMap[r.folderId] || r.folderId
        }
      }
      
      if (folderName && !folderSet.has(folderId || folderName)) {
        folderSet.set(folderId || folderName, folderName)
      } else if (!folderName) {
        hasUncategorized = true
      }
    })
    
    const folders = ['All', ...Array.from(folderSet.values())]
    if (hasUncategorized) {
      folders.push('No Folder')
    }
    return folders
  }, [resources, folderMap])
  const allTypes = useMemo(() => ['document', 'url'], [])

  function toggleSet(setState, value) {
    setState(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter(b => {
      if (platformFilter !== 'All' && b.metadata?.platform !== platformFilter) return false
      
      // Handle folder filtering
      if (selectedFolder !== 'All') {
        // Extract folder name from multiple possible structures
        let resourceFolderName = null
        let folderId = null
        
        if (b.folder) {
          if (typeof b.folder === 'object') {
            folderId = b.folder._id || b.folder.id
            resourceFolderName = b.folder.name || folderMap[folderId]
          } else {
            folderId = b.folder
            resourceFolderName = folderMap[b.folder] || b.folder
          }
        } else if (b.folderId) {
          if (typeof b.folderId === 'object') {
            folderId = b.folderId._id || b.folderId.id
            resourceFolderName = b.folderId.name || folderMap[folderId]
          } else {
            folderId = b.folderId
            resourceFolderName = folderMap[b.folderId] || b.folderId
          }
        }
        
        // Handle 'No Folder' selection
        if (selectedFolder === 'No Folder') {
          if (resourceFolderName) return false
        } else if (resourceFolderName !== selectedFolder) {
          return false
        }
      }
      
      if (selectedTypes.size > 0 && !selectedTypes.has(b.type)) return false
      if (selectedTags.size > 0) {
        const hasTag = (b.tags || []).some(t => {
          const tagId = typeof t === 'object' ? t._id : t
          return selectedTags.has(tagId)
        })
        if (!hasTag) return false
      }
      if (!q) return true
      
      // Search through tags
      const matchesTag = (b.tags || []).some(t => {
        const tagData = typeof t === 'object' ? t : tagMap[t]
        const tagName = typeof tagData?.name === 'object' 
          ? String(tagData.name._id || tagData.name)
          : tagData?.name || t
        return typeof tagName === 'string' && tagName.toLowerCase().includes(q)
      })
      
      return (
        b.title.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.url && b.url.toLowerCase().includes(q)) ||
        matchesTag
      )
    })
  }, [resources, query, platformFilter, selectedTypes, selectedTags, selectedFolder])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={fetchResources}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-900 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #d4d4d8;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a1a1aa;
      }
    `}</style>

    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-900 mb-4">Bookmarks</h1>
      <p className="text-zinc-600 mb-12">Manage your bookmarks here.</p>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 flex-1 shadow-sm hover:border-zinc-300 transition-colors focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-transparent">
          <svg className="w-5 h-5 text-zinc-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookmarks by title, description, or URL..."
            className="bg-transparent outline-none text-sm text-zinc-700 w-full placeholder:text-zinc-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="ml-2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setFilterOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent shadow-sm"
            aria-haspopup="dialog"
            aria-expanded={filterOpen}
            aria-controls="bookmark-filter-panel"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-zinc-700 font-medium">Filters</span>
            { (selectedTypes.size > 0 || selectedTags.size > 0 || selectedFolder !== 'All') && (
              <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
                {selectedTypes.size + selectedTags.size + (selectedFolder !== 'All' ? 1 : 0)}
              </span>
            )}
          </button>

          {filterOpen && (
            <>
              {/* Overlay for outside click */}
              <div
                className="fixed inset-0 z-10"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setFilterOpen(false)}
              />
              <div
                id="bookmark-filter-panel"
                className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg p-5 z-20 animate-fade-in"
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                onKeyDown={e => {
                  if (e.key === 'Escape') setFilterOpen(false)
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base text-zinc-900">Filters</h3>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md p-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Type Filter */}
                <div className="mb-5">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Type</div>
                  <div className="flex gap-2">
                    {allTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => toggleSet(setSelectedTypes, t)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          selectedTypes.has(t)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {selectedTypes.has(t) && (
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="capitalize">{t}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide">Tags</div>
                    {selectedTags.size > 0 && (
                      <button
                        onClick={() => setSelectedTags(new Set())}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {allTags.length === 0 ? (
                    <div className="flex items-center justify-center py-6 px-4 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                      <p className="text-sm text-zinc-400">No tags available</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar p-2">
                      {allTags.map(tag => {
                        const tagId = tag._id || tag
                        const tagName = tag.name || tag
                        const tagColor = tag.color
                        const displayName = typeof tagName === 'object' ? String(tagName._id || tagName) : tagName
                        const isSelected = selectedTags.has(tagId)
                        
                        return (
                          <button
                            key={String(tagId)}
                            onClick={() => toggleSet(setSelectedTags, tagId)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-all focus:outline-none focus:ring-1 focus:ring-offset-1 ${
                              isSelected
                                ? 'ring-1 ring-offset-0 shadow-sm'
                                : 'hover:shadow-sm hover:scale-[1.02]'
                            }`}
                            style={{
                              backgroundColor: isSelected ? tagColor || '#3B82F6' : `${tagColor || '#3B82F6'}15`,
                              color: isSelected ? '#ffffff' : tagColor || '#3B82F6',
                              ringColor: tagColor || '#3B82F6'
                            }}
                            tabIndex={0}
                          >
                            {displayName}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Folder Filter */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide">Folder</div>
                    {selectedFolder !== 'All' && (
                      <button
                        onClick={() => setSelectedFolder('All')}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between border border-zinc-200 rounded-md px-3 py-2 text-sm bg-white hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setFolderDropdownOpen(v => !v)}
                      aria-haspopup="listbox"
                      aria-expanded={folderDropdownOpen ? 'true' : 'false'}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate text-zinc-700">{selectedFolder}</span>
                      </div>
                      <svg className={`w-4 h-4 ml-2 text-zinc-400 transition-transform ${folderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {folderDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setFolderDropdownOpen(false)}
                        />
                        <div className="absolute -left-76 -mt-22 w-full bg-white border border-zinc-200 rounded-md shadow-lg z-30 max-h-48 overflow-auto" role="listbox">
                          {allFolders.map(f => (
                            <button
                              key={f}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors first:rounded-t-md last:rounded-b-md ${
                                selectedFolder === f ? 'bg-blue-50 text-blue-700' : 'text-zinc-700'
                              }`}
                              onClick={() => {
                                setSelectedFolder(f)
                                setFolderDropdownOpen(false)
                              }}
                              role="option"
                              aria-selected={selectedFolder === f}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {f === 'All' ? (
                                    <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                    </svg>
                                  ) : (
                                    <svg className={`w-4 h-4 ${selectedFolder === f ? 'text-blue-600' : 'text-purple-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                  )}
                                  <span>{f}</span>
                                </div>
                                {selectedFolder === f && (
                                  <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-zinc-200">
                  <button
                    onClick={() => {
                      setSelectedTypes(new Set())
                      setSelectedTags(new Set())
                      setSelectedFolder('All')
                    }}
                    className="flex-1 text-sm px-4 py-2 text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="flex-1 text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2 overflow-y-scroll max-h-[calc(100vh-250px)] custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-zinc-500 text-sm">No resources match your search.</div>
        )}

        {filtered.map(resource => (
          <div
            key={resource._id}
            className="group flex items-start gap-3 p-2 rounded hover:bg-zinc-50 cursor-pointer transition-colors relative"
            onClick={() => {
              if (resource.type === 'url' && resource.url) {
                window.open(resource.url, '_blank');
              } else if (resource.type === 'document' && resource.file?.path) {
                const filename = resource.file.path.split('\\').pop().split('/').pop();
                window.open(`http://localhost:3000/uploads/${filename}`, '_blank');
              }
            }}
          >
            {resource.type === 'url' ? (
              <>
                <img
                  src={getFavicon(resource.url)}
                  alt=""
                  className="w-4 h-4 flex-shrink-0 mt-1"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div style={{display:'none'}} className="w-4 h-4 rounded bg-zinc-200 flex-shrink-0 mt-1 items-center justify-center text-[8px] text-zinc-600 font-medium">
                  {resource.title.charAt(0).toUpperCase()}
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
                <h3 className="text-sm text-zinc-900 truncate">{resource.title}</h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{resource.description}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {/* Display Tags */}
                {resource.tags && resource.tags.length > 0 && resource.tags.map((tag, index) => {
                  // Handle both populated tag objects and tag IDs
                  const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                  const tagId = typeof tag === 'object' ? tag._id : tag
                  const tagName = typeof tag === 'object' ? tag.name : (tagMap[tag]?.name || tag)
                  const bgColor = tagData?.color ? `${tagData.color}20` : '#DBEAFE'
                  const textColor = tagData?.color || '#2563EB'
                  
                  // Ensure key and display text are always strings
                  const keyValue = String(tagId || index)
                  const displayName = typeof tagName === 'object' ? String(tagName._id || tagName) : tagName
                  
                  return (
                    <span 
                      key={keyValue}
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      {displayName}
                    </span>
                  )
                })}
                {(resource.folder || resource.folderId) && (() => {
                  let folderName = null
                  if (resource.folder) {
                    if (typeof resource.folder === 'object') {
                      folderName = resource.folder.name || folderMap[resource.folder._id]
                    } else {
                      folderName = folderMap[resource.folder] || resource.folder
                    }
                  } else if (resource.folderId) {
                    if (typeof resource.folderId === 'object') {
                      folderName = resource.folderId.name || folderMap[resource.folderId._id]
                    } else {
                      folderName = folderMap[resource.folderId] || resource.folderId
                    }
                  }
                  
                  return folderName ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      {folderName}
                    </span>
                  ) : null
                })()}
                {resource.isFavorite && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded">
                    ⭐ Favorite
                  </span>
                )}
              </div>
            </div>
            <div className="relative">
              <button 
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-500 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id);
                }}
                aria-label="Open actions menu"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {actionMenuOpen === resource._id && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-zinc-50 border border-zinc-200 rounded shadow-lg z-20 animate-fade-in"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => { setActionMenuOpen(null); handleEditResource(resource); }}
                  >Edit</button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => { setActionMenuOpen(null); handleDeleteResource(resource._id); }}
                  >Delete</button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 flex items-center justify-between relative"
                    onClick={() => handleMoveToFolder(resource)}
                  >
                    <span>Move to Folder</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50"
                      onClick={() => { setActionMenuOpen(null); handleCopyLink(resource); }}
                  >Copy Link</button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-50"
                    onClick={() => { setActionMenuOpen(null); handleToggleFavorite(resource); }}
                  >{resource.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                </div>
              )}
              {folderMenuOpen === resource._id && (
                <MoveToFolder
                  isOpen={true}
                  onClose={() => setFolderMenuOpen(null)}
                  bookmark={resource}
                  onMoved={() => {
                    fetchResources()
                    setFolderMenuOpen(null)
                    setActionMenuOpen(null)
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit Modal */}
      <EditResource
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingResource(null)
        }}
        onResourceUpdated={fetchResources}
        resource={editingResource}
      />
    </div>
    </>
  )
}
