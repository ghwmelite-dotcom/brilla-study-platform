import { useState, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  Video,
  Headphones,
  File,
  Gamepad2,
  ExternalLink,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useLibraryStore } from '@/stores/libraryStore';
import type { ResourceType } from '@/types';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const resourceTypes: { value: ResourceType; label: string; icon: React.ElementType; accept: string }[] = [
  { value: 'pdf', label: 'PDF Document', icon: FileText, accept: '.pdf' },
  { value: 'video', label: 'Video', icon: Video, accept: 'video/*' },
  { value: 'audio', label: 'Audio', icon: Headphones, accept: 'audio/*' },
  { value: 'document', label: 'Document', icon: File, accept: '.doc,.docx,.txt,.rtf' },
  { value: 'interactive', label: 'Interactive', icon: Gamepad2, accept: '.html,.zip' },
  { value: 'link', label: 'External Link', icon: ExternalLink, accept: '' },
];

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

export function UploadResourceModal({ isOpen, onClose, onSuccess }: UploadResourceModalProps) {
  const { uploadResource, isUploadingResource } = useLibraryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'type' | 'details' | 'uploading' | 'success' | 'error'>(
    'type'
  );
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<'jhs' | 'shs' | 'both'>('both');
  const [accessLevel, setAccessLevel] = useState<'free' | 'basic' | 'premium'>('free');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDownloadable, setIsDownloadable] = useState(true);

  const [isDragging, setIsDragging] = useState(false);

  const resetForm = () => {
    setStep('type');
    setSelectedType(null);
    setFile(null);
    setThumbnail(null);
    setThumbnailPreview(null);
    setExternalUrl('');
    setTitle('');
    setDescription('');
    setSubjectId('');
    setSchoolLevel('both');
    setAccessLevel('free');
    setTags('');
    setIsFeatured(false);
    setIsDownloadable(true);
    setUploadProgress(0);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeSelect = (type: ResourceType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
    [title]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setThumbnail(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !title) {
      setError('Please fill in all required fields');
      return;
    }

    if (selectedType !== 'link' && !file) {
      setError('Please select a file to upload');
      return;
    }

    if (selectedType === 'link' && !externalUrl) {
      setError('Please enter the external URL');
      return;
    }

    setStep('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('resourceType', selectedType);
      formData.append('schoolLevel', schoolLevel);
      formData.append('accessLevel', accessLevel);
      formData.append('tags', tags);
      formData.append('isFeatured', String(isFeatured));
      formData.append('isDownloadable', String(isDownloadable));

      if (subjectId) {
        formData.append('subjectId', subjectId);
      }

      if (selectedType === 'link') {
        formData.append('contentUrl', externalUrl);
      } else if (file) {
        formData.append('file', file);
      }

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      // Simulate progress for now
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await uploadResource(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setStep('success');

      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  const typeConfig = selectedType ? resourceTypes.find((t) => t.value === selectedType) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Upload Resource</h2>
            <p className="text-sm text-neutral-500">Add new content to the library</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Step 1: Select Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-900">What type of resource is this?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resourceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleTypeSelect(type.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20'
                      )}
                    >
                      <Icon className="w-8 h-8 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-900">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Details Form */}
          {step === 'details' && selectedType && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep('type')}
                className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
              >
                ← Change type
              </button>

              {/* File Upload or URL */}
              {selectedType === 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    External URL *
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://example.com/resource"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : file
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium text-neutral-900">{file.name}</p>
                        <p className="text-sm text-neutral-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="ml-4 text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-600 mb-2">
                        Drag and drop your file here, or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:text-primary-dark font-medium"
                        >
                          browse
                        </button>
                      </p>
                      <p className="text-sm text-neutral-400">
                        {typeConfig?.accept || 'All file types supported'}
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={typeConfig?.accept}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

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

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Thumbnail (optional)
                </label>
                <div className="flex items-start gap-4">
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail(null);
                          setThumbnailPreview(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-32 h-20 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center hover:border-neutral-300 transition-colors"
                    >
                      <Image className="w-6 h-6 text-neutral-400" />
                      <span className="text-xs text-neutral-500 mt-1">Add image</span>
                    </button>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                </div>
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

              {/* Downloadable Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="downloadable"
                  checked={isDownloadable}
                  onChange={(e) => setIsDownloadable(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                />
                <label htmlFor="downloadable" className="text-sm text-neutral-700">
                  Allow users to download this resource
                </label>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
                />
                <label htmlFor="featured" className="text-sm text-neutral-700">
                  Mark as featured resource
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploadingResource}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resource
                </Button>
              </div>
            </form>
          )}

          {/* Uploading State */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Uploading...</h3>
              <p className="text-neutral-500 mb-6">Please wait while we upload your resource</p>
              <div className="w-full max-w-xs mx-auto h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-neutral-500 mt-2">{uploadProgress}%</p>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Upload Successful!</h3>
              <p className="text-neutral-500">Your resource has been added to the library</p>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Upload Failed</h3>
              <p className="text-neutral-500 mb-6">{error}</p>
              <Button onClick={() => setStep('details')}>Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
