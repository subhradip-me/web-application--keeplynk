import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../../shared/api/apiClient'
import AddResource from '../components/AddResource'
import EditResource from '../components/EditResource'

export default function FolderDetail() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  
  const [folder, setFolder] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest', 'name'
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  useEffect(() => {
    fetchFolderDetails()
    fetchFolderResources()
  }, [folderId])

  // Close action menu on outside click
  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

  const fetchFolderDetails = async () => {
    try {
      const response = await apiClient.get(`/folders/${folderId}`)
      if (response.data.success) {
        setFolder(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching folder:', err)
      setError(err.response?.data?.message || 'Failed to load folder')
    }
  }

  const fetchFolderResources = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/resources?folderId=${folderId}`)
      if (response.data.success) {
        setResources(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch (err) {
      console.error('Error fetching resources:', err)
      setError(err.response?.data?.message || 'Failed to load resources')
      setResources([]) // Ensure it's always an array on error
    } finally {
      setLoading(false)
    }
  }

  const deleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      await apiClient.delete(`/resources/${resourceId}`)
      await fetchFolderResources()
      alert('Resource deleted successfully!')
    } catch (err) {
      console.error('Error deleting resource:', err)
      alert(err.response?.data?.message || 'Failed to delete resource')
    }
  }

  const handleEditResource = (resource) => {
    setEditingResource(resource)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const getSortedResources = () => {
    if (!Array.isArray(resources)) return []
    const sorted = [...resources]
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      case 'name':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
  }

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getFavicon = (url) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading folder...</p>
        </div>
      </div>
    )
  }

  if (error || !folder) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Folder not found'}</p>
          <button 
            onClick={() => navigate('/genaral/folders')}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-900 text-sm"
          >
            Back to Folders
          </button>
        </div>
      </div>
    )
  }

  const sortedResources = getSortedResources()

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
      
      <div className="min-h-screen bg-zinc-50">
        {/* Header Section */}
        <div className="border-b border-zinc-200">
          <div className="p-6 pb-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
              <button 
                onClick={() => navigate('/genaral/folders')}
                className="hover:text-zinc-900 transition-colors"
              >
                Folders
              </button>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-zinc-900 font-medium">{folder.name}</span>
            </div>

            {/* Folder Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-2xl shadow-sm"
                  style={{ backgroundColor: folder.color + '15', color: folder.color }}
                >
                  {folder.icon || '📁'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 mb-0.5">{folder.name}</h1>
                  {folder.description && (
                    <p className="text-sm text-zinc-600">{folder.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      {resources.length} {resources.length === 1 ? 'resource' : 'resources'}
                    </span>
                    <span>•</span>
                    <span>Updated {getRelativeTime(folder.updatedAt || folder.createdAt)}</span>
                    {folder.isPrivate && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Private
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Resource
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="px-6 pb-4 flex items-center justify-between border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-zinc-50 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                  title="Grid view"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-zinc-50 text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'}`}
                  title="List view"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <div className="text-xs text-zinc-500">
              {sortedResources?.length || 0} {sortedResources?.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {!Array.isArray(sortedResources) || sortedResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-900 mb-1">No resources yet</h3>
              <p className="text-xs text-zinc-500 mb-3">Start adding resources to this folder</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
              >
                Add resource
              </button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.isArray(sortedResources) && sortedResources.map(resource => (
                    <div
                      key={resource._id}
                      className="group border border-zinc-200 rounded-md p-3 hover:shadow-md hover:border-zinc-300 transition-all duration-200 cursor-pointer relative bg-zinc-50"
                      onClick={() => {
                        if (resource.type === 'url' && resource.url) {
                          window.open(resource.url, '_blank')
                        } else if (resource.type === 'document' && resource.file?.path) {
                          window.open(`http://localhost:3000/uploads/${resource.file.path.split('/').pop()}`, '_blank')
                        }
                      }}
                    >
                      {/* Three-dot menu */}
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1 rounded hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id)
                        }}
                      >
                        <svg className="w-4 h-4 text-zinc-400 hover:text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                          <circle cx="4" cy="10" r="1.5" />
                          <circle cx="10" cy="10" r="1.5" />
                          <circle cx="16" cy="10" r="1.5" />
                        </svg>
                      </button>

                      {/* Action Menu */}
                      {actionMenuOpen === resource._id && (
                        <div
                          className="absolute right-2 top-10 w-36 bg-zinc-50 border border-zinc-200 rounded-md shadow-xl z-20 overflow-hidden animate-fade-in"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                            onClick={() => handleEditResource(resource)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                            onClick={() => deleteResource(resource._id)}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Favicon */}
                      <div className="w-10 h-10 bg-zinc-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
                        {getFavicon(resource.url) ? (
                          <img 
                            src={getFavicon(resource.url)} 
                            alt="" 
                            className="w-6 h-6"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <h3 className="font-medium text-zinc-900 mb-1 line-clamp-2 text-sm">
                        {resource.title || 'Untitled'}
                      </h3>
                      {resource.description && (
                        <p className="text-xs text-zinc-500 mb-2 line-clamp-2">
                          {resource.description}
                        </p>
                      )}

                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {resource.tags.slice(0, 3).map((tag, idx) => {
                            const tagName = typeof tag === 'object' ? tag.name : tag
                            const tagColor = typeof tag === 'object' ? tag.color : '#6B7280'
                            // Skip if it looks like an ObjectId (24 hex characters)
                            if (typeof tagName === 'string' && tagName.length === 24 && /^[a-f0-9]{24}$/i.test(tagName)) {
                              return null
                            }
                            return (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px]"
                                style={{ backgroundColor: `${tagColor}20`, color: tagColor }}
                              >
                                {tagName}
                              </span>
                            )
                          }).filter(Boolean)}
                          {resource.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px]">
                              +{resource.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-100">
                        <span className="truncate">
                          {resource.type === 'url' && resource.url ? (
                            (() => {
                              try {
                                return new URL(resource.url).hostname.replace('www.', '')
                              } catch {
                                return 'Invalid URL'
                              }
                            })()
                          ) : (
                            resource.file?.name || 'Document'
                          )}
                        </span>
                        <span>{getRelativeTime(resource.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-1.5">
                  {Array.isArray(sortedResources) && sortedResources.map(resource => (
                    <div
                      key={resource._id}
                      className="group border border-zinc-200 rounded-md p-3 hover:shadow-sm hover:border-zinc-300 transition-all duration-200 cursor-pointer relative bg-zinc-50"
                      onClick={() => {
                        if (resource.type === 'url' && resource.url) {
                          window.open(resource.url, '_blank')
                        } else if (resource.type === 'document' && resource.file?.path) {
                          window.open(`http://localhost:3000/uploads/${resource.file.path.split('/').pop()}`, '_blank')
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Favicon */}
                        <div className="w-9 h-9 bg-zinc-100 rounded-md flex items-center justify-center flex-shrink-0">
                          {getFavicon(resource.url) ? (
                            <img 
                              src={getFavicon(resource.url)} 
                              alt="" 
                              className="w-5 h-5"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            <svg className="w-4 h-4 text-zinc-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-zinc-900 mb-0.5 text-sm">
                            {resource.title || 'Untitled'}
                          </h3>
                          {resource.description && (
                            <p className="text-xs text-zinc-500 mb-1.5 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="truncate">
                              {resource.type === 'url' && resource.url ? (
                                (() => {
                                  try {
                                    return new URL(resource.url).hostname.replace('www.', '')
                                  } catch {
                                    return 'Invalid URL'
                                  }
                                })()
                              ) : (
                                resource.file?.name || 'Document'
                              )}
                            </span>
                            <span>•</span>
                            <span>{getRelativeTime(resource.createdAt)}</span>
                            {resource.tags && resource.tags.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex gap-1">
                                  {resource.tags.slice(0, 2).map((tag, idx) => {
                                    const tagName = typeof tag === 'object' ? tag.name : tag
                                    const tagColor = typeof tag === 'object' ? tag.color : '#6B7280'
                                    // Skip if it looks like an ObjectId (24 hex characters)
                                    if (typeof tagName === 'string' && tagName.length === 24 && /^[a-f0-9]{24}$/i.test(tagName)) {
                                      return null
                                    }
                                    return (
                                      <span 
                                        key={idx} 
                                        className="px-1.5 py-0.5 rounded text-[10px]"
                                        style={{ backgroundColor: `${tagColor}20`, color: tagColor }}
                                      >
                                        {tagName}
                                      </span>
                                    )
                                  }).filter(Boolean)}
                                  {resource.tags.length > 2 && (
                                    <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px]">
                                      +{resource.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Menu */}
                        <button
                          type="button"
                          className="p-1.5 rounded hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionMenuOpen(resource._id === actionMenuOpen ? null : resource._id)
                          }}
                        >
                          <svg className="w-4 h-4 text-zinc-400 hover:text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="4" cy="10" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="16" cy="10" r="1.5" />
                          </svg>
                        </button>

                        {actionMenuOpen === resource._id && (
                          <div
                            className="absolute right-3 top-12 w-36 bg-zinc-50 border border-zinc-200 rounded-md shadow-xl z-20 overflow-hidden animate-fade-in"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                              onClick={() => handleEditResource(resource)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                              onClick={() => deleteResource(resource._id)}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      <AddResource
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onResourceCreated={() => {
          fetchFolderResources()
          setShowAddModal(false)
        }}
        defaultFolder={folderId}
      />

      {/* Edit Resource Modal */}
      <EditResource
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingResource(null)
        }}
        onResourceUpdated={() => {
          fetchFolderResources()
          setShowEditModal(false)
          setEditingResource(null)
        }}
        resource={editingResource}
      />
    </>
  )
}
