import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import AddResource from '../components/AddResource'
import EditResource from '../components/EditResource'
import ManageTags from '../components/ManageTags'
import Search from '../components/Search'
import MoveToFolder from '../components/MoveToFolder'
import AutoOrganiseButton from '../../../core/components/AutoOrganiseButton'
import { redirect } from 'react-router-dom'
import apiClient from '../../../shared/api/apiClient'


export default function Home() {
  const [isUnorganizedExpanded, setIsUnorganizedExpanded] = useState(true)
  const [isRecentExpanded, setIsRecentExpanded] = useState(false)

  // Action menu state for Notion-style actions
  const [actionMenuOpen, setActionMenuOpen] = useState(null)

  // Data state
  const [unorganizedResources, setUnorganizedResources] = useState([])
  const [recentResources, setRecentResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tags, setTags] = useState([])
  const [tagMap, setTagMap] = useState({})  

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
    fetchResources()
  }, [])

  // Auto-expand Recent section if Unorganized is empty
  useEffect(() => {
    if (!loading && unorganizedResources.length === 0) {
      setIsRecentExpanded(true)
      setIsUnorganizedExpanded(false)
    }
  }, [unorganizedResources, loading])

  // API Functions
  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags')
      console.log('🔍 RAW API RESPONSE:', response.data)
      if (response.data.success) {
        const tagsData = response.data.data
        console.log('📦 Tags data array:', tagsData)
        console.log('🏷️ First tag structure:', tagsData[0])
        setTags(tagsData)
        
        // Create a map of tag ID to tag data (name and color)
        // Handle case where tag.name might be an ObjectId that references another tag
        const map = {}
        tagsData.forEach(tag => {
          console.log('⚙️ Processing tag:', tag._id, '| name:', tag.name, '| type:', typeof tag.name)
          
          // Check if tag.name is actually an ObjectId (24 hex characters)
          const isObjectId = typeof tag.name === 'string' && /^[0-9a-f]{24}$/i.test(tag.name)
          
          if (isObjectId) {
            console.warn('⚠️ WARNING: Tag name is an ObjectId!', tag._id, '->', tag.name)
            // Try to find the actual tag that this ObjectId references
            const referencedTag = tagsData.find(t => t._id === tag.name)
            if (referencedTag) {
              console.log('✅ Found referenced tag:', referencedTag.name)
              map[tag._id] = { name: referencedTag.name, color: tag.color }
            } else {
              // Fallback: use last 6 chars of ObjectId as placeholder
              map[tag._id] = { name: `Tag-${tag.name.slice(-6)}`, color: tag.color }
            }
          } else {
            map[tag._id] = { name: tag.name, color: tag.color }
          }
        })
        setTagMap(map)
        console.log('✨ Tag map created:', map)
        console.log('📊 Total tags:', tagsData.length)
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
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
      
      // Fetch unorganized resources (no description or tags)
      const unorganizedResponse = await apiClient.get('/resources/unorganized')
      if (unorganizedResponse.data.success) {
        setUnorganizedResources(unorganizedResponse.data.data)
      }
      
      // Fetch recent resources
      const recentResponse = await apiClient.get('/resources', {
        params: { limit: 12 }
      })
      if (recentResponse.data.success) {
        setRecentResources(recentResponse.data.data)
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

  const createResource = async (resourceData) => {
    try {
      const response = await apiClient.post('/resources', resourceData)
      if (response.data.success) {
        await fetchResources() // Refresh the list
        return response.data.data
      }
    } catch (err) {
      console.error('Error creating resource:', err)
      throw err
    }
  }

  const updateResource = async (id, updates) => {
    try {
      const response = await apiClient.put(`/resources/${id}`, updates)
      if (response.data.success) {
        await fetchResources() // Refresh the list
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
      await fetchResources() // Refresh the list
    } catch (err) {
      console.error('Error deleting resource:', err)
      throw err
    }
  }

  // UI State Management
  const [modal, setModal] = useState(null)
  const [panel, setPanel] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [folderMenuOpen, setFolderMenuOpen] = useState(null)
  
  // UI Controllers
  const openModal = (type) => setModal(type)
  const closeModal = () => setModal(null)
  const openPanel = (type) => setPanel(type)
  const closePanel = () => setPanel(null)

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
  
  // Quick Actions Handlers
  const handleAddResource = () => {
    openModal('ADD_RESOURCE')
  }
  
  const handleViewFolders = () => {
    window.location.href = '/student/folders'
  }
  
  const handleManageTags = () => {
    openPanel('TAG_MANAGER')
  }
  
  const handleSearch = () => {
    setSearchOpen(true)
  }
  
  const handleImport = () => {
    openModal('IMPORT_RESOURCES')
  }
  
  const handleShare = () => {
    openModal('SHARE')
  }

  // Resource Actions
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
  
  // Example resource data
  // Now using state populated from API
  // const unorganizedResources = [...] - removed
  // const recentResources = [...] - removed

  // Smart disable logic
  const hasFolders = [...new Set([...unorganizedResources, ...recentResources]
    .map(b => b.folder)
    .filter(Boolean))].length > 0
  const hasTags = false // TODO: Calculate from actual tags

  // Search palette state
  const [searchOpen, setSearchOpen] = useState(false)

  // Global shortcut: Cmd/Ctrl+K to open search
  useEffect(() => {
    const onKey = (e) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    )}

    {/* Main Content */}
    {!loading && !error && (
    <div>
    <div className="p-8">
      <h1 className="text-3xl font-bold text-zinc-900 mb-4">Student Hub</h1>
      <p className="text-zinc-600">Student workspace content goes here.</p>
    </div>

    <div className="flex h-[85vh]">
      <div className="p-6 bg-zinc-50 w-2/3 border-r border-zinc-200">
        {/* Expandable Unorganized Resources */}
        <div className="mb-4 relative">
          <div className="flex items-center gap-2 w-full mb-2 px-0.5 py-1">
            <button 
              onClick={toggleUnorganized}
              className="flex items-center gap-2 group transition-colors"
            >
              <svg 
                className="w-3 h-3 text-zinc-400 transition-transform" 
                style={{ transform: isUnorganizedExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
              </svg>
              <h2 className="text-xs font-medium text-zinc-600 tracking-wide">UNORGANIZED</h2>
              <span className="text-xs text-zinc-400">{unorganizedResources.length}</span>
            </button>
            
            {/* Auto Organise Button - inline, not nested in button */}
            {isUnorganizedExpanded && unorganizedResources.length > 0 && (
              <span className="ml-2">
                <AutoOrganiseButton onComplete={fetchResources} />
              </span>
            )}
          </div>

          <button 
            onClick={toggleUnorganized} 
            className="absolute top-0 right-0 text-zinc-400 hover:text-zinc-600 p-1.5 rounded transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronDown 
              size={20} 
              className="transition-transform duration-300"
              style={{ transform: isUnorganizedExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          
          {isUnorganizedExpanded && (
            <div className="space-y-0.5 ml-5 max-h-[calc(85vh-180px)] overflow-y-auto pr-2 pt-2 custom-scrollbar">
              {unorganizedResources.length === 0 ? (
                <p className="text-sm text-zinc-400 ml-2">No unorganized resources</p>
              ) : (
              unorganizedResources.map((resource) => (
                <div 
                  key={resource._id}
                  className="group flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors"
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
                    <h3 className="text-sm text-zinc-900 truncate">{resource.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{resource.description}</p>
                    {/* Display Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {resource.tags.slice(0, 3).map((tag, index) => {
                          // Handle both populated tag objects and tag IDs
                          const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                          const tagId = typeof tag === 'object' ? tag._id : tag
                          const bgColor = tagData?.color ? `${tagData.color}20` : '#DBEAFE'
                          const textColor = tagData?.color || '#2563EB'
                          return (
                            <span 
                              key={tagId || index}
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ backgroundColor: bgColor, color: textColor }}
                            >
                              {tagData?.name || tagId}
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
                  <div className="">
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
                        className="absolute right-0 mt-2 w-40 bg-white border border-zinc-200 rounded shadow-lg z-20 animate-fade-in"
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
              ))
              )}
              
              <button 
                onClick={handleAddResource}
                className="w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 hover:bg-white rounded transition-colors">
                + Add resource
              </button>
            </div>
          )}
        </div>

        {/* Recent Resources Section */}
        <div className="mb-4 relative">
          <button 
            onClick={toggleRecent}
            className="flex items-center gap-2 w-full text-left mb-2 group px-0.5 py-1 transition-colors"
          >
            <svg 
              className="w-3 h-3 text-zinc-400 transition-transform" 
              style={{ transform: isRecentExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
            </svg>
            <h2 className="text-xs font-medium text-zinc-600 tracking-wide">RECENT</h2>
            <span className="text-xs text-zinc-400">{recentResources.length}</span>
          </button>

          <button 
            onClick={toggleRecent} 
            className="absolute top-0 right-0 text-zinc-400 hover:text-zinc-600 p-1.5 rounded transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <ChevronDown 
              size={20} 
              className="transition-transform duration-300"
              style={{ transform: isRecentExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          
          {isRecentExpanded && (
            <div className="space-y-0.5 ml-5 max-h-[calc(85vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
              {recentResources.length === 0 ? (
                <p className="text-sm text-zinc-400 ml-2">No recent resources</p>
              ) : (
              recentResources.map((resource) => (
                <div 
                  key={resource._id}
                  className="group flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors"
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
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm text-zinc-900 truncate">{resource.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{resource.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {/* Display Tags */}
                      {resource.tags && resource.tags.length > 0 && resource.tags.slice(0, 3).map((tag, index) => {
                        // Handle both populated tag objects and tag IDs
                        const tagData = typeof tag === 'object' ? tag : tagMap[tag]
                        const tagId = typeof tag === 'object' ? tag._id : tag
                        const bgColor = tagData?.color ? `${tagData.color}20` : '#DBEAFE'
                        const textColor = tagData?.color || '#2563EB'
                        return (
                          <span 
                            key={tagId || index}
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: bgColor, color: textColor }}
                          >
                            {tagData?.name || tagId}
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
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-500 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id);
                    }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {actionMenuOpen === resource._id && (
                    <div
                      className="absolute right-8 mt-2 w-40 bg-white border border-zinc-200 rounded shadow-lg z-20"
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
              ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className='w-1/3 h-full bg-zinc-50 border-l border-zinc-200 p-6'>
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-zinc-500 tracking-wide uppercase px-2">Quick Actions</h2>
        </div>
        <div className="space-y-1">
          <button 
            onClick={handleAddResource}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative'
            title="Add a new resource"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">Add Resource</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘B</span>
          </button>
          
          <button 
            onClick={handleViewFolders}
            disabled={!hasFolders}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            title={hasFolders ? "Browse all folders" : "No folders yet"}
          >
            <a href="/student/folders" className="flex items-center gap-3 w-full">
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">View Folders</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘F</span>
            </a>
          </button>
          <button 
            onClick={handleManageTags}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative'
            title="Manage your tags"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">Manage Tags</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘T</span>
          </button>

          <button 
            onClick={handleSearch}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative'
            title="Search resources"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">Search</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘K</span>
          </button>

          <button 
            onClick={handleImport}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative'
            title="Import resources from browser or file"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">Import</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘I</span>
          </button>

          <button 
            onClick={handleShare}
            className='w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-100 transition-colors text-left group relative'
            title="Share resources or collections"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="text-sm text-zinc-700 flex-1">Share</span>
            <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘S</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-200">
          <div className="px-2 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Resources</span>
              <span className="text-zinc-700 font-medium">{unorganizedResources.length + recentResources.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Folders</span>
              <span className="text-zinc-700 font-medium">{hasFolders ? [...new Set([...unorganizedResources, ...recentResources].map(b => b.folder).filter(Boolean))].length : 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Tags</span>
              <span className="text-zinc-700 font-medium">{tags.length}</span>
            </div>
          </div>
        </div>
        
        {/* Debug: UI State */}
        {modal && (
          <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
            <div className="font-medium text-blue-900 mb-1">Modal Active:</div>
            <div className="text-blue-700">{modal}</div>
            <button 
              onClick={closeModal}
              className="mt-2 px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-blue-900 text-xs"
            >
              Close Modal
            </button>
          </div>
        )}
        
        {panel && (
          <div className="mt-4 p-3 bg-purple-50 rounded text-xs">
            <div className="font-medium text-purple-900 mb-1">Panel Active:</div>
            <div className="text-purple-700">{panel}</div>
            <button 
              onClick={closePanel}
              className="mt-2 px-2 py-1 bg-purple-200 hover:bg-purple-300 rounded text-purple-900 text-xs"
            >
              Close Panel
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Modals */}
    <AddResource 
      isOpen={modal === 'ADD_RESOURCE'} 
      onClose={closeModal}
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
    
    {/* Panels */}
    <ManageTags isOpen={panel === 'TAG_MANAGER'} onClose={closePanel} />
    <Search
      isOpen={searchOpen}
      onClose={() => setSearchOpen(false)}
      resources={[...unorganizedResources, ...recentResources]}
      tags={tags}
      tagMap={tagMap}
    />
    </div>
    )}
    </>
  )
}
