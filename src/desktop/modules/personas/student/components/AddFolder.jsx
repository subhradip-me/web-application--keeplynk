import React, { useState, useEffect } from 'react'
import { X, Folder } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

const PRESET_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F59E0B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Gray', hex: '#6B7280' }
]

const PRESET_ICONS = ['📁', '📂', '📚', '💼', '🎯', '🔖', '⭐', '🎨', '📝', '🔬', '💡', '🚀']

export default function AddFolder({ isOpen, onClose, onFolderCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, loading, onClose])

  const handleSave = async () => {
    setError(null)
    
    // Validation
    if (!name.trim()) {
      setError('Folder name is required')
      return
    }

    const folderData = {
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      icon: selectedIcon
    }

    try {
      setLoading(true)
      
      const response = await apiClient.post('/folders', folderData)
      
      if (response.data.success) {
        // Reset form
        setName('')
        setDescription('')
        setSelectedColor('#3B82F6')
        setSelectedIcon('📁')
        
        // Notify parent to refresh folders
        if (onFolderCreated) {
          onFolderCreated()
        }
        
        onClose()
      }
    } catch (err) {
      console.error('Error creating folder:', err)
      const errorMessage = err.response?.data?.message || 'Failed to create folder'
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => !loading && onClose()}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Create New Folder</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
            >
              <X size={18} className="text-zinc-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Name Field */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                <Folder size={14} />
                Folder Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work Projects, Study Notes, Personal"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Description <span className="text-xs text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this folder"
                rows="2"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      selectedIcon === icon
                        ? 'bg-zinc-900 scale-110'
                        : 'bg-zinc-100 hover:bg-zinc-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      selectedColor === color.hex
                        ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-zinc-200">
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Preview
              </label>
              <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
                >
                  {selectedIcon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-zinc-900">
                    {name || 'Folder Name'}
                  </div>
                  {description && (
                    <div className="text-sm text-zinc-500 mt-0.5">
                      {description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                {error}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Folder'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
