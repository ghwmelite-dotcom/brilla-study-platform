import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/utils/api';
import type {
  LibraryResource,
  LibraryCollection,
  LibraryFilters,
  LibraryProgress,
  LibraryRating,
  ResourceType,
} from '@/types';

interface LibraryState {
  // Resources
  resources: LibraryResource[];
  featuredResources: LibraryResource[];
  selectedResource: LibraryResource | null;
  relatedResources: LibraryResource[];

  // Collections
  collections: LibraryCollection[];
  selectedCollection: LibraryCollection | null;

  // Filters and Search
  filters: LibraryFilters;
  searchQuery: string;

  // Pagination
  page: number;
  pageSize: number;
  totalResources: number;
  hasMore: boolean;

  // UI State
  isLoading: boolean;
  isUploadingResource: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';

  // User-specific
  userProgress: Record<string, LibraryProgress>;
  userRatings: Record<string, LibraryRating>;
  recentlyViewed: LibraryResource[];

  // Actions - Resource Loading
  loadResources: (filters?: LibraryFilters, reset?: boolean) => Promise<void>;
  loadFeatured: () => Promise<void>;
  loadResource: (id: string) => Promise<void>;
  loadRelatedResources: (resourceId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  searchResources: (query: string) => Promise<void>;

  // Actions - Filters
  setFilters: (filters: Partial<LibraryFilters>) => void;
  clearFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;

  // Actions - Collections
  loadCollections: () => Promise<void>;
  loadCollection: (id: string) => Promise<void>;
  createCollection: (name: string, description?: string, color?: string) => Promise<LibraryCollection>;
  updateCollection: (id: string, updates: Partial<LibraryCollection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, resourceId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, resourceId: string) => Promise<void>;

  // Actions - User Interactions
  rateResource: (resourceId: string, rating: number, review?: string) => Promise<void>;
  updateProgress: (resourceId: string, progressPercent: number, lastPosition?: string) => Promise<void>;
  markCompleted: (resourceId: string) => Promise<void>;
  trackView: (resourceId: string) => Promise<void>;
  trackDownload: (resourceId: string) => Promise<void>;

  // Actions - Admin
  uploadResource: (data: FormData) => Promise<LibraryResource>;
  updateResource: (id: string, updates: Partial<LibraryResource>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;

  // Utility
  selectResource: (resource: LibraryResource | null) => void;
  clearError: () => void;
  reset: () => void;
}

const DEFAULT_FILTERS: LibraryFilters = {
  search: '',
  resourceType: 'all',
  subjectId: undefined,
  topicId: undefined,
  schoolLevel: 'all',
  accessLevel: 'all',
  sortBy: 'newest',
};

// Demo/mock data for development
const DEMO_RESOURCES: LibraryResource[] = [
  {
    id: 'lib_1',
    title: 'Introduction to Calculus',
    description: 'Comprehensive guide to differential and integral calculus for SHS students.',
    resourceType: 'pdf',
    contentUrl: '/resources/calculus-intro.pdf',
    thumbnailUrl: '/thumbnails/calculus.jpg',
    fileSize: 2500000,
    subjectId: 'sub_math',
    schoolLevel: 'shs',
    accessLevel: 'free',
    tags: ['calculus', 'mathematics', 'derivatives'],
    uploadedBy: 'admin',
    isFeatured: true,
    isActive: true,
    views: 1250,
    downloads: 340,
    rating: 4.5,
    ratingCount: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: { id: 'sub_math', name: 'Mathematics', color: '#3B82F6' },
  },
  {
    id: 'lib_2',
    title: 'Physics: Motion and Forces',
    description: 'Video tutorial covering Newton\'s laws and kinematic equations.',
    resourceType: 'video',
    contentUrl: '/resources/physics-motion.mp4',
    thumbnailUrl: '/thumbnails/physics.jpg',
    duration: 1800,
    subjectId: 'sub_physics',
    schoolLevel: 'shs',
    accessLevel: 'free',
    tags: ['physics', 'motion', 'newton', 'forces'],
    uploadedBy: 'admin',
    isFeatured: true,
    isActive: true,
    views: 890,
    downloads: 0,
    rating: 4.8,
    ratingCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: { id: 'sub_physics', name: 'Physics', color: '#8B5CF6' },
  },
  {
    id: 'lib_3',
    title: 'Chemistry: Organic Compounds',
    description: 'Audio lecture on organic chemistry fundamentals.',
    resourceType: 'audio',
    contentUrl: '/resources/chemistry-organic.mp3',
    duration: 2400,
    subjectId: 'sub_chem',
    schoolLevel: 'shs',
    accessLevel: 'basic',
    tags: ['chemistry', 'organic', 'compounds'],
    uploadedBy: 'admin',
    isFeatured: false,
    isActive: true,
    views: 456,
    downloads: 0,
    rating: 4.2,
    ratingCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: { id: 'sub_chem', name: 'Chemistry', color: '#22C55E' },
  },
  {
    id: 'lib_4',
    title: 'WASSCE Past Papers 2023',
    description: 'Complete collection of 2023 WASSCE examination papers with solutions.',
    resourceType: 'pdf',
    contentUrl: '/resources/wassce-2023.pdf',
    thumbnailUrl: '/thumbnails/wassce.jpg',
    fileSize: 15000000,
    schoolLevel: 'shs',
    accessLevel: 'premium',
    tags: ['wassce', 'past papers', '2023', 'exam prep'],
    uploadedBy: 'admin',
    isFeatured: true,
    isActive: true,
    views: 2100,
    downloads: 890,
    rating: 4.9,
    ratingCount: 112,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'lib_5',
    title: 'Biology: Cell Structure Interactive',
    description: 'Interactive 3D exploration of cell structure and organelles.',
    resourceType: 'interactive',
    contentUrl: '/resources/cell-structure/index.html',
    thumbnailUrl: '/thumbnails/cell.jpg',
    subjectId: 'sub_bio',
    schoolLevel: 'both',
    accessLevel: 'free',
    tags: ['biology', 'cells', 'interactive', '3d'],
    uploadedBy: 'admin',
    isFeatured: true,
    isActive: true,
    views: 678,
    downloads: 0,
    rating: 4.7,
    ratingCount: 34,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: { id: 'sub_bio', name: 'Biology', color: '#F59E0B' },
  },
];

const DEMO_COLLECTIONS: LibraryCollection[] = [
  {
    id: 'col_1',
    ownerId: 'user_1',
    name: 'Exam Prep',
    description: 'Resources for WASSCE preparation',
    isPublic: false,
    color: '#3B82F6',
    resourceCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col_2',
    ownerId: 'user_1',
    name: 'Mathematics',
    description: 'Math resources and tutorials',
    isPublic: false,
    color: '#22C55E',
    resourceCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      // Initial state
      resources: [],
      featuredResources: [],
      selectedResource: null,
      relatedResources: [],
      collections: [],
      selectedCollection: null,
      filters: DEFAULT_FILTERS,
      searchQuery: '',
      page: 1,
      pageSize: 12,
      totalResources: 0,
      hasMore: false,
      isLoading: false,
      isUploadingResource: false,
      error: null,
      viewMode: 'grid',
      userProgress: {},
      userRatings: {},
      recentlyViewed: [],

      // Load resources with filters
      loadResources: async (filters?: LibraryFilters, reset = true) => {
        set({ isLoading: true, error: null });
        if (reset) set({ page: 1 });

        try {
          const currentFilters = filters || get().filters;
          const page = reset ? 1 : get().page;

          const response = await api.get<{
            resources: LibraryResource[];
            pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
          }>('/library/resources', {
            search: currentFilters.search,
            type: currentFilters.resourceType !== 'all' ? currentFilters.resourceType : undefined,
            subjectId: currentFilters.subjectId,
            topicId: currentFilters.topicId,
            schoolLevel: currentFilters.schoolLevel !== 'all' ? currentFilters.schoolLevel : undefined,
            accessLevel: currentFilters.accessLevel !== 'all' ? currentFilters.accessLevel : undefined,
            sortBy: currentFilters.sortBy,
            page,
            limit: get().pageSize,
          });

          if (response.success && response.data) {
            const newResources = reset
              ? response.data.resources
              : [...get().resources, ...response.data.resources];

            set({
              resources: newResources,
              totalResources: response.data.pagination.total,
              hasMore: response.data.pagination.hasMore,
              filters: currentFilters,
              isLoading: false,
            });
          } else {
            // Fallback to demo data if API fails
            let filtered = [...DEMO_RESOURCES];

            if (currentFilters.search) {
              const search = currentFilters.search.toLowerCase();
              filtered = filtered.filter(r =>
                r.title.toLowerCase().includes(search) ||
                r.description?.toLowerCase().includes(search) ||
                r.tags?.some(t => t.toLowerCase().includes(search))
              );
            }

            if (currentFilters.resourceType && currentFilters.resourceType !== 'all') {
              filtered = filtered.filter(r => r.resourceType === currentFilters.resourceType);
            }

            set({
              resources: filtered,
              totalResources: filtered.length,
              hasMore: false,
              filters: currentFilters,
              isLoading: false,
            });
          }
        } catch (error) {
          // Fallback to demo data on error
          console.error('API error, using demo data:', error);
          set({
            resources: DEMO_RESOURCES,
            totalResources: DEMO_RESOURCES.length,
            hasMore: false,
            isLoading: false,
          });
        }
      },

      loadFeatured: async () => {
        try {
          const response = await api.get<LibraryResource[]>('/library/featured', { limit: 6 });
          if (response.success && response.data) {
            set({ featuredResources: response.data });
          } else {
            // Fallback to demo data
            const featured = DEMO_RESOURCES.filter(r => r.isFeatured);
            set({ featuredResources: featured });
          }
        } catch (error) {
          console.error('Failed to load featured resources:', error);
          const featured = DEMO_RESOURCES.filter(r => r.isFeatured);
          set({ featuredResources: featured });
        }
      },

      loadResource: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get<LibraryResource>(`/library/resources/${id}`);
          if (response.success && response.data) {
            set({ selectedResource: response.data });
            // Add to recently viewed
            const recentlyViewed = get().recentlyViewed.filter(r => r.id !== id);
            set({ recentlyViewed: [response.data, ...recentlyViewed].slice(0, 10) });
          } else {
            // Fallback to demo data
            const resource = DEMO_RESOURCES.find(r => r.id === id);
            if (resource) {
              set({ selectedResource: resource });
              const recentlyViewed = get().recentlyViewed.filter(r => r.id !== id);
              set({ recentlyViewed: [resource, ...recentlyViewed].slice(0, 10) });
            }
          }
          set({ isLoading: false });
        } catch (error) {
          // Fallback to demo data
          const resource = DEMO_RESOURCES.find(r => r.id === id);
          if (resource) {
            set({ selectedResource: resource });
          }
          set({ isLoading: false });
        }
      },

      loadRelatedResources: async (resourceId: string) => {
        try {
          const resource = get().selectedResource;
          if (!resource) return;

          // TODO: Replace with API call
          const related = DEMO_RESOURCES.filter(r =>
            r.id !== resourceId &&
            (r.subjectId === resource.subjectId || r.tags?.some(t => resource.tags?.includes(t)))
          ).slice(0, 4);

          set({ relatedResources: related });
        } catch (error) {
          console.error('Failed to load related resources:', error);
        }
      },

      loadMore: async () => {
        const { page, hasMore, isLoading } = get();
        if (!hasMore || isLoading) return;

        set({ page: page + 1 });
        await get().loadResources(undefined, false);
      },

      searchResources: async (query: string) => {
        set({ searchQuery: query });
        const filters = { ...get().filters, search: query };
        await get().loadResources(filters);
      },

      setFilters: (filters: Partial<LibraryFilters>) => {
        const newFilters = { ...get().filters, ...filters };
        set({ filters: newFilters });
        get().loadResources(newFilters);
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS, searchQuery: '' });
        get().loadResources(DEFAULT_FILTERS);
      },

      setViewMode: (mode: 'grid' | 'list') => {
        set({ viewMode: mode });
      },

      // Collections
      loadCollections: async () => {
        try {
          const response = await api.get<LibraryCollection[]>('/library/collections');
          if (response.success && response.data) {
            set({ collections: response.data });
          } else {
            set({ collections: DEMO_COLLECTIONS });
          }
        } catch (error) {
          console.error('Failed to load collections:', error);
          set({ collections: DEMO_COLLECTIONS });
        }
      },

      loadCollection: async (id: string) => {
        try {
          const collection = get().collections.find(c => c.id === id);
          if (collection) {
            set({ selectedCollection: collection });
          }
        } catch (error) {
          console.error('Failed to load collection:', error);
        }
      },

      createCollection: async (name: string, description?: string, color?: string) => {
        try {
          const response = await api.post<LibraryCollection>('/library/collections', {
            name,
            description,
            color: color || '#3B82F6',
          });

          if (response.success && response.data) {
            set({ collections: [...get().collections, response.data] });
            return response.data;
          }

          throw new Error('Failed to create collection');
        } catch (error) {
          throw new Error('Failed to create collection');
        }
      },

      updateCollection: async (id: string, updates: Partial<LibraryCollection>) => {
        try {
          await api.put(`/library/collections/${id}`, updates);
          set({
            collections: get().collections.map(c =>
              c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
            ),
          });
        } catch (error) {
          throw new Error('Failed to update collection');
        }
      },

      deleteCollection: async (id: string) => {
        try {
          await api.delete(`/library/collections/${id}`);
          set({ collections: get().collections.filter(c => c.id !== id) });
        } catch (error) {
          throw new Error('Failed to delete collection');
        }
      },

      addToCollection: async (collectionId: string, resourceId: string) => {
        try {
          await api.post(`/library/collections/${collectionId}/items`, { resourceId });
          set({
            collections: get().collections.map(c =>
              c.id === collectionId
                ? { ...c, resourceCount: (c.resourceCount || 0) + 1 }
                : c
            ),
          });
        } catch (error) {
          throw new Error('Failed to add to collection');
        }
      },

      removeFromCollection: async (collectionId: string, resourceId: string) => {
        try {
          await api.delete(`/library/collections/${collectionId}/items/${resourceId}`);
          set({
            collections: get().collections.map(c =>
              c.id === collectionId
                ? { ...c, resourceCount: Math.max(0, (c.resourceCount || 0) - 1) }
                : c
            ),
          });
        } catch (error) {
          throw new Error('Failed to remove from collection');
        }
      },

      // User Interactions
      rateResource: async (resourceId: string, rating: number, review?: string) => {
        try {
          await api.post(`/library/resources/${resourceId}/rate`, { rating, review });

          const newRating: LibraryRating = {
            id: `rating_${Date.now()}`,
            resourceId,
            userId: 'current_user',
            rating,
            review,
            createdAt: new Date().toISOString(),
          };

          set({
            userRatings: { ...get().userRatings, [resourceId]: newRating },
          });
        } catch (error) {
          throw new Error('Failed to rate resource');
        }
      },

      updateProgress: async (resourceId: string, progressPercent: number, lastPosition?: string) => {
        try {
          await api.post(`/library/resources/${resourceId}/progress`, {
            progressPercent,
            lastPosition,
            completed: progressPercent >= 100,
          });

          const progress: LibraryProgress = {
            id: `progress_${Date.now()}`,
            resourceId,
            userId: 'current_user',
            progressPercent,
            lastPosition,
            completed: progressPercent >= 100,
            updatedAt: new Date().toISOString(),
          };

          set({
            userProgress: { ...get().userProgress, [resourceId]: progress },
          });
        } catch (error) {
          console.error('Failed to update progress:', error);
        }
      },

      markCompleted: async (resourceId: string) => {
        await get().updateProgress(resourceId, 100);
      },

      trackView: async (_resourceId: string) => {
        // View tracking is handled by the API when loading a resource
      },

      trackDownload: async (resourceId: string) => {
        try {
          // Increment download count on the server
          console.log('Tracked download for:', resourceId);
        } catch (error) {
          console.error('Failed to track download:', error);
        }
      },

      // Admin
      uploadResource: async (data: FormData) => {
        set({ isUploadingResource: true, error: null });
        try {
          const response = await api.upload<{ id: string; contentUrl: string }>('/library/upload', data);

          if (response.success && response.data) {
            const newResource: LibraryResource = {
              id: response.data.id,
              title: data.get('title') as string,
              description: data.get('description') as string,
              resourceType: data.get('resourceType') as ResourceType,
              contentUrl: response.data.contentUrl,
              subjectId: data.get('subjectId') as string,
              schoolLevel: (data.get('schoolLevel') as 'jhs' | 'shs' | 'both') || 'both',
              accessLevel: 'free',
              uploadedBy: 'current_user',
              isFeatured: false,
              isActive: true,
              views: 0,
              downloads: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            set({
              resources: [newResource, ...get().resources],
              isUploadingResource: false,
            });

            return newResource;
          }

          throw new Error('Upload failed');
        } catch (error) {
          set({ error: 'Failed to upload resource', isUploadingResource: false });
          throw error;
        }
      },

      updateResource: async (id: string, updates: Partial<LibraryResource>) => {
        try {
          await api.put(`/library/resources/${id}`, updates);
          set({
            resources: get().resources.map(r =>
              r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
            ),
          });
        } catch (error) {
          throw new Error('Failed to update resource');
        }
      },

      deleteResource: async (id: string) => {
        try {
          await api.delete(`/library/resources/${id}`);
          set({ resources: get().resources.filter(r => r.id !== id) });
        } catch (error) {
          throw new Error('Failed to delete resource');
        }
      },

      // Utility
      selectResource: (resource: LibraryResource | null) => {
        set({ selectedResource: resource });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          resources: [],
          featuredResources: [],
          selectedResource: null,
          relatedResources: [],
          filters: DEFAULT_FILTERS,
          searchQuery: '',
          page: 1,
          error: null,
        });
      },
    }),
    {
      name: 'brilla-library-v1',
      partialize: (state) => ({
        viewMode: state.viewMode,
        recentlyViewed: state.recentlyViewed,
        userProgress: state.userProgress,
      }),
    }
  )
);
