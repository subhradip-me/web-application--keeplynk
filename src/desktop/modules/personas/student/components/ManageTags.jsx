import React, { useState, useEffect, useRef } from 'react'
import { X, Tag, Plus, Pencil, Trash2 } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function ManageTags({ isOpen, onClose }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [editingTag, setEditingTag] = useState(null)

  // Fetch tags when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  // API Functions
  const fetchTags = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/tags')
      if (response.data.success) {
        console.log('Tags data received:', response.data.data)
        response.data.data.forEach(tag => {
          console.log(`Tag: ${tag.name}, usageCount: ${tag.usageCount}`)
        })
        setTags(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
      setError(err.response?.data?.message || 'Failed to load tags')
    } finally {
      setLoading(false)
    }
  }

  const createTag = async (tagData) => {
    try {
      const response = await apiClient.post('/tags', tagData)
      if (response.data.success) {
        await fetchTags()
        return response.data.data
      }
    } catch (err) {
      console.error('Error creating tag:', err)
      throw err
    }
  }

  const updateTag = async (id, updates) => {
    try {
      const response = await apiClient.put(`/tags/${id}`, updates)
      if (response.data.success) {
        await fetchTags()
        return response.data.data
      }
    } catch (err) {
      console.error('Error updating tag:', err)
      throw err
    }
  }

  const deleteTag = async (id) => {
    try {
      await apiClient.delete(`/tags/${id}`)
      await fetchTags()
    } catch (err) {
      console.error('Error deleting tag:', err)
      throw err
    }
  }

  const colors = [
    { hex: '#3B82F6', name: 'Blue' },
    { hex: '#8B5CF6', name: 'Purple' },
    { hex: '#10B981', name: 'Green' },
    { hex: '#F59E0B', name: 'Yellow' },
    { hex: '#EF4444', name: 'Red' },
    { hex: '#EC4899', name: 'Pink' },
    { hex: '#F97316', name: 'Orange' },
    { hex: '#06B6D4', name: 'Cyan' },
  ]

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      try {
        await createTag({
          name: newTagName.trim(),
          color: newTagColor
        })
        setNewTagName('')
        setNewTagColor('#3B82F6')
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to create tag')
      }
    }
  }

  const handleDeleteTag = async (id) => {
    if (confirm('Are you sure you want to delete this tag?')) {
      try {
        await deleteTag(id)
      } catch (err) {
        alert('Failed to delete tag')
      }
    }
  }

  const editInputRef = useRef(null)

  const handleEditTag = (tag) => {
    // create a copy so edits don't mutate state until saved
    setEditingTag({ ...tag })
  }

  useEffect(() => {
    if (editingTag && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTag])

  const handleSaveEdit = async () => {
    if (!editingTag || !editingTag.name.trim()) return
    try {
      await updateTag(editingTag._id, {
        name: editingTag.name.trim(),
        color: editingTag.color
      })
      setEditingTag(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tag')
    }
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-label="Close tag panel"
        tabIndex={-1}
      />
      {/* Slide-in Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-zinc-600" />
            <h2 className="text-lg font-semibold text-zinc-900">Manage Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
          {/* Create New Tag */}
          <div className="mb-8">
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              Create New Tag
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Tag name"
                className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm"
                aria-label="New tag name"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="px-3 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add tag"
              >
                <Plus size={18} />
              </button>
            </div>
            {/* Color Picker */}
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setNewTagColor(color.hex)}
                  className={`w-7 h-7 rounded-full border-2 border-white shadow-sm transition-all ${
                    newTagColor === color.hex ? 'ring-1 ring-zinc-900 ring-offset-2 scale-110' : 'hover:ring-1 hover:ring-zinc-400'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={color.name}
                  tabIndex={0}
                />
              ))}
            </div>
          </div>

          {/* Tags List */}
          <div>
            <h3 className="text-sm font-medium text-zinc-700 mb-3">
              All Tags <span className="text-xs text-zinc-400">({tags.length})</span>
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : (
            <div className="space-y-2">
              {tags.map((tag) => {
                const isEditing = editingTag?._id === tag._id
                return (
                  <div
                    key={tag._id}
                    className="flex items-center justify-between p-3 rounded-md border border-zinc-100 hover:border-zinc-200 transition-colors bg-white"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex flex-col items-center gap-2">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          className="flex-1 px-2 py-1 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-0.5 focus:ring-zinc-500"
                          aria-label="Edit tag name"
                        />
                        <div className="flex gap-1">
                          {colors.map((color) => (
                            <button
                              key={color.hex}
                              onClick={() => setEditingTag({ ...editingTag, color: color.hex })}
                              className={`w-5 h-5 rounded-full border-2 border-white shadow-sm transition-all ${
                                editingTag.color === color.hex ? 'ring-1 ring-zinc-900 scale-110' : 'hover:ring-1 hover:ring-zinc-400'
                              }`}
                              style={{ backgroundColor: color.hex }}
                              aria-label={color.name}
                              tabIndex={0}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium truncate max-w-[140px]"
                            style={{ 
                              backgroundColor: `${tag.color}20`,
                              color: tag.color
                            }}
                          >
                            {tag.name}
                          </span>
                          <span className="text-xs text-zinc-400 truncate">
                            {tag.usageCount ?? 0} resource{(tag.usageCount ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditTag(tag)}
                            className="p-1.5 hover:bg-zinc-100 rounded text-zinc-600 transition-colors"
                            aria-label="Edit tag"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag._id)}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                            aria-label="Delete tag"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                    {isEditing && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editingTag.name.trim()}
                          className="px-2 py-1 bg-zinc-900 text-white rounded text-xs hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs hover:bg-zinc-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>            )}          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          Tags help organize your resources. You can assign multiple tags to each resource.
        </div>
      </div>
    </>
  )
}
