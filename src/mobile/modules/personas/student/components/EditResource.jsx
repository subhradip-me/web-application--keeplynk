import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function EditResource({ isOpen, onClose, onResourceUpdated, resource }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && resource) {
      setTitle(resource.title || '')
      setUrl(resource.url || '')
      setDescription(resource.description || '')
      setSelectedTags(resource.tags || [])
      fetchTags()
    }
  }, [isOpen, resource])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiClient.put(`/resources/${resource._id}`, {
        title,
        url: resource.type === 'url' ? url : undefined,
        description,
        tags: selectedTags
      })

      if (response.data.success) {
        onResourceUpdated?.()
        onClose()
      }
    } catch (err) {
      console.error('Error updating resource:', err)
      alert(err.response?.data?.message || 'Failed to update resource')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (!isOpen || !resource) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Edit Resource</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>

          {resource.type === 'url' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag._id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTags.includes(tag._id)
                      ? 'text-white'
                      : 'bg-zinc-100 text-zinc-700'
                  }`}
                  style={selectedTags.includes(tag._id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-zinc-900 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
