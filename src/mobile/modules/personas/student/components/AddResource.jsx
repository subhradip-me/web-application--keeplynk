import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function AddResource({ isOpen, onClose, onResourceCreated }) {
  const [type, setType] = useState('url')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isAIFilling, setIsAIFilling] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const tagInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = tags
        .filter(tag => 
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !selectedTags.includes(tag.name)
        )
        .slice(0, 5)
      setTagSuggestions(filtered)
    } else {
      setTagSuggestions([])
    }
  }, [tagInput, tags, selectedTags])

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus()
    }
  }, [showTagInput])

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

  const handleAIFill = async () => {
    if (!url.trim() || type !== 'url') return
    
    try {
      setIsAIFilling(true)
      
      // Call backend AI Engine endpoint
      const response = await apiClient.post('/organise/extract-metadata', {
        url: url.trim()
      })
      
      if (response.data.success) {
        const metadata = response.data.data
        
        // Fill title if empty (prefer original HTML title)
        if (metadata.title && !title) {
          setTitle(metadata.title)
        }
        
        // Fill description (AI-generated)
        if (metadata.description && !description) {
          setDescription(metadata.description)
        }
        
        // Add suggested tags (AI-generated)
        if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
          const newTags = metadata.tags.filter(tag => !selectedTags.includes(tag))
          if (newTags.length > 0) {
            setSelectedTags([...selectedTags, ...newTags])
          }
        }
      }
    } catch (err) {
      console.error('AI fill error:', err)
    } finally {
      setIsAIFilling(false)
    }
  }

  const handleAddTag = async (e, tagName = null) => {
    if (e.key === 'Enter' && (tagInput.trim() || tagName)) {
      e.preventDefault()
      const newTagName = tagName || tagInput.trim()
      
      if (!selectedTags.includes(newTagName)) {
        // Check if tag exists
        const existingTag = tags.find(t => t.name.toLowerCase() === newTagName.toLowerCase())
        
        if (!existingTag) {
          // Create new tag
          try {
            const response = await apiClient.post('/tags', {
              name: newTagName,
              color: '#3B82F6'
            })
            if (response.data.success) {
              setTags([...tags, response.data.data])
            }
          } catch (err) {
            console.error('Error creating tag:', err)
          }
        }
        
        setSelectedTags([...selectedTags, newTagName])
      }
      setTagInput('')
      setTagSuggestions([])
      setShowTagInput(false)
    }
  }

  const handleSelectSuggestion = (tagName) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName])
    }
    setTagInput('')
    setTagSuggestions([])
    setShowTagInput(false)
  }

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let response
      
      if (type === 'url') {
        response = await apiClient.post('/resources', {
          type: 'url',
          title,
          url,
          description,
          tags: selectedTags
        })
      } else {
        const formData = new FormData()
        formData.append('type', 'document')
        formData.append('title', title)
        formData.append('description', description)
        formData.append('file', file)
        selectedTags.forEach(tag => formData.append('tags[]', tag))

        response = await apiClient.post('/resources', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      if (response.data.success) {
        onResourceCreated?.()
        resetForm()
        onClose()
      }
    } catch (err) {
      console.error('Error creating resource:', err)
      alert(err.response?.data?.message || 'Failed to create resource')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setType('url')
    setTitle('')
    setUrl('')
    setDescription('')
    setFile(null)
    setSelectedTags([])
    setTagInput('')
    setTagSuggestions([])
    setShowTagInput(false)
  }

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full rounded-t-[28px] max-h-[92vh] overflow-y-auto shadow-2xl border-t border-zinc-100">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-zinc-300 rounded-full"></div>
        </div>
        
        <div className="px-6 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Add Resource</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg active:scale-95 transition-all">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('url')}
                className={`flex-1 py-2 px-3.5 rounded-md text-sm transition-all ${
                  type === 'url' 
                    ? 'bg-zinc-100 text-zinc-900' 
                    : 'bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setType('document')}
                className={`flex-1 py-2 px-3.5 rounded-md text-sm transition-all ${
                  type === 'document' 
                    ? 'bg-zinc-100 text-zinc-900' 
                    : 'bg-white text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                Document
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 text-base placeholder:text-zinc-400 transition-all"
              required
            />
          </div>

          {/* URL or File */}
          {type === 'url' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-600">URL</label>
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={!url.trim() || isAIFilling}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded disabled:opacity-40 transition-colors"
                >
                  <Sparkles size={12} className={isAIFilling ? 'animate-pulse' : ''} />
                  Auto-fill
                </button>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 text-base placeholder:text-zinc-400 transition-all"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 text-sm transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-zinc-900 file:text-white file:cursor-pointer"
                required
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-zinc-900 resize-none text-base placeholder:text-zinc-400 transition-all"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-2">Tags</label>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTags.map((tagName) => {
                const tagData = tags.find(t => t.name === tagName)
                return (
                  <span
                    key={tagName}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm transition-all"
                    style={{
                      backgroundColor: tagData?.color ? `${tagData.color}15` : '#F4F4F5',
                      color: tagData?.color || '#52525B'
                    }}
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tagName)}
                      className="hover:opacity-60 transition-opacity"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </span>
                )
              })}
              
              {/* Add Tag Button/Input */}
              {!showTagInput ? (
                <button
                  type="button"
                  onClick={() => setShowTagInput(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-white border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-all"
                >
                  <span className="text-sm">+</span>
                  Add tag
                </button>
              ) : (
                <div className="relative flex-1 min-w-[140px]">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => {
                      if (!tagInput.trim()) {
                        setShowTagInput(false)
                        setTagSuggestions([])
                      }
                    }}
                    placeholder="Type tag name..."
                    className="w-full px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-900 text-sm placeholder:text-zinc-400 transition-all"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                      {tagSuggestions.map((tag) => (
                        <button
                          key={tag._id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleSelectSuggestion(tag.name)
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors flex items-center gap-2.5 border-b border-zinc-100 last:border-0"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 text-sm text-zinc-900">{tag.name}</span>
                          {tag.usageCount > 0 && (
                            <span className="text-xs text-zinc-400">{tag.usageCount}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Popular Tags Quick Add */}
            {selectedTags.length === 0 && !showTagInput && tags.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-400">Popular tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {tags
                    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                    .slice(0, 6)
                    .map((tag) => (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => {
                          if (!selectedTags.includes(tag.name)) {
                            setSelectedTags([...selectedTags, tag.name])
                          }
                        }}
                        className="px-2 py-1 rounded-md text-xs transition-all active:scale-95"
                        style={{
                          backgroundColor: `${tag.color}10`,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-zinc-900 text-white rounded-lg disabled:opacity-50 hover:bg-zinc-800 transition-all text-sm"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
