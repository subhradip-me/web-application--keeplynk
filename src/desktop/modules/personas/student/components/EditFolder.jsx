import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import apiClient from '../../../shared/api/apiClient';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' }
];

const PRESET_ICONS = [
  '📁', '📂', '📚', '💼', '🎯', '⭐',
  '🔖', '📌', '🏷️', '📋', '🎨', '💡'
];

const EditFolder = ({ isOpen, onClose, onFolderUpdated, folder }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📁',
    isPrivate: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name || '',
        description: folder.description || '',
        color: folder.color || '#3B82F6',
        icon: folder.icon || '📁',
        isPrivate: folder.isPrivate || false
      });
    }
  }, [folder]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Folder name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.put(`/folders/${folder._id}`, formData);
      onFolderUpdated();
      handleClose();
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err.response?.data?.message || 'Failed to update folder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '📁',
      isPrivate: false
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !loading && handleClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Edit Folder</h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Folder Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter folder name"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add a description (optional)"
              rows={3}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-3 text-2xl border-2 rounded-md hover:border-blue-400 transition-colors ${
                    formData.icon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`relative p-4 rounded-md border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-zinc-800 scale-105'
                      : 'border-zinc-200 hover:border-zinc-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {formData.color === color.value && (
                    <Check className="absolute inset-0 m-auto text-white" size={20} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Preview
            </label>
            <div
              className="p-4 rounded-lg border-2 border-dashed border-zinc-300 flex items-center gap-3"
              style={{ borderColor: formData.color, backgroundColor: `${formData.color}10` }}
            >
              <span className="text-3xl">{formData.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-zinc-900">
                  {formData.name || 'Folder name'}
                </div>
                {formData.description && (
                  <div className="text-sm text-zinc-600 mt-1">
                    {formData.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivateEdit"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPrivateEdit" className="ml-2 text-sm text-zinc-700">
              Make this folder private
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-zinc-300 rounded-md text-zinc-700 hover:bg-zinc-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Updating...' : 'Update Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFolder;
