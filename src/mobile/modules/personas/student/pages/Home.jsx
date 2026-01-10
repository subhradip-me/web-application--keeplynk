import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import AddResource from '../components/AddResource'
import EditResource from '../components/EditResource'
import ManageTags from '../components/ManageTags'
import Search from '../components/Search'
import MoveToFolder from '../components/MoveToFolder'
import AutoOrganiseButton from '../components/AutoOrganiseButton'
import apiClient from '../../../shared/api/apiClient'

export default function Home() {
  const [isUnorganizedExpanded, setIsUnorganizedExpanded] = useState(true)
  const [isRecentExpanded, setIsRecentExpanded] = useState(false)

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, bottom: 'auto' })

  // Data state
  const [unorganizedResources, setUnorganizedResources] = useState([])
  const [recentResources, setRecentResources] = useState([])
  const [allResources, setAllResources] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tags, setTags] = useState([])
  const [tagMap, setTagMap] = useState({})

  // Modal state
  const [modal, setModal] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState(null)

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

  // Fetch resources and tags on mount
  useEffect(() => {
    fetchTags()
    fetchFolders()
    fetchResources()
  }, [])

  const fetchFolders = async () => {
    try {
      const response = await apiClient.get('/folders')
      if (response.data.success) {
        setFolders(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }

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
        params: { limit: 100 }
      })
      
      if (response.data.success) {
        const resources = response.data.data
        
        // Filter unorganized (no description AND no tags)
        const unorganized = resources.filter(r => 
          (!r.description || r.description.trim() === '') && 
          (!r.tags || r.tags.length === 0)
        )
        const recent = resources.slice(0, 12)
        
        setAllResources(resources)
        setUnorganizedResources(unorganized)
        setRecentResources(recent)
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

  const toggleUnorganized = () => {
    setIsUnorganizedExpanded(!isUnorganizedExpanded)
    if (!isUnorganizedExpanded) setIsRecentExpanded(false)
  }

  const toggleRecent = () => {
    setIsRecentExpanded(!isRecentExpanded)
    if (!isRecentExpanded) setIsUnorganizedExpanded(false)
  }

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
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

  const handleCopyLink = (resource) => {
    const linkToCopy = resource.type === 'url' && resource.url 
      ? resource.url 
      : resource.type === 'document' && resource.file?.path
      ? `http://localhost:3000/uploads/${resource.file.path.split('\\').pop().split('/').pop()}`
      : null
    
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
            <p className="text-zinc-600">Loading resources...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4">
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
      )}

      {/* Main Content */}
      {!loading && !error && (
        <div className="h-[calc(100vh-4rem)] bg-zinc-50 flex flex-col">
          {/* Stats Header */}
          <div className="bg-white border-b border-zinc-200 px-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-900">{allResources.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Resources</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-900">{folders.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Folders</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-900">{tags.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Tags</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-900">{allResources.filter(r => r.isFavorite).length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Favorites</div>
              </div>
            </div>
          </div>

          {/* Sections Container */}
          <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
            {/* Unorganized Resources */}
            <div className="flex flex-col min-h-0" style={{ flex: isUnorganizedExpanded ? '1' : '0 0 auto' }}>
              <div className="flex items-center justify-between w-full mb-2 flex-shrink-0 gap-2">
                <button 
                  onClick={toggleUnorganized}
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Unorganized
                  </h2>
                  <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{unorganizedResources.length}</span>
                  <ChevronDown 
                    size={18} 
                    className="text-zinc-500 transition-transform ml-auto"
                    style={{ transform: isUnorganizedExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                
                {/* Auto Organise Button - Only show when expanded and has items */}
                {isUnorganizedExpanded && unorganizedResources.length > 0 && (
                  <AutoOrganiseButton onComplete={fetchResources} />
                )}
              </div>

              {isUnorganizedExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
                  {unorganizedResources.length === 0 ? (
                    <p className="text-sm text-zinc-400 ml-2">No unorganized resources</p>
                  ) : (
                    unorganizedResources.map((resource) => (
                      <div 
                        key={resource._id}
                        className="bg-white rounded-lg p-3 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-50 cursor-pointer relative"
                        onClick={() => {
                          if (resource.type === 'url' && resource.url) {
                            window.open(resource.url, '_blank')
                          } else if (resource.type === 'document' && resource.file?.path) {
                            const filename = resource.file.path.split('\\').pop().split('/').pop()
                            window.open(`http://localhost:3000/uploads/${filename}`, '_blank')
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {resource.type === 'url' ? (
                            <>
                              <img 
                                src={getFavicon(resource.url)} 
                                alt=""
                                className="w-4 h-4 flex-shrink-0 mt-1"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextElementSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-4 h-4 rounded bg-zinc-200 flex-shrink-0 mt-1 hidden items-center justify-center text-[8px] text-zinc-600 font-medium">
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
                            <h3 className="text-sm font-medium text-zinc-900 truncate">{resource.title}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">{resource.description}</p>
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 flex-wrap">
                                {resource.tags.slice(0, 3).map((tag, index) => {
                                  const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                                  const tagId = typeof tag === 'object' ? tag._id : tag
                                  let tagName = typeof tag === 'object' ? tag.name : (tagMap[tag]?.name || tag)
                                  
                                  // Ensure tagName is always a string
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
                                {resource.tags.length > 3 && (
                                  <span className="text-[10px] text-zinc-400">
                                    +{resource.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            className="p-1 hover:bg-zinc-100 rounded text-zinc-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              const button = e.currentTarget
                              const rect = button.getBoundingClientRect()
                              const windowHeight = window.innerHeight
                              const menuHeight = 200 // Approximate menu height
                              const spaceBelow = windowHeight - rect.bottom
                              
                              if (spaceBelow < menuHeight && rect.top > menuHeight) {
                                // Open upward
                                setMenuPosition({ bottom: windowHeight - rect.top + 8, top: 'auto' })
                              } else {
                                // Open downward
                                setMenuPosition({ top: rect.bottom + 8, bottom: 'auto' })
                              }
                              setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id)
                            }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>

                        {actionMenuOpen === resource._id && (
                          <div
                            className="fixed right-4 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-50"
                            style={{ top: menuPosition.top, bottom: menuPosition.bottom }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors first:rounded-t-lg"
                              onClick={() => { setActionMenuOpen(null); handleEditResource(resource) }}
                            >Edit</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleDeleteResource(resource._id) }}
                            >Delete</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleMoveToFolder(resource) }}
                            >Move to Folder</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleCopyLink(resource) }}
                            >Copy Link</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100 last:rounded-b-lg"
                              onClick={() => { setActionMenuOpen(null); handleToggleFavorite(resource) }}
                            >{resource.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                          </div>
                        )}

                        {folderMenuOpen === resource._id && (
                          <MoveToFolder
                            isOpen={true}
                            onClose={() => setFolderMenuOpen(null)}
                            resource={resource}
                            onMoved={() => {
                              fetchResources()
                              setFolderMenuOpen(null)
                              setActionMenuOpen(null)
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Recent Resources */}
            <div className="flex flex-col min-h-0" style={{ flex: isRecentExpanded ? '1' : '0 0 auto' }}>
              <button 
                onClick={toggleRecent}
                className="flex items-center justify-between w-full mb-2 flex-shrink-0"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Recent
                  </h2>
                  <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{recentResources.length}</span>
                </div>
                <ChevronDown 
                  size={18} 
                  className="text-zinc-500 transition-transform"
                  style={{ transform: isRecentExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {isRecentExpanded && (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
                  {recentResources.length === 0 ? (
                    <p className="text-sm text-zinc-400 ml-2">No recent resources</p>
                  ) : (
                    recentResources.map((resource) => (
                      <div 
                        key={resource._id}
                        className="bg-white rounded-lg p-3 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-50 cursor-pointer relative"
                        onClick={() => {
                          if (resource.type === 'url' && resource.url) {
                            window.open(resource.url, '_blank')
                          } else if (resource.type === 'document' && resource.file?.path) {
                            const filename = resource.file.path.split('\\').pop().split('/').pop()
                            window.open(`http://localhost:3000/uploads/${filename}`, '_blank')
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {resource.type === 'url' ? (
                            <>
                              <img 
                                src={getFavicon(resource.url)} 
                                alt=""
                                className="w-4 h-4 flex-shrink-0 mt-1"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextElementSibling.style.display = 'flex'
                                }}
                              />
                              <div className="w-4 h-4 rounded bg-zinc-200 flex-shrink-0 mt-1 hidden items-center justify-center text-[8px] text-zinc-600 font-medium">
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
                            <h3 className="text-sm font-medium text-zinc-900 truncate">{resource.title}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5 truncate">{resource.description}</p>
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {resource.tags && resource.tags.length > 0 && resource.tags.slice(0, 3).map((tag, index) => {
                                const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                                const tagId = typeof tag === 'object' ? tag._id : tag
                                let tagName = typeof tag === 'object' ? tag.name : (tagMap[tag]?.name || tag)
                                
                                // Ensure tagName is always a string
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
                              {resource.folder?.name && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded flex items-center gap-0.5">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                  </svg>
                                  {resource.folder.name}
                                </span>
                              )}
                              {resource.isFavorite && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-600 rounded">
                                  ⭐ Favorite
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="p-1 hover:bg-zinc-100 rounded text-zinc-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              const button = e.currentTarget
                              const rect = button.getBoundingClientRect()
                              const windowHeight = window.innerHeight
                              const menuHeight = 200
                              const spaceBelow = windowHeight - rect.bottom
                              
                              if (spaceBelow < menuHeight && rect.top > menuHeight) {
                                setMenuPosition({ bottom: windowHeight - rect.top + 8, top: 'auto' })
                              } else {
                                setMenuPosition({ top: rect.bottom + 8, bottom: 'auto' })
                              }
                              setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id)
                            }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>

                        {actionMenuOpen === resource._id && (
                          <div
                            className="fixed right-4 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-50"
                            style={{ top: menuPosition.top, bottom: menuPosition.bottom }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors first:rounded-t-lg"
                              onClick={() => { setActionMenuOpen(null); handleEditResource(resource) }}
                            >Edit</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleDeleteResource(resource._id) }}
                            >Delete</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleMoveToFolder(resource) }}
                            >Move to Folder</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100"
                              onClick={() => { setActionMenuOpen(null); handleCopyLink(resource) }}
                            >Copy Link</button>
                            <button
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-t border-zinc-100 last:rounded-b-lg"
                              onClick={() => { setActionMenuOpen(null); handleToggleFavorite(resource) }}
                            >{resource.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</button>
                          </div>
                        )}

                        {folderMenuOpen === resource._id && (
                          <MoveToFolder
                            isOpen={true}
                            onClose={() => setFolderMenuOpen(null)}
                            resource={resource}
                            onMoved={() => {
                              fetchResources()
                              setFolderMenuOpen(null)
                              setActionMenuOpen(null)
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddResource 
        isOpen={modal === 'ADD_RESOURCE'} 
        onClose={() => setModal(null)}
        onResourceCreated={fetchResources}
      />
      <EditResource
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingResource(null)
        }}
        onResourceUpdated={fetchResources}
        resource={editingResource}
      />
    </>
  )
}
