import React, { useState, useEffect } from 'react'
import { X, Plus, Edit2, Trash2 } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function ManageTags({ isOpen, onClose, onTagsUpdated }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3B82F6')
  const [editingTag, setEditingTag] = useState(null)

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  useEffect(() => {
    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/tags')
      if (response.data.success) {
        setTags(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const response = await apiClient.post('/tags', {
        name: newTagName,
        color: newTagColor
      })
      
      if (response.data.success) {
        await fetchTags()
        setNewTagName('')
        setNewTagColor('#3B82F6')
        setShowCreateTag(false)
        onTagsUpdated?.()
      }
    } catch (err) {
      console.error('Error creating tag:', err)
      alert(err.response?.data?.message || 'Failed to create tag')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTag = async (tagId, updates) => {
    setLoading(true)
    try {
      const response = await apiClient.put(`/tags/${tagId}`, updates)
      
      if (response.data.success) {
        await fetchTags()
        setEditingTag(null)
        onTagsUpdated?.()
      }
    } catch (err) {
      console.error('Error updating tag:', err)
      alert(err.response?.data?.message || 'Failed to update tag')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Are you sure you want to delete this tag?')) return

    setLoading(true)
    try {
      await apiClient.delete(`/tags/${tagId}`)
      await fetchTags()
      onTagsUpdated?.()
    } catch (err) {
      console.error('Error deleting tag:', err)
      alert(err.response?.data?.message || 'Failed to delete tag')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 rounded-full"></div>
        </div>
        
        <div className="px-5 pb-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Manage Tags</h2>
            <p className="text-xs text-zinc-500">Organize with custom tags</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500" strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {showCreateTag ? (
            <form onSubmit={handleCreateTag} className="mb-4 p-4 bg-zinc-50 rounded-xl">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 mb-3 text-sm"
                autoFocus
              />
              <div className="flex gap-2 mb-4">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-9 h-9 rounded-lg border-2 transition-all ${
                      newTagColor === color ? 'border-zinc-900 scale-110' : 'border-zinc-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTag(false)
                    setNewTagName('')
                    setNewTagColor('#3B82F6')
                  }}
                  className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateTag(true)}
              className="w-full mb-4 py-3.5 px-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-700 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Plus size={20} strokeWidth={2} />
              Create New Tag
            </button>
          )}

          <div className="space-y-2">
            {tags.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-900">No tags yet</p>
                <p className="text-xs text-zinc-500 mt-1">Create tags to organize your resources</p>
              </div>
            ) : (
              tags.map(tag => (
                <div
                  key={tag._id}
                  className="p-3.5 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 transition-colors"
                >
                  {editingTag === tag._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={tag.name}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== tag.name) {
                            handleUpdateTag(tag._id, { name: e.target.value })
                          } else {
                            setEditingTag(null)
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-lg"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-zinc-900 text-sm">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTag(tag._id)}
                          className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors"
                        >
                          <Edit2 size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag._id)}
                          disabled={loading}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
