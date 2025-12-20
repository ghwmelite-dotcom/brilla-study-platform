import { useState } from 'react';
import {
  Upload,
  FileText,
  Folder,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { cn } from '@/utils';

// Types
interface ContentItem {
  id: string;
  title: string;
  type: 'topic' | 'question' | 'essay' | 'paper' | 'resource';
  subject: string;
  examType: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  author: string;
  views?: number;
}

// Sample content data
const sampleContent: ContentItem[] = [
  {
    id: '1',
    title: 'Introduction to Quadratic Equations',
    type: 'topic',
    subject: 'Mathematics',
    examType: 'WASSCE',
    status: 'published',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    author: 'Mr. Osei',
    views: 245,
  },
  {
    id: '2',
    title: 'Physics Paper 2 - 2023',
    type: 'paper',
    subject: 'Physics',
    examType: 'WASSCE',
    status: 'published',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
    author: 'Admin',
    views: 532,
  },
  {
    id: '3',
    title: 'Essay: Climate Change Impact',
    type: 'essay',
    subject: 'Geography',
    examType: 'WASSCE',
    status: 'draft',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-19',
    author: 'Ms. Mensah',
  },
  {
    id: '4',
    title: 'Cell Biology Quiz Set',
    type: 'question',
    subject: 'Biology',
    examType: 'BECE',
    status: 'published',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-14',
    author: 'Dr. Asante',
    views: 189,
  },
];

type ContentType = 'all' | 'topic' | 'question' | 'essay' | 'paper' | 'resource';
type StatusFilter = 'all' | 'draft' | 'published' | 'archived';

// Content Type Icon
function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ElementType> = {
    topic: BookOpen,
    question: FileQuestion,
    essay: FileText,
    paper: Layers,
    resource: Folder,
  };
  const Icon = icons[type] || FileText;
  return <Icon className="w-5 h-5" />;
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
    published: { variant: 'success', label: 'Published' },
    draft: { variant: 'warning', label: 'Draft' },
    archived: { variant: 'neutral', label: 'Archived' },
  };
  const { variant, label } = variants[status] || { variant: 'neutral', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

// Upload Modal
function UploadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [uploadType, setUploadType] = useState<ContentType>('topic');
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const contentTypes = [
    { id: 'topic', label: 'Topic/Lesson', icon: BookOpen, description: 'Educational content with theory and examples' },
    { id: 'question', label: 'Questions', icon: FileQuestion, description: 'Practice questions with answers' },
    { id: 'essay', label: 'Essay Question', icon: FileText, description: 'Essay prompts with model answers' },
    { id: 'paper', label: 'Past Paper', icon: Layers, description: 'Complete exam papers' },
    { id: 'resource', label: 'Resource', icon: Folder, description: 'PDFs, images, or other files' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Upload Content</h2>
          <p className="text-sm text-slate-500">Add new study materials to the platform</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Content Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Content Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setUploadType(type.id as ContentType)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    uploadType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <type.icon className={cn(
                    'w-6 h-6 mb-2',
                    uploadType === type.id ? 'text-primary' : 'text-slate-400'
                  )} />
                  <p className="font-medium text-slate-900 text-sm">{type.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter content title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Select subject</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="biology">Biology</option>
                  <option value="english">English</option>
                  <option value="geography">Geography</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Exam Type
                </label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Select exam</option>
                  <option value="nsmq">NSMQ</option>
                  <option value="wassce">WASSCE</option>
                  <option value="bece">BECE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
                placeholder="Brief description of the content"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Upload Files (optional)
              </label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                  dragActive ? 'border-primary bg-primary/5' : 'border-slate-200'
                )}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-1">
                  Drag and drop files here, or{' '}
                  <button className="text-primary font-medium hover:underline">browse</button>
                </p>
                <p className="text-xs text-slate-400">
                  Supports PDF, DOCX, images, and videos up to 50MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline">
            Save as Draft
          </Button>
          <Button variant="primary">
            <Upload className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContentManagementPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContentType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Check if user is admin or teacher
  const canManageContent = user?.role === 'admin' || user?.role === 'teacher';

  if (!canManageContent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">
            You need to be a teacher or admin to access content management.
          </p>
        </Card>
      </div>
    );
  }

  // Filter content
  const filteredContent = sampleContent.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: sampleContent.length,
    published: sampleContent.filter((c) => c.status === 'published').length,
    drafts: sampleContent.filter((c) => c.status === 'draft').length,
    views: sampleContent.reduce((sum, c) => sum + (c.views || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            Content Management
          </h1>
          <p className="text-slate-500">
            Upload and manage study materials, questions, and past papers
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Items</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.published}</p>
              <p className="text-sm text-slate-500">Published</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.drafts}</p>
              <p className="text-sm text-slate-500">Drafts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.views.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Views</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ContentType)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="topic">Topics</option>
              <option value="question">Questions</option>
              <option value="essay">Essays</option>
              <option value="paper">Past Papers</option>
              <option value="resource">Resources</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Content List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Content</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Subject</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Views</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Updated</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <ContentTypeIcon type={item.type} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">by {item.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" className="capitalize">{item.type}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-slate-900">{item.subject}</p>
                      <p className="text-xs text-slate-500">{item.examType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.views?.toLocaleString() || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {item.updatedAt}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContent.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No content found</h3>
            <p className="text-slate-500 mb-4">Try adjusting your search or filter criteria.</p>
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
