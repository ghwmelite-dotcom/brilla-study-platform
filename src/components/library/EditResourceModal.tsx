import { useState, useEffect } from 'react';
import {
  X,
  Save,
  FileText,
  Video,
  Headphones,
  File,
  Gamepad2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/common';
import { useLibraryStore } from '@/stores/libraryStore';
import type { LibraryResource, ResourceType } from '@/types';

interface EditResourceModalProps {
  resource: LibraryResource | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const resourceTypeIcons: Record<ResourceType, React.ElementType> = {
  pdf: FileText,
  video: Video,
  audio: Headphones,
  document: File,
  interactive: Gamepad2,
  link: ExternalLink,
};

const resourceTypeLabels: Record<ResourceType, string> = {
  pdf: 'PDF Document',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
  interactive: 'Interactive',
  link: 'External Link',
};

const schoolLevels = [
  { value: 'jhs', label: 'JHS' },
  { value: 'shs', label: 'SHS' },
  { value: 'both', label: 'Both' },
];

const accessLevels = [
  { value: 'free', label: 'Free', description: 'Available to everyone' },
  { value: 'basic', label: 'Basic', description: 'Requires basic subscription' },
  { value: 'premium', label: 'Premium', description: 'Premium subscribers only' },
];

export function EditResourceModal({ resource, isOpen, onClose, onSuccess }: EditResourceModalProps) {
  const { updateResource } = useLibraryStore();

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<'jhs' | 'shs' | 'both'>('both');
  const [accessLevel, setAccessLevel] = useState<'free' | 'basic' | 'premium'>('free');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(true);

  // Initialize form when resource changes
  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '');
      setDescription(resource.description || '');
      setSchoolLevel(resource.schoolLevel || 'both');
      setAccessLevel(resource.accessLevel || 'free');
      setTags(resource.tags?.join(', ') || '');
      setIsFeatured(resource.isFeatured || false);
      setIsDownloadable(resource.isDownloadable !== false);
      setStatus('idle');
      setError(null);
    }
  }, [resource]);

  const handleClose = () => {
    setStatus('idle');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resource || !title.trim()) {
      setError('Title is required');
      return;
    }

    setStatus('saving');
    setIsSaving(true);
    setError(null);

    try {
      await updateResource(resource.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        schoolLevel,
        accessLevel,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        isFeatured,
        isDownloadable,
      });

      setStatus('success');

      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !resource) return null;

  const TypeIcon = resourceTypeIcons[resource.resourceType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TypeIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Edit Resource</h2>
              <p className="text-sm text-neutral-500">{resourceTypeLabels[resource.resourceType]}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Changes Saved!</h3>
              <p className="text-neutral-500">Your resource has been updated</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter resource title"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the resource"
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* School Level & Access */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    School Level
                  </label>
                  <select
                    value={schoolLevel}
                    onChange={(e) => setSchoolLevel(e.target.value as 'jhs' | 'shs' | 'both')}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {schoolLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Access Level
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) =>
                      setAccessLevel(e.target.value as 'free' | 'basic' | 'premium')
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {accessLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="mathematics, algebra, equations"
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                {/* Downloadable Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit-downloadable"
                    checked={isDownloadable}
                    onChange={(e) => setIsDownloadable(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                  />
                  <label htmlFor="edit-downloadable" className="text-sm text-neutral-700">
                    Allow users to download this resource
                  </label>
                </div>

                {/* Featured Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                  />
                  <label htmlFor="edit-featured" className="text-sm text-neutral-700">
                    Mark as featured resource
                  </label>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
