import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../../shared/api/apiClient'
import AddFolder from '../components/AddFolder'
import EditFolder from '../components/EditFolder'

export default function Folders() {
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)

  // Fetch folders and resources on mount
  useEffect(() => {
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
  const fetchFolders = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to view folders')
        setLoading(false)
        return
      }

      const response = await apiClient.get('/folders')
      
      if (response.data.success) {
        const result = response.data.data
        // Backend returns { folders: [...], noFolderCount: ... }
        if (result.folders) {
          setFolders(Array.isArray(result.folders) ? result.folders : [])
        } else if (Array.isArray(result)) {
          // Fallback for direct array response
          setFolders(result)
        } else {
          setFolders([])
        }
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
      setFolders([]) // Ensure it's always an array on error
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else {
        setError(err.response?.data?.message || 'Failed to load folders')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchResources = async () => {
    try {
      const response = await apiClient.get('/resources')
      if (response.data.success) {
        setResources(Array.isArray(response.data.data) ? response.data.data : [])
      }
    } catch (err) {
      console.error('Error fetching resources:', err)
      setResources([]) // Ensure it's always an array on error
    }
  }

  const deleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder? All resources will be moved to Uncategorized folder.')) return

    try {
      await apiClient.delete(`/folders/${folderId}`)
      await fetchFolders()
      await fetchResources()
      alert('Folder deleted successfully!')
    } catch (err) {
      console.error('Error deleting folder:', err)
      alert(err.response?.data?.message || 'Failed to delete folder')
    }
  }

  // Helper Functions
  const openEditModal = (folder) => {
    setEditingFolder(folder)
    setShowEditModal(true)
    setActionMenuOpen(null)
  }

  const handleFolderCreated = async () => {
    await fetchFolders()
    await fetchResources()
  }

  const handleFolderUpdated = async () => {
    await fetchFolders()
    await fetchResources()
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

  const getResourceCount = (folderId) => {
    // Use resourceCount from folder object if available (from API)
    const folder = Array.isArray(folders) ? folders.find(f => f._id === folderId) : null
    if (folder && folder.resourceCount !== undefined) {
      return folder.resourceCount
    }
    // Fallback to counting from resources array
    return Array.isArray(resources) ? resources.filter(resource => {
      const resourceFolder = resource.folder?._id || resource.folder
      return resourceFolder === folderId
    }).length : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading folders...</p>
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
            onClick={fetchFolders}
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
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }
      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
      .line-clamp-1 {
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }
    `}</style>
    <div className="min-h-screen bg-zinc-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Folders</h1>
          <p className="text-sm text-zinc-600">Organize your resources into collections</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Folder
        </button>
      </div>
      
      <div className="px-8 pb-8">
        {!Array.isArray(folders) || folders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">No folders yet</h3>
            <p className="text-sm text-zinc-500 mb-4">Create a folder to organize your resources</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {folders.map(folder => (
              <div 
                key={folder._id} 
                className="group border border-zinc-200 rounded-lg p-4 hover:shadow-sm hover:border-zinc-300 transition-all duration-150 cursor-pointer relative bg-zinc-50"
                onClick={() => navigate(`/student/folders/${folder._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-lg shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: folder.color + '15', color: folder.color }}
                    >
                      {folder.icon || '📁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-zinc-900 truncate">{folder.name}</h2>
                      {folder.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{folder.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded hover:bg-zinc-100 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label="Folder actions"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActionMenuOpen(folder._id === actionMenuOpen ? null : folder._id)
                    }}
                  >
                    <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="4" cy="10" r="1.5" />
                      <circle cx="10" cy="10" r="1.5" />
                      <circle cx="16" cy="10" r="1.5" />
                    </svg>
                  </button>
                  {actionMenuOpen === folder._id && (
                    <div
                      className="absolute right-2 top-12 w-36 bg-zinc-50 border border-zinc-200 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                        onClick={() => openEditModal(folder)}
                      >
                        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                        onClick={() => deleteFolder(folder._id)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    {getResourceCount(folder._id)}
                  </span>
                  <span className="text-[10px]">{getRelativeTime(folder.updatedAt || folder.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddFolder 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onFolderCreated={handleFolderCreated}
      />
      
      <EditFolder 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingFolder(null)
        }}
        onFolderUpdated={handleFolderUpdated}
        folder={editingFolder}
      />
    </div>
    </>
  )
}
