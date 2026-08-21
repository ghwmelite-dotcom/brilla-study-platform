import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Clock,
  FolderOpen,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useLibraryStore } from '@/stores/libraryStore';
import { useAuthStore } from '@/stores/authStore';
import { ResourceCard, ResourceFilters, ResourceViewerModal, UploadResourceModal, EditResourceModal } from '@/components/library';
import type { LibraryResource } from '@/types';

export function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    resources,
    featuredResources,
    collections,
    recentlyViewed,
    isLoading,
    viewMode,
    loadResources,
    loadFeatured,
    loadCollections,
    selectResource,
    selectedResource,
    rateResource,
    trackDownload,
    deleteResource,
  } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<'browse' | 'collections' | 'recent'>('browse');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<LibraryResource | null>(null);

  useEffect(() => {
    loadResources();
    loadFeatured();
    if (user) {
      loadCollections();
    }
  }, [loadResources, loadFeatured, loadCollections, user]);

  const handleResourceSelect = (resource: LibraryResource) => {
    selectResource(resource);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    selectResource(null);
  };

  const handleRate = async (resource: LibraryResource, rating: number) => {
    await rateResource(resource.id, rating);
  };

  const handleDownload = async (resource: LibraryResource) => {
    await trackDownload(resource.id);
  };

  const handleDelete = async (resource: LibraryResource) => {
    await deleteResource(resource.id);
    // Reload resources after deletion
    loadResources();
    loadFeatured();
  };

  const handleEdit = (resource: LibraryResource) => {
    setResourceToEdit(resource);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    // Reload resources after edit
    loadResources();
    loadFeatured();
    // Also refresh the selected resource if it's the one being edited
    if (selectedResource && resourceToEdit && selectedResource.id === resourceToEdit.id) {
      selectResource(null);
    }
  };

  const handleUploadSuccess = () => {
    loadResources();
    loadFeatured();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">E-Library</h1>
          <p className="text-neutral-500">Digital resources to power your learning</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Resource
          </button>
        )}
      </div>

      {/* Featured Section */}
      {featuredResources.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Featured Resources
            </h2>
            <button className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
              View all
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredResources.slice(0, 4).map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onSelect={handleResourceSelect}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'text-primary border-b-2 border-primary'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Browse All
            </span>
          </button>
          {user && (
            <>
              <button
                onClick={() => setActiveTab('collections')}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'collections'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  My Collections
                  {collections.length > 0 && (
                    <span className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">
                      {collections.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === 'recent'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recently Viewed
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          <ResourceFilters />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
                >
                  <div className="aspect-video bg-neutral-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-neutral-100 rounded-full animate-pulse" />
                      <div className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : resources.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-3'
              }
            >
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onSelect={handleResourceSelect}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No resources found</h3>
              <p className="text-neutral-500">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div>
          {collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => navigate(`/library/collections/${collection.id}`)}
                  className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-primary hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${collection.color}20` }}
                    >
                      <FolderOpen
                        className="w-6 h-6"
                        style={{ color: collection.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-sm text-neutral-500 line-clamp-1">
                          {collection.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {collection.resourceCount || 0} resources
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create New Collection */}
              <button className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-xl p-4 hover:border-primary hover:bg-white transition-all flex flex-col items-center justify-center min-h-[120px]">
                <Plus className="w-8 h-8 text-neutral-400 mb-2" />
                <span className="text-sm font-medium text-neutral-600">Create Collection</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No collections yet</h3>
              <p className="text-neutral-500 mb-4">
                Save resources to collections for easy access
              </p>
              <button className="btn btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Collection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recently Viewed Tab */}
      {activeTab === 'recent' && (
        <div>
          {recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentlyViewed.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onSelect={handleResourceSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No recent resources</h3>
              <p className="text-neutral-500">
                Resources you view will appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Resource Viewer Modal */}
      <ResourceViewerModal
        resource={selectedResource}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        onRate={handleRate}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Upload Resource Modal */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Edit Resource Modal */}
      <EditResourceModal
        resource={resourceToEdit}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setResourceToEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
