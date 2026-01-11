import React, { useState, useEffect, useRef } from 'react'
import { X, Link2, Folder, Tag } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function EditResource({ isOpen, onClose, onResourceUpdated, resource }) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [availableTags, setAvailableTags] = useState([])
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [folders, setFolders] = useState([])
  const [resourceType, setResourceType] = useState('url') // 'url' or 'document'
  const [fileInfo, setFileInfo] = useState(null)
  
  const urlInputRef = useRef(null)
  
  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder?._id || '')
    setIsFolderDropdownOpen(false)
  }

  // Populate form when resource changes
  useEffect(() => {
    if (isOpen && resource) {
      setResourceType(resource.type || 'url')
      setUrl(resource.url || '')
      setTitle(resource.title || '')
      setDescription(resource.description || '')
      setSelectedFolder(resource.folder?._id || resource.folder || '')
      setTags([]) // Clear tags first
      
      // Store file info for documents
      if (resource.type === 'document' && resource.file) {
        setFileInfo(resource.file)
      } else {
        setFileInfo(null)
      }
      
      if (urlInputRef.current && resource.type === 'url') {
        urlInputRef.current.focus()
      }
      
      fetchAvailableTags()
      fetchFolders()
    }
  }, [isOpen, resource])

  // Map tag IDs to tag names after fetching available tags
  useEffect(() => {
    if (availableTags.length > 0 && resource?.tags && resource.tags.length > 0) {
      const tagNames = resource.tags.map(tagId => {
        // Handle both string IDs and tag objects
        const tagIdStr = typeof tagId === 'string' ? tagId : tagId._id || tagId
        const tag = availableTags.find(t => t._id === tagIdStr)
        return tag ? tag.name : tagIdStr
      })
      setTags(tagNames)
    }
  }, [availableTags, resource])

  // Fetch available tags
  const fetchAvailableTags = async () => {
    try {
      const response = await apiClient.get('/tags')
      if (response.data.success) {
        setAvailableTags(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching tags:', err)
    }
  }

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await apiClient.get('/folders')
      if (response.data.success) {
        setFolders(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }

  // Update tag suggestions based on input
  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = availableTags
        .filter(tag => 
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.includes(tag.name)
        )
        .slice(0, 5)
      setTagSuggestions(filtered)
    } else {
      setTagSuggestions([])
    }
  }, [tagInput, availableTags, tags])

  const handleAddTag = async (e, tagName = null) => {
    if (e.key === 'Enter' && (tagInput.trim() || tagName)) {
      e.preventDefault()
      const newTagName = tagName || tagInput.trim()
      
      if (!tags.includes(newTagName)) {
        // Check if tag exists in database
        const existingTag = availableTags.find(t => t.name.toLowerCase() === newTagName.toLowerCase())
        
        if (!existingTag) {
          // Create new tag in database
          try {
            const response = await apiClient.post('/tags', { name: newTagName })
            if (response.data.success) {
              setAvailableTags([...availableTags, response.data.data])
            }
          } catch (err) {
            console.error('Error creating tag:', err)
          }
        }
        
        setTags([...tags, newTagName])
      }
      setTagInput('')
      setTagSuggestions([])
    }
  }

  const handleSelectSuggestion = (tagName) => {
    if (!tags.includes(tagName)) {
      setTags([...tags, tagName])
    }
    setTagInput('')
    setTagSuggestions([])
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleUpdate = async () => {
    setError(null)
    
    // Validation based on resource type
    if (resourceType === 'url') {
      if (!url.trim()) {
        setError('URL is required')
        return
      }
      
      // Validate URL format
      try {
        new URL(url.trim())
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com)')
        return
      }
    }
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    // Prepare resource data - preserve the original type
    let resourceData = {
      title: title.trim(),
    }
    
    // Add URL only for URL type resources
    if (resourceType === 'url' && url.trim()) {
      resourceData.url = url.trim()
    }
    
    // Only add optional fields if they have values
    if (description.trim()) {
      resourceData.description = description.trim()
    }
    
    if (tags.length > 0) {
      resourceData.tags = tags
    }
    
    if (selectedFolder) {
      resourceData.folderId = selectedFolder
    }

    try {
      setLoading(true)
      
      console.log('Updating resource:', resourceData)
      const response = await apiClient.put(`/resources/${resource._id}`, resourceData)
      
      if (response.data.success) {
        // Notify parent to refresh resources
        if (onResourceUpdated) {
          onResourceUpdated()
        }
        
        onClose()
      }
    } catch (err) {
      console.error('Error updating resource:', err)
      console.error('Error response:', err.response?.data)
      console.error('Request payload:', resourceData)
      
      const errorMessage = err.response?.data?.message || 'Failed to update bookmark'
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else if (err.response?.status === 400) {
        setError(`Invalid data: ${errorMessage}`)
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
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Edit Resource</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 rounded transition-colors"
            >
              <X size={18} className="text-zinc-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Resource Type Badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Type:</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                resourceType === 'url' 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {resourceType === 'url' ? (
                  <>
                    <Link2 size={12} />
                    URL
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Document
                  </>
                )}
              </span>
            </div>

            {/* URL Field (only for URL type) */}
            {resourceType === 'url' ? (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                  <Link2 size={14} />
                  URL
                </label>
                <input
                  ref={urlInputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm"
                />
              </div>
            ) : (
              /* Document Info (read-only for document type) */
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Document File
                </label>
                <div className="px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50 text-sm text-zinc-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{fileInfo?.name || 'Unknown file'}</span>
                    {fileInfo?.size && (
                      <span className="text-xs text-zinc-500">
                        ({(fileInfo.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                  {fileInfo?.mimeType && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Type: {fileInfo.mimeType}
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Note: File cannot be changed. Upload a new resource to change the file.
                </p>
              </div>
            )}

            {/* Title Field */}
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-2 block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm"
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
                placeholder="Brief description of the resource"
                rows="3"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Folder Field */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                <Folder size={14} />
                Folder <span className="text-xs text-zinc-400 font-normal">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm bg-white text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
              >
                {selectedFolder ? (
                  <span className="flex items-center gap-2 text-zinc-900">
                    <span>{folders.find(f => f._id === selectedFolder)?.icon || '📁'}</span>
                    <span>{folders.find(f => f._id === selectedFolder)?.name}</span>
                  </span>
                ) : (
                  <span className="text-zinc-400">None</span>
                )}
                <svg 
                  className={`w-4 h-4 text-zinc-400 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isFolderDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleFolderSelect(null)}
                    className={`w-full px-3 py-2.5 text-sm text-left hover:bg-zinc-50 transition-colors flex items-center gap-2 ${
                      !selectedFolder ? 'bg-zinc-100 text-zinc-900 font-medium' : 'text-zinc-700'
                    }`}
                  >
                    <span className="text-zinc-400">—</span>
                    <span>None</span>
                  </button>
                  {folders.map((folder) => (
                    <button
                      key={folder._id}
                      type="button"
                      onClick={() => handleFolderSelect(folder)}
                      className={`w-full px-3 py-2.5 text-sm text-left hover:bg-zinc-50 transition-colors flex items-center gap-2 ${
                        selectedFolder === folder._id
                          ? 'bg-zinc-100 text-zinc-900 font-medium'
                          : 'text-zinc-700'
                      }`}
                    >
                      <span 
                        className="w-6 h-6 rounded flex items-center justify-center text-sm"
                        style={{ backgroundColor: folder.color + '20', color: folder.color }}
                      >
                        {folder.icon || '📁'}
                      </span>
                      <span className="flex-1">{folder.name}</span>
                      {folder.bookmarkCount > 0 && (
                        <span className="text-xs text-zinc-400">{folder.bookmarkCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Field */}
            <div className="relative">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 mb-2">
                <Tag size={14} />
                Tags <span className="text-xs text-zinc-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => {
                  const tagData = availableTags.find(t => t.name === tag)
                  const bgColor = tagData?.color ? `${tagData.color}33` : '#DBEAFE'
                  const textColor = tagData?.color || '#2563EB'
                  return (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: bgColor,
                        color: textColor
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-70 rounded p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={availableTags.length > 0 ? `Try: ${availableTags.slice(0, 3).map(t => t.name).join(', ')}...` : 'Type and press Enter to add tags'}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-transparent text-sm"
              />
              
              {/* Tag Suggestions Dropdown */}
              {tagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => handleSelectSuggestion(tag.name)}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                      <span className="ml-auto text-xs text-zinc-400">
                        {tag.usageCount || 0} uses
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
              onClick={handleUpdate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Resource'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
