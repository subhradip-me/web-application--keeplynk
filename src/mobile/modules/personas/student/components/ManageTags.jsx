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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Manage Tags</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {showCreateTag ? (
            <form onSubmit={handleCreateTag} className="mb-4 p-4 bg-zinc-50 rounded-lg">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 mb-3"
                autoFocus
              />
              <div className="flex gap-2 mb-3">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newTagColor === color ? 'border-zinc-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTag(false)
                    setNewTagName('')
                    setNewTagColor('#3B82F6')
                  }}
                  className="flex-1 py-2 px-3 bg-zinc-100 text-zinc-700 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-zinc-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateTag(true)}
              className="w-full mb-4 py-3 px-4 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg text-zinc-600 font-medium flex items-center justify-center gap-2 hover:bg-zinc-100"
            >
              <Plus size={20} />
              Create New Tag
            </button>
          )}

          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-center text-zinc-400 py-8">No tags yet</p>
            ) : (
              tags.map(tag => (
                <div
                  key={tag._id}
                  className="p-3 bg-white border border-zinc-200 rounded-lg"
                >
                  {editingTag === tag._id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue={tag.name}
                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium text-zinc-900">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingTag(tag._id)}
                          className="p-2 hover:bg-zinc-100 rounded text-zinc-500"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag._id)}
                          disabled={loading}
                          className="p-2 hover:bg-red-50 rounded text-red-500 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
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
