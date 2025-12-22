// E-Library Type Definitions

export type ResourceType = 'pdf' | 'video' | 'audio' | 'document' | 'interactive' | 'link';
export type AccessLevel = 'free' | 'basic' | 'premium';
export type SchoolLevel = 'jhs' | 'shs' | 'both';

// Core Library Resource
export interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  resourceType: ResourceType;
  contentUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  duration?: number; // in seconds for video/audio
  subjectId?: string;
  topicId?: string;
  schoolLevel?: SchoolLevel;
  accessLevel: AccessLevel;
  tags?: string[];
  uploadedBy: string;
  isFeatured: boolean;
  isActive: boolean;
  isDownloadable: boolean; // Whether users can download this resource
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  // Computed/joined fields
  subject?: { id: string; name: string; color?: string };
  topic?: { id: string; name: string };
  uploader?: { id: string; name: string };
  rating?: number;
  ratingCount?: number;
  userProgress?: number;
  isBookmarked?: boolean;
  userRating?: { rating: number; review?: string };
}

// User Collection (Bookmarks/Playlists)
export interface LibraryCollection {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
  // Computed
  resourceCount?: number;
  resources?: LibraryResource[];
  owner?: { id: string; name: string };
}

// Collection Item (junction)
export interface LibraryCollectionItem {
  id: string;
  collectionId: string;
  resourceId: string;
  displayOrder: number;
  addedAt: string;
  resource?: LibraryResource;
}

// Resource Rating
export interface LibraryRating {
  id: string;
  resourceId: string;
  userId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: string;
  user?: { id: string; name: string };
}

// Access Log (for analytics)
export interface LibraryAccessLog {
  id: string;
  resourceId: string;
  userId: string;
  action: 'view' | 'download' | 'complete';
  progress: number;
  accessedAt: string;
}

// Reading/Viewing Progress
export interface LibraryProgress {
  id: string;
  resourceId: string;
  userId: string;
  progressPercent: number;
  lastPosition?: string; // e.g., "page:5" or "time:120"
  completed: boolean;
  updatedAt: string;
}

// Filter options for library search
export interface LibraryFilters {
  search?: string;
  resourceType?: ResourceType | 'all';
  subjectId?: string;
  topicId?: string;
  schoolLevel?: SchoolLevel | 'all';
  accessLevel?: AccessLevel | 'all';
  sortBy?: 'newest' | 'oldest' | 'popular' | 'rating' | 'title';
  tags?: string[];
  featured?: boolean;
}

// Pagination info
export interface LibraryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// API Response types
export interface LibraryResourcesResponse {
  resources: LibraryResource[];
  pagination: LibraryPagination;
}

export interface LibraryResourceResponse {
  resource: LibraryResource;
  relatedResources?: LibraryResource[];
  userProgress?: LibraryProgress;
  userRating?: LibraryRating;
}

// Upload request
export interface LibraryUploadRequest {
  title: string;
  description?: string;
  resourceType: ResourceType;
  file?: File;
  url?: string; // For link type
  subjectId?: string;
  topicId?: string;
  schoolLevel?: SchoolLevel;
  accessLevel?: AccessLevel;
  tags?: string[];
  isFeatured?: boolean;
  isDownloadable?: boolean;
}

// Resource type metadata
export interface ResourceTypeInfo {
  type: ResourceType;
  label: string;
  icon: string;
  color: string;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
}

export const RESOURCE_TYPE_INFO: Record<ResourceType, ResourceTypeInfo> = {
  pdf: {
    type: 'pdf',
    label: 'PDF Document',
    icon: 'FileText',
    color: '#EF4444',
    acceptedFormats: ['.pdf'],
    maxSize: 50,
  },
  video: {
    type: 'video',
    label: 'Video',
    icon: 'Video',
    color: '#8B5CF6',
    acceptedFormats: ['.mp4', '.webm', '.mov'],
    maxSize: 500,
  },
  audio: {
    type: 'audio',
    label: 'Audio',
    icon: 'Headphones',
    color: '#22C55E',
    acceptedFormats: ['.mp3', '.wav', '.m4a'],
    maxSize: 100,
  },
  document: {
    type: 'document',
    label: 'Document',
    icon: 'File',
    color: '#3B82F6',
    acceptedFormats: ['.doc', '.docx', '.txt', '.rtf'],
    maxSize: 20,
  },
  interactive: {
    type: 'interactive',
    label: 'Interactive',
    icon: 'Gamepad2',
    color: '#F59E0B',
    acceptedFormats: ['.html', '.zip'],
    maxSize: 50,
  },
  link: {
    type: 'link',
    label: 'External Link',
    icon: 'ExternalLink',
    color: '#6B7280',
  },
};
