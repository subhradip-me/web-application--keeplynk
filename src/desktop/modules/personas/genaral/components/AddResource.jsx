import React, { useState, useRef, useEffect } from 'react'
import { X, Link2, Tag, Folder, Sparkles } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function AddResource({ isOpen, onClose, onResourceCreated, defaultFolder }) {
  const [resourceType, setResourceType] = useState('url') // 'url' or 'document'
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder || '')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [availableTags, setAvailableTags] = useState([])
  const [tagSuggestions, setTagSuggestions] = useState([])
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [folders, setFolders] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  
  const urlInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isFetchingMeta, setIsFetchingMeta] = useState(false)
  const [isAIFilling, setIsAIFilling] = useState(false)
  const [aiSuccess, setAiSuccess] = useState(false)

  // Simple URL change handler
  const handleUrlChange = (e) => {
    setUrl(e.target.value)
  }

  const handleAIFill = async () => {
    if (!url.trim() && resourceType === 'url') {
      setError('Please enter a URL first')
      return
    }
    
    if (!selectedFile && resourceType === 'document') {
      setError('Please select a file first')
      return
    }

    try {
      setIsAIFilling(true)
      setError(null)
      
      if (resourceType === 'url') {
        // Call AI agent endpoint to extract metadata
        try {
          const response = await apiClient.post('/organise/extract-metadata', {
            url: url.trim()
          })
          
          console.log('AI Response received:', response.data)
          console.log('Metadata extracted:', response.data.data)
          
          if (response.data.success) {
            const metadata = response.data.data
            
            if (!metadata) {
              console.error('Metadata is null/undefined')
              throw new Error('No metadata returned from AI')
            }
            
            console.log('Filling form with metadata:', {
              title: metadata.title,
              description: metadata.description,
              tags: metadata.tags,
              category: metadata.category,
              currentTitle: title,
              currentDescription: description,
              currentTags: tags
            })
            
            let fieldsUpdated = 0
            
            // Fill title if empty and metadata has one (from HTML or AI)
            if (metadata.title && !title) {
              console.log('Setting title to:', metadata.title)
              setTitle(metadata.title)
              fieldsUpdated++
            } else {
              console.log('Skipping title:', metadata.title ? 'already has title' : 'no title from AI')
            }
            
            // Fill description if not already filled (AI-generated)
            if (metadata.description && !description) {
              console.log('Setting description to:', metadata.description)
              setDescription(metadata.description)
              fieldsUpdated++
            } else {
              console.log('Skipping description:', metadata.description ? 'already has description' : 'no description from AI')
            }
            
            // Add suggested tags (AI-generated)
            if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
              console.log('Processing tags:', metadata.tags)
              const newTags = metadata.tags.filter(tag => !tags.includes(tag))
              if (newTags.length > 0) {
                console.log('Adding new tags:', newTags)
                setTags([...tags, ...newTags])
                fieldsUpdated++
              } else {
                console.log('All tags already exist')
              }
            } else {
              console.log('No tags from AI')
            }
            
            // Suggest folder based on category
            if (metadata.category && folders.length > 0) {
              const suggestedFolder = folders.find(f => 
                f.name.toLowerCase().includes(metadata.category.toLowerCase()) ||
                metadata.category.toLowerCase().includes(f.name.toLowerCase())
              )
              if (suggestedFolder && !selectedFolder) {
                setSelectedFolder(suggestedFolder._id)
                fieldsUpdated++
              }
            }

            if (fieldsUpdated === 0) {
              console.warn('No fields were updated. Check if fields already have values or if AI returned empty data.')
              setError('AI returned no useful data. Try a different URL or manually fill the form.')
            } else {
              // Show success indicator
              setAiSuccess(true)
              setTimeout(() => setAiSuccess(false), 2000)
            }
          } else {
            throw new Error('AI response indicated failure')
          }
        } catch (aiError) {
          // AI endpoint failed - show error to user
          console.error('AI extraction failed:', aiError)
          throw aiError
        }
      } else if (resourceType === 'document' && selectedFile) {
        // For documents, extract metadata from file
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        try {
          const response = await apiClient.post('/organise/extract-document-metadata', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          
          if (response.data.success) {
            const metadata = response.data.data
            
            // Don't override title - keep original filename as title
            // Only fill description and tags from AI
            
            // Fill description if extracted (AI-generated)
            if (metadata.description && !description) {
              setDescription(metadata.description)
            }
            
            // Add suggested tags (AI-generated)
            if (metadata.tags && Array.isArray(metadata.tags)) {
              const newTags = metadata.tags.filter(tag => !tags.includes(tag))
              if (newTags.length > 0) {
                setTags([...tags, ...newTags])
              }
            }
            
            // Suggest folder based on document type
            if (metadata.category && folders.length > 0) {
              const suggestedFolder = folders.find(f => 
                f.name.toLowerCase().includes(metadata.category.toLowerCase()) ||
                metadata.category.toLowerCase().includes(f.name.toLowerCase())
              )
              if (suggestedFolder && !selectedFolder) {
                setSelectedFolder(suggestedFolder._id)
              }
            }

            // Show success indicator
            setAiSuccess(true)
            setTimeout(() => setAiSuccess(false), 2000)
          }
        } catch (docError) {
          console.log('AI document extraction unavailable:', docError.message)
          // Fallback: just use filename for title (already done in handleFileSelect)
        }
      }
    } catch (err) {
      console.error('AI fill error:', err)
      setError('Could not auto-fill content. Please fill manually.')
    } finally {
      setIsAIFilling(false)
    }
  }
  
  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder?._id || '')
    setIsFolderDropdownOpen(false)
  }

  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      urlInputRef.current.focus()
      fetchAvailableTags()
      fetchFolders()
      setSelectedFolder(defaultFolder || '')
      // Reset form when opening
      setResourceType('url')
      setUrl('')
      setTitle('')
      setDescription('')
      setTags([])
      setSelectedFile(null)
      setError(null)
    }
  }, [isOpen, defaultFolder])

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
        const result = response.data.data
        if (result.folders) {
          setFolders(result.folders)
        } else {
          // Fallback for old API response format
          setFolders(response.data.data)
        }
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
            const response = await apiClient.post('/tags', {
              name: newTagName,
              color: '#3B82F6' // Default blue color
            })
            if (response.data.success) {
              setAvailableTags([...availableTags, response.data.data])
            }
          } catch (err) {
            console.error('Error creating tag:', err)
            // Continue anyway, just add to local list
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please upload PDF, DOCX, XLSX, PPTX, TXT, or images.')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
      // Auto-fill title from filename if empty
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSave = async () => {
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
    } else {
      // Document validation
      if (!selectedFile) {
        setError('Please select a file to upload')
        return
      }
    }
    
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setLoading(true)
      
      let response
      
      if (resourceType === 'url') {
        // Prepare URL resource data
        let resourceData = {
          type: 'url',
          url: url.trim(),
          title: title.trim(),
        }
        
        if (description.trim()) {
          resourceData.description = description.trim()
        }
        
        if (tags.length > 0) {
          resourceData.tags = tags
        }
        
        if (selectedFolder) {
          resourceData.folderId = selectedFolder
        }
        
        resourceData.isFavorite = false

        console.log('Sending URL resource data:', resourceData)
        response = await apiClient.post('/resources', resourceData)
      } else {
        // Prepare document upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('type', 'document')
        formData.append('title', title.trim())
        
        if (description.trim()) {
          formData.append('description', description.trim())
        }
        
        if (tags.length > 0) {
          formData.append('tags', JSON.stringify(tags))
        }
        
        if (selectedFolder) {
          formData.append('folderId', selectedFolder)
        }
        
        formData.append('isFavorite', 'false')

        console.log('Uploading document...')
        response = await apiClient.post('/resources/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }
      
      if (response.data.success) {
        // Reset form
        setResourceType('url')
        setUrl('')
        setTitle('')
        setDescription('')
        setSelectedFolder('')
        setTags([])
        setTagInput('')
        setSelectedFile(null)
        
        // Notify parent to refresh resources
        if (onResourceCreated) {
          onResourceCreated()
        }
        
        onClose()
      }
    } catch (err) {
      console.error('Error creating resource:', err)
      console.error('Error response:', err.response?.data)
      
      const errorMessage = err.response?.data?.message || 'Failed to create resource'
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
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg border border-zinc-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <h2 className="text-sm text-zinc-900">Add Resource</h2>
              {isAIFilling && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI is analyzing...</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-zinc-100 rounded transition-colors"
            >
              <X size={16} className="text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Resource Type Selector */}
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">
                Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResourceType('url')
                    setSelectedFile(null)
                    setError(null)
                  }}
                  className={`flex-1 px-3 py-2 rounded-md border transition-colors ${
                    resourceType === 'url'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Link2 size={14} />
                    <span className="text-sm">URL</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResourceType('document')
                    setUrl('')
                    setError(null)
                  }}
                  className={`flex-1 px-3 py-2 rounded-md border transition-colors ${
                    resourceType === 'document'
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Document</span>
                  </div>
                </button>
              </div>
            </div>

            {/* URL Field - only show when type is URL */}
            {resourceType === 'url' && (
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                  <Link2 size={12} />
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="Paste link here..."
                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm placeholder:text-zinc-400"
                    disabled={isFetchingMeta}
                  />
                  <button
                    type="button"
                    onClick={handleAIFill}
                    disabled={!url.trim() || isAIFilling}
                    className={`px-3 py-2 border rounded-md transition-colors flex items-center gap-1.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                      isAIFilling
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                    title="Auto-fill with AI"
                  >
                    <Sparkles size={14} className={isAIFilling ? 'animate-pulse' : ''} />
                    {isAIFilling ? 'Filling...' : 'Fill'}
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Field - only show when type is Document */}
            {resourceType === 'document' && (
              <div>
                <label className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  File
                </label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-5 border border-dashed border-zinc-200 rounded-md hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {selectedFile ? (
                        <>
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm">
                            <span className="font-medium text-zinc-900">{selectedFile.name}</span>
                            <span className="text-zinc-500 ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFile(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="text-sm text-zinc-600">
                            <span className="font-medium text-zinc-900">Click to upload</span> or drag and drop
                          </div>
                          <div className="text-xs text-zinc-500">
                            PDF, DOCX, XLSX, PPTX, TXT, or images (max 10MB)
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Title Field */}
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">
                Title {isFetchingMeta && <span className="text-xs text-blue-600 ml-2">Fetching...</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm placeholder:text-zinc-400"
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">
                Description <span className="text-zinc-400">(optional)</span>
                {isAIFilling && (
                  <span className="ml-2 text-xs text-blue-600 animate-pulse">
                    Generating...
                  </span>
                )}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isAIFilling ? "AI is generating description..." : "Add a description..."}
                rows="2"
                className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm resize-none placeholder:text-zinc-400"
              />
            </div>

            {/* Folder Field */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <Folder size={12} />
                Folder <span className="text-zinc-400">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm bg-white text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handleFolderSelect(null)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 transition-colors flex items-center gap-2 ${
                      !selectedFolder ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-700'
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
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 transition-colors flex items-center gap-2 ${
                        selectedFolder === folder._id
                          ? 'bg-zinc-100 text-zinc-900'
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
                      {folder.resourceCount !== undefined && folder.resourceCount > 0 && (
                        <span className="text-xs text-zinc-400">{folder.resourceCount}</span>
                      )}
                      {folder.bookmarkCount !== undefined && folder.bookmarkCount > 0 && (
                        <span className="text-xs text-zinc-400">{folder.bookmarkCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Field */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                <Tag size={12} />
                Tags <span className="text-zinc-400">(optional)</span>
                {isAIFilling && (
                  <span className="ml-2 text-xs text-blue-600 animate-pulse">
                    Generating...
                  </span>
                )}
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
                placeholder={isAIFilling ? "AI is generating tags..." : (availableTags.length > 0 ? `Try: ${availableTags.slice(0, 3).map(t => t.name).join(', ')}...` : 'Type and press Enter...')}
                className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 text-sm placeholder:text-zinc-400"
              />
              
              {/* Tag Suggestions Dropdown */}
              {tagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg overflow-hidden">
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
            <div className="px-5 pb-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-2.5 text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Success Message */}
          {aiSuccess && (
            <div className="px-5 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-2.5 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI filled the form successfully!
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-200 bg-white">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-zinc-900 text-white hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
