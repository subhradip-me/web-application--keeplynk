import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import apiClient from '../../../shared/api/apiClient'

export default function AutoOrganiseButton({ onComplete }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [result, setResult] = useState(null)

  const getPreview = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/organise/preview')
      
      if (response.data.success) {
        setPreview(response.data)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Failed to get preview:', error)
      const errorMsg = error.response?.status === 401 
        ? 'Please log in to use Auto Organise.'
        : error.response?.data?.message || 'Failed to load preview. Please try again.'
      setResult({
        status: 'error',
        message: errorMsg
      })
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const startOrganise = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      const response = await apiClient.post('/organise/auto')
      
      if (response.data.success) {
        setResult({
          status: 'success',
          message: `Started organizing ${preview?.count || 0} resources. This will take a few minutes.`
        })
        
        setTimeout(() => {
          setShowModal(false)
          setPreview(null)
          setResult(null)
          if (onComplete) onComplete()
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to start organise:', error)
      const errorMsg = error.response?.status === 401
        ? 'Session expired. Please log in again.'
        : error.response?.data?.message || 'Failed to start auto-organise. Please try again.'
      setResult({
        status: 'error',
        message: errorMsg
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={getPreview}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-br from-amber-200/40 via-amber-100/40 to-yellow-100/40 text-amber-800 font-semibold hover:from-amber-300/50 hover:via-amber-200/50 hover:to-yellow-200/50 rounded-lg transition-all duration-200 border border-amber-300/40 disabled:opacity-50 active:scale-95"
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Organize with AI</span>
          </>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowModal(false)
              setPreview(null)
              setResult(null)
            }
          }}
        >
          <div className="bg-white w-full rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 bg-zinc-300 rounded-full"></div>
            </div>

            <div className="px-5 pb-6 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-600" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Auto Organise</h3>
                  <p className="text-xs text-zinc-500">AI-powered organization</p>
                </div>
              </div>

              {/* Content */}
              {result ? (
                <div className={`p-4 rounded-xl ${
                  result.status === 'success' 
                    ? 'bg-green-50' 
                    : 'bg-red-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={2} />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" strokeWidth={2} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        result.status === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.status === 'success' ? 'Success!' : 'Error'}
                      </p>
                      <p className={`text-sm mt-1 ${
                        result.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {preview?.count === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-semibold text-zinc-900">All resources are organized!</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          No unorganized resources found.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-zinc-900">
                          Found <span className="font-semibold text-amber-600">{preview?.count}</span> unorganized {preview?.count === 1 ? 'resource' : 'resources'}.
                        </p>
                        <p className="text-sm text-zinc-600">
                          AI will analyze and add:
                        </p>
                        <ul className="text-sm text-zinc-600 space-y-1.5 ml-4">
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            Smart descriptions
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            Relevant tags
                          </li>
                        </ul>
                        <p className="text-xs text-zinc-500 mt-3 bg-zinc-50 p-3 rounded-lg">
                          This may take a few minutes. Pull down to refresh and see updates.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {preview?.count === 0 ? (
                      <button
                        onClick={() => {
                          setShowModal(false)
                          setPreview(null)
                        }}
                        className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors text-sm font-medium"
                      >
                        Close
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setShowModal(false)
                            setPreview(null)
                          }}
                          disabled={loading}
                          className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={startOrganise}
                          disabled={loading}
                          className="flex-1 py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Starting...</span>
                            </>
                          ) : (
                            <span>Start Organizing</span>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
