import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  PenTool,
  Clock,
  Video,
  Play,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useWhiteboardStore } from '@/stores/whiteboardStore';
import type { SavedWhiteboard } from '@/types/whiteboard';
import { recordingsService, type RecordingData } from '@/lib/services';

type TabType = 'whiteboards' | 'recordings';

export default function WhiteboardList() {
  const navigate = useNavigate();
  const {
    savedWhiteboards,
    deleteWhiteboard,
    duplicateWhiteboard,
    fetchWhiteboards,
    isLoadingWhiteboards,
    whiteboardsError,
  } = useWhiteboardStore();

  const [activeTab, setActiveTab] = useState<TabType>('whiteboards');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);

  // Fetch whiteboards from cloud on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'whiteboards') {
      fetchWhiteboards();
    }
  }, [activeTab, fetchWhiteboards]);

  // Fetch recordings from API
  const fetchRecordings = useCallback(async () => {
    setRecordingsLoading(true);
    setRecordingsError(null);
    try {
      const response = await recordingsService.list();
      setRecordings(response.recordings || []);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
      setRecordingsError(error instanceof Error ? error.message : 'Failed to load recordings');
    } finally {
      setRecordingsLoading(false);
    }
  }, []);

  // Fetch recordings when tab changes to recordings
  useEffect(() => {
    if (activeTab === 'recordings') {
      fetchRecordings();
    }
  }, [activeTab, fetchRecordings]);

  const filteredWhiteboards = useMemo(() => {
    let filtered = [...savedWhiteboards];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (wb) =>
          wb.title.toLowerCase().includes(query) ||
          wb.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [savedWhiteboards, searchQuery, sortBy]);

  const filteredRecordings = useMemo(() => {
    let filtered = [...recordings];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          rec.title.toLowerCase().includes(query) ||
          rec.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [recordings, searchQuery, sortBy]);

  // Delete recording handler
  const handleDeleteRecording = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await recordingsService.delete(id);
        setRecordings((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        console.error('Failed to delete recording:', error);
        alert('Failed to delete recording. Please try again.');
      }
    }
    setActiveMenu(null);
  };

  const handleCreate = () => {
    navigate('/teacher/whiteboard/new');
  };

  const handleViewRecording = (id: string) => {
    navigate(`/teacher/whiteboard/recording/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/teacher/whiteboard/${id}/edit`);
    setActiveMenu(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateWhiteboard(id);
    } catch (error) {
      console.error('Failed to duplicate whiteboard:', error);
      alert('Failed to duplicate whiteboard. Please try again.');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        await deleteWhiteboard(id);
      } catch (error) {
        console.error('Failed to delete whiteboard:', error);
        alert('Failed to delete whiteboard. Please try again.');
      }
    }
    setActiveMenu(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Whiteboard Materials</h1>
              <p className="text-neutral-600 mt-1">
                Create and manage your teaching whiteboard lessons
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Whiteboard</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('whiteboards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'whiteboards'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Whiteboards
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200">
                {savedWhiteboards.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('recordings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recordings'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Video className="w-4 h-4" />
              Recordings
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200">
                {recordings.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search whiteboards..."
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'whiteboards' ? (
          <>
            {isLoadingWhiteboards ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                  <p className="text-neutral-600">Loading whiteboards...</p>
                </div>
              </div>
            ) : whiteboardsError ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Failed to load whiteboards
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">{whiteboardsError}</p>
                <button
                  onClick={() => fetchWhiteboards()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">Try Again</span>
                </button>
              </div>
            ) : filteredWhiteboards.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {searchQuery ? 'No whiteboards found' : 'No whiteboards yet'}
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search to find what you\'re looking for.'
                    : 'Create your first whiteboard to start building visual teaching materials for your students.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create Whiteboard</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Create New Card */}
                <button
                  onClick={handleCreate}
                  className="group aspect-[4/3] bg-white rounded-xl border-2 border-dashed border-neutral-300 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 bg-neutral-100 group-hover:bg-teal-100 rounded-xl flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 text-neutral-400 group-hover:text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-600 group-hover:text-teal-700">
                    New Whiteboard
                  </span>
                </button>

                {/* Whiteboard Cards */}
                {filteredWhiteboards.map((whiteboard) => (
                  <WhiteboardCard
                    key={whiteboard.id}
                    whiteboard={whiteboard}
                    isMenuOpen={activeMenu === whiteboard.id}
                    onMenuToggle={() => setActiveMenu(activeMenu === whiteboard.id ? null : whiteboard.id)}
                    onEdit={() => handleEdit(whiteboard.id)}
                    onDuplicate={() => handleDuplicate(whiteboard.id)}
                    onDelete={() => handleDelete(whiteboard.id, whiteboard.title)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {/* Stats */}
            {savedWhiteboards.length > 0 && !isLoadingWhiteboards && !whiteboardsError && (
              <div className="mt-8 text-center text-sm text-neutral-500">
                {savedWhiteboards.length} whiteboard{savedWhiteboards.length !== 1 ? 's' : ''} total
              </div>
            )}
          </>
        ) : (
          <>
            {/* Recordings Tab */}
            {recordingsLoading ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                  <p className="text-neutral-600">Loading recordings...</p>
                </div>
              </div>
            ) : recordingsError ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Failed to load recordings
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">{recordingsError}</p>
                <button
                  onClick={fetchRecordings}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">Try Again</span>
                </button>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {searchQuery ? 'No recordings found' : 'No recordings yet'}
                </h3>
                <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search to find what you\'re looking for.'
                    : 'Record your whiteboard lessons to create video content for your students. Start by opening a whiteboard and clicking the Record button.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create Whiteboard</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Recording Cards */}
                {filteredRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    isMenuOpen={activeMenu === `rec-${recording.id}`}
                    onMenuToggle={() => setActiveMenu(activeMenu === `rec-${recording.id}` ? null : `rec-${recording.id}`)}
                    onView={() => handleViewRecording(recording.id)}
                    onDelete={() => handleDeleteRecording(recording.id, recording.title)}
                    formatDate={formatDate}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            )}

            {/* Stats */}
            {recordings.length > 0 && !recordingsLoading && !recordingsError && (
              <div className="mt-8 text-center text-sm text-neutral-500">
                {recordings.length} recording{recordings.length !== 1 ? 's' : ''} total
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface WhiteboardCardProps {
  whiteboard: SavedWhiteboard;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
}

function WhiteboardCard({
  whiteboard,
  isMenuOpen,
  onMenuToggle,
  onEdit,
  onDuplicate,
  onDelete,
  formatDate,
}: WhiteboardCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all">
      {/* Thumbnail */}
      <button
        onClick={onEdit}
        className="w-full aspect-[4/3] bg-neutral-100 relative overflow-hidden"
      >
        {whiteboard.thumbnail ? (
          <img
            src={whiteboard.thumbnail}
            alt={whiteboard.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PenTool className="w-12 h-12 text-neutral-300" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-teal-600/0 group-hover:bg-teal-600/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              <span className="text-sm font-medium text-teal-700">Open Editor</span>
            </div>
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">{whiteboard.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(whiteboard.updatedAt)}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onMenuToggle} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <button
                    onClick={onEdit}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={onDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <hr className="my-1 border-neutral-200" />
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecordingCardProps {
  recording: RecordingData;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onView: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  formatDuration: (ms: number) => string;
}

function RecordingCard({
  recording,
  isMenuOpen,
  onMenuToggle,
  onView,
  onDelete,
  formatDate,
  formatDuration,
}: RecordingCardProps) {
  return (
    <div className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-red-200 transition-all">
      {/* Thumbnail */}
      <button
        onClick={onView}
        className="w-full aspect-[4/3] bg-neutral-900 relative overflow-hidden"
      >
        {recording.thumbnailUrl ? (
          <img
            src={recording.thumbnailUrl}
            alt={recording.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-12 h-12 text-neutral-600" />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-medium rounded">
          {formatDuration(recording.duration)}
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-neutral-800 ml-1" />
          </div>
        </div>
      </button>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 truncate">{recording.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              {recording.teacherName && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {recording.teacherName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(recording.createdAt)}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuToggle();
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onMenuToggle} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <button
                    onClick={onView}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Play className="w-4 h-4" />
                    View
                  </button>
                  <hr className="my-1 border-neutral-200" />
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
