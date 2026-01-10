import React, { useState, useEffect } from 'react'
import { X, Folder, Plus } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function MoveToFolder({ isOpen, onClose, resource, onMoved }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchFolders()
    }
  }, [isOpen])

  const fetchFolders = async () => {
    try {
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
      setFolders([])
    }
  }

  const handleMoveToFolder = async (folderId) => {
    if (!resource?._id || loading) return
    
    setLoading(true)
    try {
      await apiClient.put(`/resources/${resource._id}`, {
        folderId: folderId || null
      })
      onMoved?.()
      onClose()
    } catch (err) {
      console.error('Error moving resource:', err)
      alert(err.response?.data?.message || 'Failed to move resource')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!newFolderName.trim()) return

    try {
      const response = await apiClient.post('/folders', {
        name: newFolderName,
        persona: 'student'
      })
      
      if (response.data.success) {
        await fetchFolders()
        setNewFolderName('')
        setShowCreateFolder(false)
      }
    } catch (err) {
      console.error('Error creating folder:', err)
      alert(err.response?.data?.message || 'Failed to create folder')
    }
  }

  if (!isOpen) return null

  const currentFolderId = resource?.folder?._id || resource?.folder

  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-end animate-fade-in"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div 
        className="bg-white w-full rounded-t-2xl max-h-[75vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto mt-3 mb-2"></div>
        
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Move to Folder</h2>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }} 
            className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {showCreateFolder ? (
            <div className="p-5">
              <form onSubmit={handleCreateFolder} className="space-y-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateFolder(false)
                      setNewFolderName('')
                    }}
                    className="flex-1 py-2.5 px-4 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="flex-1 py-2.5 px-4 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 active:bg-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* No Folder Option */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleMoveToFolder(null)
                }}
                disabled={loading}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                  📂
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-zinc-900">No Folder</h3>
                  <p className="text-xs text-zinc-500">Remove from folder</p>
                </div>
                {!currentFolderId && (
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Divider */}
              {folders.length > 0 && (
                <div className="h-px bg-zinc-100 my-1"></div>
              )}

              {/* Folder Options */}
              {folders.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Folder size={24} className="text-zinc-400" />
                  </div>
                  <p className="text-sm text-zinc-500 mb-1">No folders yet</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateFolder(true)
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first folder
                  </button>
                </div>
              ) : (
                <div>
                  {folders.map(folder => (
                    <button
                      key={folder._id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMoveToFolder(folder._id)
                      }}
                      disabled={loading}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left disabled:opacity-50"
                    >
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ 
                          backgroundColor: folder.color ? `${folder.color}20` : '#f4f4f5',
                          color: folder.color || '#71717a'
                        }}
                      >
                        {folder.icon || '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-zinc-900 truncate">{folder.name}</h3>
                        {folder.description && (
                          <p className="text-xs text-zinc-500 truncate">{folder.description}</p>
                        )}
                      </div>
                      {currentFolderId === folder._id && (
                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {loading && (
                        <div className="shrink-0">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-zinc-300 border-t-zinc-900"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Create New Folder Button */}
              {folders.length > 0 && (
                <>
                  <div className="h-px bg-zinc-100 my-1"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowCreateFolder(true)
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors text-left text-zinc-600"
                  >
                    <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                      <Plus size={18} className="text-zinc-600" />
                    </div>
                    <span className="text-sm font-medium">Create New Folder</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(100%);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
