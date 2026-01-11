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
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [createError, setCreateError] = useState(null)
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
    if (!newFolderName.trim()) {
      setCreateError('Folder name is required')
      return
    }
    
    try {
      setCreateError(null)
      console.log('Creating folder:', newFolderName.trim())
      const response = await apiClient.post('/folders', {
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        color: selectedColor,
        icon: selectedIcon
      })
      
      console.log('Create folder response:', response.data)
      
      if (response.data.success) {
        await fetchFolders()
        setNewFolderName('')
        setNewFolderDescription('')
        setSelectedColor('#3B82F6')
        setSelectedIcon('📁')
        setCreateError(null)
        setShowCreateModal(false)
      } else {
        setCreateError(response.data.message || 'Failed to create folder')
      }
    } catch (err) {
      console.error('Error creating folder:', err)
      const errorMessage = err.response?.data?.message || 'Failed to create folder'
      if (err.response?.status === 401) {
        setCreateError('Session expired. Please log in again.')
      } else {
        setCreateError(errorMessage)
      }
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
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-200 border-t-zinc-900 mx-auto mb-3"></div>
          <p className="text-zinc-500 text-sm font-medium">Loading folders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-white flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md w-full">
          <h2 className="text-red-900 font-semibold text-base mb-2">Unable to Load Folders</h2>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchFolders}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors active:scale-[0.98]"
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
        <div className="border-b border-zinc-100 px-4 pt-4 pb-4 sticky top-0 z-10 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-zinc-900">Folders</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Folder
            </button>
          </div>
        
          {/* Search Bar */}
          <div className="flex items-center bg-zinc-100/70 rounded-lg px-3 py-2.5 border border-zinc-200">
            <Search size={18} className="text-zinc-400 mr-2.5" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search folders..."
              className="bg-transparent outline-none text-sm text-zinc-900 w-full placeholder:text-zinc-400"
            />
          </div>
        </div>

      {/* Folders Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1">
              {query ? 'No folders found' : 'No folders yet'}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              {query ? 'Try a different search term' : 'Create a folder to organize your resources'}
            </p>
            {!query && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first folder
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {filtered.map(folder => (
            <div
              key={folder._id}
              className="folder-card group bg-zinc-50 border border-zinc-200 rounded-lg p-4 relative hover:border-zinc-300 hover:shadow-sm cursor-pointer transition-all"
              onClick={() => navigate(`/genaral/folders/${folder._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-transform group-hover:scale-105"
                  style={{ backgroundColor: (folder.color || '#3B82F6') + '15', color: folder.color || '#3B82F6' }}
                >
                  {folder.icon || '📁'}
                </div>
                <button
                  className="p-1.5 rounded hover:bg-zinc-100 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuOpen(folder._id === actionMenuOpen ? null : folder._id);
                  }}
                >
                  <svg className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                  </svg>
                </button>
              </div>
              
              <h2 className="text-sm font-semibold text-zinc-900 truncate">{folder.name}</h2>
              {folder.description && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{folder.description}</p>
              )}
              <p className="text-xs text-zinc-400 mt-1">
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
                    className="absolute right-2 top-12 w-36 bg-zinc-50 border border-zinc-200 rounded-lg shadow-xl z-40 overflow-hidden fade-in"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setActionMenuOpen(null)
                        setEditingFolder(folder)
                      }}
                    >
                      <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                      onClick={() => {
                        setActionMenuOpen(null)
                        deleteFolder(folder._id)
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
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
            className="fixed inset-0 bg-black/30 z-40 fade-in"
            onClick={() => {
              setShowCreateModal(false)
              setCreateError(null)
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 modal-slide-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-center pt-4 pb-2 sticky top-0 bg-white z-10">
              <div className="w-10 h-1 bg-zinc-300 rounded-full" />
            </div>
            <div className="px-5 pb-5">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Folder size={24} className="text-purple-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Create Folder</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Organize your resources</p>
                  </div>
                </div>
              </div>
            
            {/* Name Field */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Work Projects, Study Notes"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-zinc-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newFolderName.trim()) createFolder()
                }}
              />
            </div>

            {/* Description Field */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Description <span className="text-xs text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Brief description of this folder"
                rows="2"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-zinc-400 resize-none"
              />
            </div>

            {/* Icon Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {['📁', '📂', '📚', '💼', '🎯', '🔖', '⭐', '🎨', '📝', '🔬', '💡', '🚀'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                      selectedIcon === icon
                        ? 'bg-zinc-700 scale-105'
                        : 'bg-zinc-100 active:bg-zinc-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Blue', hex: '#3B82F6' },
                  { name: 'Purple', hex: '#8B5CF6' },
                  { name: 'Pink', hex: '#EC4899' },
                  { name: 'Red', hex: '#EF4444' },
                  { name: 'Orange', hex: '#F59E0B' },
                  { name: 'Green', hex: '#10B981' },
                  { name: 'Teal', hex: '#14B8A6' },
                  { name: 'Gray', hex: '#6B7280' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-11 h-11 rounded-xl transition-all ${
                      selectedColor === color.hex
                        ? 'ring-2 ring-offset-2 ring-zinc-700 scale-105'
                        : ''
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4 pt-3 border-t border-zinc-200">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Preview
              </label>
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
                >
                  {selectedIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 truncate">
                    {newFolderName || 'Folder Name'}
                  </div>
                  {newFolderDescription && (
                    <div className="text-sm text-zinc-500 mt-0.5 truncate">
                      {newFolderDescription}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                {createError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewFolderName('')
                  setNewFolderDescription('')
                  setSelectedColor('#3B82F6')
                  setSelectedIcon('📁')
                  setCreateError(null)
                }}
                className="flex-1 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 py-3 text-sm font-semibold text-white bg-zinc-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors active:scale-[0.98]"
              >
                Create
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Folder Modal */}
      {editingFolder && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 fade-in"
            onClick={() => setEditingFolder(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 modal-slide-up shadow-2xl">
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 bg-zinc-300 rounded-full" />
            </div>
            <div className="px-5 pb-5">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Rename Folder</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Update folder name</p>
                  </div>
                </div>
              </div>
            
            <input
              type="text"
              defaultValue={editingFolder.name}
              onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
              placeholder="Folder name"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-zinc-400 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateFolder(editingFolder._id, editingFolder.name)
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setEditingFolder(null)}
                className="flex-1 py-3 text-sm font-semibold text-zinc-700 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateFolder(editingFolder._id, editingFolder.name)}
                disabled={!editingFolder.name?.trim()}
                className="flex-1 py-3 text-sm font-semibold text-white bg-zinc-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-600 transition-colors"
              >
                Save
              </button>
            </div>
            </div>
          </div>
        </>
      )}
      </div>
    </>
  )
}
