import React, { useState, useEffect } from 'react'
import apiClient from '../../../shared/api/apiClient'

export default function MoveToFolder({ isOpen, onClose, bookmark, onMoved, position }) {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(false)

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
      setFolders([]) // Ensure it's always an array on error
    }
  }

  const handleMoveToFolder = async (folderId) => {
    if (!bookmark?._id || loading) return

    try {
      setLoading(true)
      await apiClient.put(`/resources/${bookmark._id}`, {
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

  if (!isOpen) return null

  const currentFolderId = bookmark?.folder?._id || bookmark?.folder

  return (
    <div
      className="absolute right-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-xl z-30 overflow-hidden animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-xs font-medium text-zinc-700">Move to Folder</span>
        </div>
      </div>

      {/* Folders List */}
      <div className="max-h-80 overflow-y-auto">
        {/* No Folder Option */}
        <button
          onClick={() => handleMoveToFolder(null)}
          disabled={loading}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors text-left disabled:opacity-50"
        >
          <div className="w-6 h-6 bg-zinc-100 rounded flex items-center justify-center text-sm flex-shrink-0">
            📂
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-zinc-900 text-xs font-medium">No Folder</div>
            <div className="text-zinc-500 text-[10px]">Remove from folder</div>
          </div>
          {!currentFolderId && (
            <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Divider */}
        {folders.length > 0 && (
          <div className="border-t border-zinc-100 my-1"></div>
        )}

        {/* Folder Options */}
        {Array.isArray(folders) && folders.map(folder => (
          <button
            key={folder._id}
            onClick={() => handleMoveToFolder(folder._id)}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors text-left disabled:opacity-50"
          >
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
              style={{ backgroundColor: folder.color + '20', color: folder.color }}
            >
              {folder.icon || '📁'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-zinc-900 text-xs font-medium truncate">{folder.name}</div>
              {folder.description && (
                <div className="text-zinc-500 text-[10px] truncate">{folder.description}</div>
              )}
            </div>
            {currentFolderId === folder._id && (
              <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}

        {folders.length === 0 && (
          <div className="px-3 py-4 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-xs text-zinc-500 mb-2">No folders yet</p>
            <a
              href="/student/folders"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              onClick={onClose}
            >
              Create a folder
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </div>
  )
}
