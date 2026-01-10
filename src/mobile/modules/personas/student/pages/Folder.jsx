import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical, Plus, Search, ExternalLink, Copy, Trash2, Edit3, Star } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'
import EditResource from '../components/EditResource'

function getFavicon(url) {
  try {
    const host = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
  } catch {
    return ''
  }
}

export default function MobileFolder() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const [folder, setFolder] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 'auto', bottom: 'auto' })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  const fetchFolder = useCallback(async () => {
    try {
      const response = await apiClient.get(`/folders/${folderId}`)
      if (response.data.success) {
        setFolder(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching folder:', err)
      setError('Failed to load folder')
    }
  }, [folderId])

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/resources', {
        params: { folderId, limit: 1000 }
      })
      
      if (response.data.success) {
        setResources(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching resources:', err)
      setError('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }, [folderId])

  useEffect(() => {
    fetchFolder()
    fetchResources()
  }, [folderId, fetchFolder, fetchResources])

  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

  const handleEditResource = (resource) => {
    setEditingResource(resource)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const handleDeleteResource = async (resourceId) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        await apiClient.delete(`/resources/${resourceId}`)
        await fetchResources()
        setActionMenuOpen(null)
      } catch (err) {
        alert('Failed to delete resource')
      }
    }
  }

  const handleToggleFavorite = async (resource) => {
    try {
      await apiClient.put(`/resources/${resource._id}`, { 
        isFavorite: !resource.isFavorite 
      })
      await fetchResources()
      setActionMenuOpen(null)
    } catch (err) {
      alert('Failed to update favorite')
    }
  }

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url)
    alert('Link copied!')
    setActionMenuOpen(null)
  }

  const filtered = resources.filter(r => {
    if (!query) return true
    return r.title?.toLowerCase().includes(query.toLowerCase()) ||
           r.description?.toLowerCase().includes(query.toLowerCase()) ||
           r.url?.toLowerCase().includes(query.toLowerCase())
  })

  if (loading && !folder) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !folder) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-white flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-red-900 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-800 text-sm mb-4">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
          >
            Go Back
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
        
        .resource-card {
          transition: all 0.2s ease;
        }
        
        @keyframes menuSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes menuSlideInUp {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .menu-animate-down {
          animation: menuSlideIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .menu-animate-up {
          animation: menuSlideInUp 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @keyframes backdropFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .backdrop-animate {
          animation: backdropFade 0.15s ease-out;
        }
      `}</style>

      <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50">
        {/* Header */}
        <div className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors -ml-2"
            >
              <ArrowLeft size={20} className="text-zinc-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{folder?.name}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
            <Search size={18} className="text-zinc-400 mr-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none text-sm text-zinc-700 w-full placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Resources List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar bg-zinc-50">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-900 mx-auto mb-3"></div>
              <p className="text-zinc-500 text-sm">Loading resources...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Plus size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {query ? 'No resources found' : 'No resources yet'}
              </h3>
              <p className="text-sm text-zinc-500">
                {query ? 'Try a different search term' : 'Add resources to this folder to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(resource => (
                <div
                  key={resource._id}
                  className="resource-card bg-white border border-zinc-200 rounded-lg p-3 active:bg-zinc-50 relative"
                >
                  <div className="flex items-start gap-3">
                    {/* Favicon */}
                    {resource.url ? (
                      <img
                        src={getFavicon(resource.url)}
                        alt=""
                        className="w-5 h-5 shrink-0 mt-0.5"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-5 h-5 shrink-0 mt-0.5 text-zinc-500">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-900 truncate">
                        {resource.title}
                      </h3>
                      
                      {resource.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                          {resource.description}
                        </p>
                      )}

                      {/* Tags and Metadata */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {resource.tags && resource.tags.length > 0 && resource.tags.slice(0, 3).map((tag, idx) => {
                          const tagName = typeof tag === 'object' ? tag.name : tag
                          const tagColor = typeof tag === 'object' ? tag.color : null
                          return (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: tagColor ? `${tagColor}20` : '#DBEAFE',
                                color: tagColor || '#2563EB'
                              }}
                            >
                              {tagName}
                            </span>
                          )
                        })}
                        {resource.tags && resource.tags.length > 3 && (
                          <span className="text-[10px] text-zinc-400">
                            +{resource.tags.length - 3}
                          </span>
                        )}
                        {resource.isFavorite && (
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-md">⭐</span>
                        )}
                      </div>
                    </div>

                    {/* Action Menu Button */}
                    <button
                      className="p-1 hover:bg-zinc-100 active:bg-zinc-200 rounded transition-colors text-zinc-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        
                        if (actionMenuOpen === resource._id) {
                          setActionMenuOpen(null)
                          return
                        }

                        // Calculate if menu should open upwards
                        const rect = e.currentTarget.getBoundingClientRect()
                        const viewportHeight = window.innerHeight
                        const spaceBelow = viewportHeight - rect.bottom
                        const menuHeight = 180 // Approximate menu height
                        
                        // Open upwards if in bottom 80% of screen or not enough space below
                        if (rect.bottom > viewportHeight * 0.8 || spaceBelow < menuHeight) {
                          setMenuPosition({ bottom: viewportHeight - rect.top + 8, top: 'auto' })
                        } else {
                          setMenuPosition({ top: rect.bottom + 8, bottom: 'auto' })
                        }
                        
                        setActionMenuOpen(resource._id)
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Action Menu */}
                  {actionMenuOpen === resource._id && (
                    <>
                      <div
                        className="fixed inset-0 z-30 backdrop-animate"
                        onClick={() => setActionMenuOpen(null)}
                      />
                      <div
                        className={`fixed right-4 w-48 bg-white border border-zinc-200/80 rounded-lg shadow-lg z-40 overflow-hidden ${
                          menuPosition.bottom !== 'auto' ? 'menu-animate-up' : 'menu-animate-down'
                        }`}
                        style={{ 
                          top: menuPosition.top !== 'auto' ? `${menuPosition.top}px` : 'auto',
                          bottom: menuPosition.bottom !== 'auto' ? `${menuPosition.bottom}px` : 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="w-full text-left px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors duration-100"
                          onClick={() => handleEditResource(resource)}
                        >
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors duration-100"
                          onClick={() => handleToggleFavorite(resource)}
                        >
                          {resource.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                        </button>
                        {resource.url && (
                          <button
                            className="w-full text-left px-3 py-2 text-[13px] text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors duration-100"
                            onClick={() => handleCopyLink(resource.url)}
                          >
                            Copy Link
                          </button>
                        )}
                        <div className="h-px bg-zinc-100 my-1" />
                        <button
                          className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors duration-100"
                          onClick={() => handleDeleteResource(resource._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Resource Modal */}
      <EditResource
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingResource(null)
        }}
        onResourceUpdated={() => {
          fetchResources()
          setShowEditModal(false)
          setEditingResource(null)
        }}
        resource={editingResource}
      />
    </>
  )
}
