import React, { useMemo, useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, MoreVertical } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'
import EditResource from '../components/EditResource'
import MoveToFolder from '../components/MoveToFolder'

function getFavicon(url) {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
  } catch (e) {
    return ''
  }
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState(new Set())
  const [selectedTags, setSelectedTags] = useState(new Set())
  const [selectedFolder, setSelectedFolder] = useState('All')
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, bottom: 'auto' })
  const [tags, setTags] = useState([])
  const [tagMap, setTagMap] = useState({})
  const [folders, setFolders] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState(null)
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(false)

  useEffect(() => {
    fetchTags()
    fetchFolders()
    fetchResources()
  }, [])

  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (folderDropdownOpen && !e.target.closest('.folder-dropdown')) {
        setFolderDropdownOpen(false)
      }
    }
    if (folderDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [folderDropdownOpen])

  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags')
      if (response.data.success) {
        const tagsData = response.data.data
        setTags(tagsData)
        
        const map = {}
        tagsData.forEach(tag => {
          const isObjectId = typeof tag.name === 'string' && /^[0-9a-f]{24}$/i.test(tag.name)
          
          if (isObjectId) {
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
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await apiClient.get('/folders')
      if (response.data.success) {
        const result = response.data.data
        if (result.folders) {
          setFolders(result.folders)
        } else {
          setFolders(response.data.data)
        }
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
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

  const handleToggleFavorite = async (resource) => {
    try {
      await updateResource(resource._id, { isFavorite: !resource.isFavorite })
    } catch (err) {
      alert('Failed to update favorite status')
    }
  }

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
    const result = []
    
    // Count resources per folder
    const folderCounts = new Map()
    let uncategorizedCount = 0
    
    resources.forEach(resource => {
      // Try multiple ways to get folder ID
      let folderId = null
      if (resource.folder) {
        if (typeof resource.folder === 'object') {
          folderId = resource.folder._id || resource.folder.id
        } else if (typeof resource.folder === 'string') {
          folderId = resource.folder
        }
      }
      // Also check folderId field directly
      if (!folderId && resource.folderId) {
        folderId = typeof resource.folderId === 'object' ? resource.folderId._id : resource.folderId
      }
      
      if (folderId) {
        folderCounts.set(folderId, (folderCounts.get(folderId) || 0) + 1)
      } else {
        uncategorizedCount++
      }
    })
    
    // Add "All" option with total count
    result.push({ 
      _id: 'All', 
      name: 'All Resources', 
      icon: '📚',
      resourceCount: resources.length
    })
    
    // Add "Uncategorized" option if there are resources without folders
    if (uncategorizedCount > 0) {
      result.push({
        _id: 'uncategorized',
        name: 'No Folder',
        icon: '📄',
        resourceCount: uncategorizedCount
      })
    }
    
    // Add folders from API with counts
    folders.forEach(folder => {
      if (folder._id && folder.name) {
        const count = folderCounts.get(folder._id) || 0
        result.push({
          ...folder,
          resourceCount: count
        })
      }
    })
    
    return result
  }, [folders, resources])

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
      // Folder filter
      if (selectedFolder !== 'All') {
        // Extract folder ID using multiple methods
        let resourceFolderId = null
        if (b.folder) {
          if (typeof b.folder === 'object') {
            resourceFolderId = b.folder._id || b.folder.id
          } else if (typeof b.folder === 'string') {
            resourceFolderId = b.folder
          }
        }
        // Also check folderId field directly
        if (!resourceFolderId && b.folderId) {
          resourceFolderId = typeof b.folderId === 'object' ? b.folderId._id : b.folderId
        }
        
        // If filtering by "uncategorized", show resources without folders
        if (selectedFolder === 'uncategorized') {
          // Only include if resource has no folder
          if (resourceFolderId) return false
        } else {
          // For specific folder, compare IDs - exclude if no match
          if (!resourceFolderId || resourceFolderId !== selectedFolder) {
            return false
          }
        }
      }
      
      // Type filter
      if (selectedTypes.size > 0 && !selectedTypes.has(b.type)) return false
      
      // Tags filter
      if (selectedTags.size > 0) {
        const hasTag = (b.tags || []).some(t => {
          const tagId = typeof t === 'object' ? t._id : t
          return selectedTags.has(tagId)
        })
        if (!hasTag) return false
      }
      
      // Search query
      if (!q) return true
      
      const matchesTag = (b.tags || []).some(t => {
        const tagData = typeof t === 'object' ? t : tagMap[t]
        let tagName = typeof tagData?.name === 'object' 
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
  }, [resources, query, selectedTypes, selectedTags, selectedFolder, tagMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-200 border-t-zinc-900 mx-auto mb-3"></div>
          <p className="text-zinc-500 text-sm font-medium">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 h-screen bg-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md w-full">
          <h3 className="text-red-900 font-semibold mb-2">Unable to Load Resources</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchResources}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
          >
            Try Again
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

      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-zinc-100 px-4 py-4 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Resources</h1>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-zinc-100/70 border border-zinc-200 rounded-lg px-3 py-2.5">
              <Search size={18} className="text-zinc-400 mr-2.5" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resources..."
                className="bg-transparent outline-none text-sm text-zinc-900 w-full placeholder:text-zinc-400"
              />
            </div>
            
            <button
              onClick={() => setFilterOpen(v => !v)}
              className="relative p-3 bg-zinc-100/70 border border-zinc-200 rounded-lg active:bg-zinc-200 transition-colors"
            >
              <Filter size={18} className="text-zinc-700" strokeWidth={2} />
              {(selectedTypes.size > 0 || selectedTags.size > 0 || selectedFolder !== 'All') && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-zinc-600 text-white rounded-full">
                  {selectedTypes.size + selectedTags.size + (selectedFolder !== 'All' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters */}
          {(selectedTypes.size > 0 || selectedTags.size > 0 || selectedFolder !== 'All') && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {Array.from(selectedTypes).map(type => (
                <button
                  key={type}
                  onClick={() => toggleSet(setSelectedTypes, type)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium whitespace-nowrap hover:bg-zinc-200 transition-colors active:scale-95"
                >
                  <span className="capitalize">{type}</span>
                  <span className="text-zinc-400 font-bold">×</span>
                </button>
              ))}
              {Array.from(selectedTags).map(tagId => {
                const tag = allTags.find(t => (t._id || t) === tagId)
                let tagName = typeof tag === 'object' ? tag.name : tag
                if (typeof tagName === 'object') tagName = String(tagName._id || tagName).slice(-6)
                return (
                  <button
                    key={tagId}
                    onClick={() => toggleSet(setSelectedTags, tagId)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all hover:opacity-80 active:scale-95"
                    style={{
                      backgroundColor: `${tag?.color || '#3B82F6'}20`,
                      color: tag?.color || '#3B82F6'
                    }}
                  >
                    <span>{tagName}</span>
                    <span className="opacity-70">×</span>
                  </button>
                )
              })}
              {selectedFolder !== 'All' && (() => {
                const folder = allFolders.find(f => f._id === selectedFolder)
                return (
                  <button
                    onClick={() => setSelectedFolder('All')}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs whitespace-nowrap hover:bg-zinc-200 transition-colors"
                  >
                    <span>{folder?.icon || '📁'}</span>
                    <span>{folder?.name || selectedFolder}</span>
                    <span className="text-zinc-500">×</span>
                  </button>
                )
              })()}
            </div>
          )}
        </div>

        {/* Resources List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400 text-sm">No resources found</p>
            </div>
          )}

          <div className="space-y-2">
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
                  {resource.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{resource.description}</p>
                  )}
                  
                  {/* Tags and Metadata */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {resource.tags && resource.tags.length > 0 && resource.tags.slice(0, 3).map((tag, index) => {
                      const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                      const tagId = typeof tag === 'object' ? tag._id : tag
                      let tagName = typeof tag === 'object' ? tag.name : (tagMap[tag]?.name || tag)
                      
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
                    {(resource.folder?.name || resource.folder) && (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        {resource.folder?.name || resource.folder}
                      </span>
                    )}
                    {resource.isFavorite && (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-md">⭐</span>
                    )}
                  </div>
                </div>
                <button
                  className="p-1.5 rounded hover:bg-zinc-100 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    const button = e.currentTarget
                    const rect = button.getBoundingClientRect()
                    const windowHeight = window.innerHeight
                    const menuHeight = 180
                    const spaceBelow = windowHeight - rect.bottom
                    
                    if (spaceBelow < menuHeight && rect.top > menuHeight) {
                      setMenuPosition({ bottom: windowHeight - rect.top + 8, top: 'auto' })
                    } else {
                      setMenuPosition({ top: rect.bottom + 8, bottom: 'auto' })
                    }
                    setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id);
                  }}
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                  </svg>
                </button>

                {actionMenuOpen === resource._id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setActionMenuOpen(null)}
                    />
                    <div
                      className="fixed right-4 w-36 bg-zinc-50 border border-zinc-200 rounded-lg shadow-xl z-40 overflow-hidden"
                      style={{ top: menuPosition.top, bottom: menuPosition.bottom }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                        onClick={() => { setActionMenuOpen(null); handleEditResource(resource); }}
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                        onClick={() => { setActionMenuOpen(null); handleMoveToFolder(resource); }}
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span>Move</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                        onClick={() => { setActionMenuOpen(null); handleToggleFavorite(resource); }}
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{resource.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                        onClick={() => { setActionMenuOpen(null); handleDeleteResource(resource._id); }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}

                {folderMenuOpen === resource._id && (
                <MoveToFolder
                  isOpen={true}
                  onClose={() => setFolderMenuOpen(null)}
                  resource={resource}
                  onMoved={() => {
                    fetchResources()
                    fetchFolders()
                    setFolderMenuOpen(null)
                    setActionMenuOpen(null)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setFilterOpen(false)
              setFolderDropdownOpen(false)
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-50 max-h-[80vh] overflow-y-auto custom-scrollbar border-t border-zinc-100">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-300 rounded-full"></div>
            </div>
            <div className="px-6 pb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Filters</h2>
              <button 
                onClick={() => {
                  setFilterOpen(false)
                  setFolderDropdownOpen(false)
                }} 
                className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Type Filter */}
              <div>
                <h3 className="text-sm font-medium text-zinc-600 mb-2.5">Type</h3>
                <div className="flex gap-2">
                  {allTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleSet(setSelectedTypes, t)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm transition-all ${
                        selectedTypes.has(t)
                          ? 'bg-zinc-200 text-zinc-900 font-medium'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-medium text-zinc-600">Tags</h3>
                  {selectedTags.size > 0 && (
                    <button
                      onClick={() => setSelectedTags(new Set())}
                      className="text-xs text-zinc-500 hover:text-zinc-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {allTags.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-400">No tags available</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => {
                      const tagId = tag._id || tag
                      let tagName = tag.name || tag
                      if (typeof tagName === 'object') tagName = String(tagName._id || tagName).slice(-6)
                      const displayName = String(tagName)
                      const isSelected = selectedTags.has(tagId)
                      
                      return (
                        <button
                          key={String(tagId)}
                          onClick={() => toggleSet(setSelectedTags, tagId)}
                          className={`px-3 py-1.5 rounded-md text-xs transition-all`}
                          style={{
                            backgroundColor: isSelected ? tag.color || '#3B82F6' : `${tag.color || '#3B82F6'}15`,
                            color: isSelected ? '#ffffff' : tag.color || '#3B82F6'
                          }}
                        >
                          {displayName}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Folder Filter */}
              <div>
                <h3 className="text-sm font-medium text-zinc-600 mb-2.5">Folder</h3>
                <div className="relative folder-dropdown">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFolderDropdownOpen(!folderDropdownOpen)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {allFolders.find(f => f._id === selectedFolder)?.icon || '📁'}
                      </span>
                      <span>
                        {allFolders.find(f => f._id === selectedFolder)?.name || 'Select folder'}
                      </span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-zinc-400 transition-transform ${folderDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {folderDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setFolderDropdownOpen(false)}
                      />
                      <div className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                      {allFolders.map(folder => (
                        <button
                          key={folder._id}
                          onClick={() => {
                            setSelectedFolder(folder._id)
                            setFolderDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2.5 border-b border-zinc-100 last:border-0 ${
                            selectedFolder === folder._id 
                              ? 'bg-zinc-200 text-zinc-900 font-medium' 
                              : 'text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <span className="text-base">{folder.icon || '📁'}</span>
                          <span className="flex-1">{folder.name}</span>
                          {folder.resourceCount > 0 && (
                            <span className="text-xs text-zinc-400">{folder.resourceCount}</span>
                          )}
                          {selectedFolder === folder._id && (
                            <svg className="w-4 h-4 text-zinc-900" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 flex gap-2.5">
              <button
                onClick={() => {
                  setSelectedTypes(new Set())
                  setSelectedTags(new Set())
                  setSelectedFolder('All')
                  setFolderDropdownOpen(false)
                }}
                className="flex-1 py-2.5 text-sm text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  setFilterOpen(false)
                  setFolderDropdownOpen(false)
                }}
                className="flex-1 py-2.5 text-sm text-white bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}

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
