import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, MoreVertical, Plus, Search } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function Folders() {
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState(null)
  const [editingFolder, setEditingFolder] = useState(null)

  useEffect(() => {
    fetchFolders()
  }, [])

  useEffect(() => {
    const handleClick = () => setActionMenuOpen(null)
    if (actionMenuOpen !== null) {
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [actionMenuOpen])

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

      // Check if user has persona
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          if (!user.currentPersona && (!user.personas || user.personas.length === 0)) {
            setError('Please set up your persona first')
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Failed to parse user:', e)
        }
      }
      
      console.log('Fetching folders...')
      const response = await apiClient.get('/folders')
      console.log('Folders response:', response.data)
      
      if (response.data.success) {
        const data = response.data.data
        // Handle both formats: direct array or {folders: [], noFolderCount: n}
        let foldersArray = []
        if (Array.isArray(data)) {
          foldersArray = data
        } else if (data && Array.isArray(data.folders)) {
          foldersArray = data.folders
        } else {
          console.error('Invalid data format:', data)
          setFolders([])
          return
        }
        console.log(`Loaded ${foldersArray.length} folders`)
        setFolders(foldersArray)
      } else {
        setError(response.data.message || 'Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
      console.error('Error response:', err.response)
      
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } else if (err.response?.status === 403) {
        setError('You do not have permission. Please set up your persona.')
      } else {
        setError(err.response?.data?.message || 'Failed to load folders')
      }
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      console.log('Creating folder:', newFolderName.trim())
      const response = await apiClient.post('/folders', {
        name: newFolderName.trim()
      })
      
      console.log('Create folder response:', response.data)
      
      if (response.data.success) {
        await fetchFolders()
        setNewFolderName('')
        setShowCreateModal(false)
      } else {
        alert(response.data.message || 'Failed to create folder')
      }
    } catch (err) {
      console.error('Error creating folder:', err)
      alert(err.response?.data?.message || 'Failed to create folder')
    }
  }

  const updateFolder = async (id, name) => {
    if (!name.trim()) return
    
    try {
      console.log('Updating folder:', id, name.trim())
      const response = await apiClient.put(`/folders/${id}`, { name: name.trim() })
      
      console.log('Update folder response:', response.data)
      
      if (response.data.success) {
        await fetchFolders()
        setEditingFolder(null)
      } else {
        alert(response.data.message || 'Failed to update folder')
      }
    } catch (err) {
      console.error('Error updating folder:', err)
      alert(err.response?.data?.message || 'Failed to update folder')
    }
  }

  const deleteFolder = async (id) => {
    if (!confirm('Are you sure you want to delete this folder? All resources will be moved to Uncategorized.')) return
    
    try {
      console.log('Deleting folder:', id)
      await apiClient.delete(`/folders/${id}`)
      await fetchFolders()
      setActionMenuOpen(null)
    } catch (err) {
      console.error('Error deleting folder:', err)
      alert(err.response?.data?.message || 'Failed to delete folder')
    }
  }

  const filtered = Array.isArray(folders) ? folders.filter(f => {
    if (!query) return true
    return f.name.toLowerCase().includes(query.toLowerCase())
  }) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-600 text-sm">Loading folders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md w-full">
          <h2 className="text-red-900 font-semibold text-lg mb-2">Unable to Load Folders</h2>
          <p className="text-red-800 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchFolders}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
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
        
        .folder-card {
          transition: all 0.2s ease;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .modal-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-zinc-100 px-4 pt-6 pb-4 sticky top-0 z-10 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-zinc-900">Folders</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-800 transition-colors"
            >
              New Folder
            </button>
          </div>
        
          {/* Search Bar */}
          <div className="flex items-center bg-zinc-50 rounded-md px-3 py-2">
            <Search size={16} className="text-zinc-400 mr-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search folders..."
              className="bg-transparent outline-none text-sm text-zinc-700 w-full placeholder:text-zinc-400"
            />
          </div>
        </div>

      {/* Folders Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Folder size={32} className="text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              {query ? 'No folders found' : 'No folders yet'}
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {query ? 'Try a different search term' : 'Organize your resources with folders'}
            </p>
            {!query && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-md hover:bg-zinc-800 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create First Folder
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(folder => (
            <div
              key={folder._id}
              className="folder-card bg-white border border-zinc-200 rounded-lg p-4 relative hover:border-zinc-300 cursor-pointer"
              onClick={() => navigate(`/student/folders/${folder._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <Folder size={20} className="text-zinc-600" />
                </div>
                <button
                  className="p-2 -mr-2 -mt-1 hover:bg-zinc-100 active:bg-zinc-200 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuOpen(folder._id === actionMenuOpen ? null : folder._id);
                  }}
                >
                  <MoreVertical size={18} className="text-zinc-600" />
                </button>
              </div>
              
              <h3 className="text-sm font-semibold text-zinc-900 truncate mb-1">
                {folder.name}
              </h3>
              
              <p className="text-xs text-zinc-500">
                {folder.resourceCount || 0} {folder.resourceCount === 1 ? 'item' : 'items'}
              </p>

              {actionMenuOpen === folder._id && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActionMenuOpen(null)
                    }}
                  />
                  <div
                    className="absolute top-full right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-2xl z-40 overflow-hidden fade-in"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-4 py-3.5 text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors font-medium"
                      onClick={() => {
                        setActionMenuOpen(null)
                        setEditingFolder(folder)
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="w-full text-left px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors border-t border-zinc-100 font-medium"
                      onClick={() => {
                        setActionMenuOpen(null)
                        deleteFolder(folder._id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 fade-in"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 modal-slide-up shadow-2xl">
            <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Create Folder</h2>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') createFolder()
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewFolderName('')
                }}
                className="flex-1 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Folder Modal */}
      {editingFolder && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 fade-in"
            onClick={() => setEditingFolder(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 modal-slide-up shadow-2xl">
            <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-zinc-900 mb-6">Rename Folder</h2>
            
            <input
              type="text"
              defaultValue={editingFolder.name}
              onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
              placeholder="Folder name"
              className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateFolder(editingFolder._id, editingFolder.name)
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingFolder(null)}
                className="flex-1 py-3 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateFolder(editingFolder._id, editingFolder.name)}
                disabled={!editingFolder.name?.trim()}
                className="flex-1 py-3 text-sm font-medium text-white bg-zinc-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </>
  )
}
