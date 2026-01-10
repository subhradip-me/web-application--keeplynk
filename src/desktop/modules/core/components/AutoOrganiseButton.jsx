import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../../shared/api/apiClient';

/**
 * Auto Organise Button Component
 * User-triggered bulk AI workflow
 * 
 * When clicked:
 * 1. Shows preview of how many resources will be organized
 * 2. User confirms
 * 3. Triggers bulk AI enrichment
 * 4. Shows feedback
 */
export default function AutoOrganiseButton({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);

  // Handle ESC key to close modal
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showModal && !loading) {
        setShowModal(false);
        setPreview(null);
        setResult(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal, loading]);

  /**
   * Get preview of unorganised resources
   */
  const getPreview = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/organise/preview');
      
      if (response.data.success) {
        setPreview(response.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to get preview:', error);
      const errorMsg = error.response?.status === 401 
        ? 'Please log in to use Auto Organise.'
        : error.response?.data?.message || 'Failed to load preview. Please try again.';
      setResult({
        status: 'error',
        message: errorMsg
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger auto-organise
   */
  const startOrganise = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await apiClient.post('/organise/auto');
      
      if (response.data.success) {
        setResult({
          status: 'success',
          message: `Started organizing ${preview?.count || 0} resources. This will take a few minutes. Refresh the page to see updated resources.`
        });
        
        // Close modal after 4 seconds and refresh parent
        setTimeout(() => {
          setShowModal(false);
          setPreview(null);
          setResult(null);
          if (onComplete) onComplete();
        }, 4000);
      }
    } catch (error) {
      console.error('Failed to start organise:', error);
      const errorMsg = error.response?.status === 401
        ? 'Session expired. Please log in again.'
        : error.response?.data?.message || 'Failed to start auto-organise. Please try again.';
      setResult({
        status: 'error',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={getPreview}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-gradient-to-br from-amber-200/50 via-amber-100/50 to-yellow-100/50 text-amber-800 font-medium hover:from-amber-300/50 hover:via-amber-200/50 hover:to-yellow-200/50 rounded-lg transition-all duration-200 border border-amber-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            <span>Organize with AI</span>
          </>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowModal(false);
              setPreview(null);
              setResult(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Auto Organise</h3>
                <p className="text-sm text-gray-500">AI-powered resource organization</p>
              </div>
            </div>

            {/* Content */}
            {result ? (
              <div className={`p-4 rounded-lg ${
                result.status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
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
                <div className="space-y-2">
                  {preview?.count === 0 ? (
                    <>
                      <div className="text-center py-4">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium">All resources are organized!</p>
                        <p className="text-sm text-gray-500 mt-2">
                          No unorganized resources found. Great work!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700">
                        Found <span className="font-semibold text-violet-600">{preview?.count}</span> unorganised {preview?.count === 1 ? 'resource' : 'resources'}.
                      </p>
                      <p className="text-sm text-gray-600">
                        AI will analyze each resource and add:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Smart titles (if missing)</li>
                        <li>• Descriptive summaries</li>
                        <li>• Relevant tags</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-3">
                        This may take a few minutes. You can continue working while AI organizes your resources.
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {preview?.count === 0 ? (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setPreview(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={startOrganise}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setPreview(null);
                        }}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
