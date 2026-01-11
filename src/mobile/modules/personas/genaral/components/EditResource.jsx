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
    <div className="fixed inset-0 bg-black/30 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-zinc-300 rounded-full"></div>
        </div>
        
        <div className="px-5 pb-2 flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-zinc-900">Edit Resource</h2>
            <p className="text-xs text-zinc-500">Update your resource details</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 text-sm transition-all"
              required
            />
          </div>

          {resource.type === 'url' && (
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 text-sm transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:bg-white focus:border-zinc-400 resize-none text-sm transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag._id}
                  type="button"
                  onClick={() => toggleTag(tag._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedTags.includes(tag._id)
                      ? 'text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                  style={selectedTags.includes(tag._id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-medium disabled:opacity-50 transition-colors text-sm"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
