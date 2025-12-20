import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Users,
  TrendingUp,
  Wrench,
  Zap,
  Rocket,
  ChevronRight,
  Play,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  LayoutDashboard,
  RefreshCw,
  User,
  Library,
  Target,
  Layers,
  Clock,
  PenTool,
  MessageSquare,
  Swords,
  Trophy,
  BarChart3,
  Award,
  Flame,
  Bot,
  FlaskConical,
  BookMarked,
  Medal,
} from 'lucide-react';
import { useExamStore } from '@/stores';
import { useGuideStore } from '@/stores/guideStore';
import { featureGuides, guideCategories, searchGuides, getGuidesForExam } from '@/data/guides';
import type { FeatureGuide, GuideCategory } from '@/types/guide';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  RefreshCw,
  User,
  Library,
  Target,
  Zap,
  Layers,
  FileText,
  Clock,
  PenTool,
  Users,
  MessageSquare,
  Swords,
  Trophy,
  BarChart3,
  Award,
  Flame,
  Bot,
  FlaskConical,
  BookMarked,
  Medal,
  BookOpen,
  TrendingUp,
  Wrench,
  Rocket,
  HelpCircle,
};

const categoryIcons: Record<GuideCategory, React.ElementType> = {
  'getting-started': Rocket,
  'practice': BookOpen,
  'exams': FileText,
  'social': Users,
  'progress': TrendingUp,
  'tools': Wrench,
  'advanced': Zap,
};

function GuideCard({ guide, onClick }: { guide: FeatureGuide; onClick: () => void }) {
  const Icon = iconMap[guide.icon] || HelpCircle;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 group-hover:text-primary transition-colors">
            {guide.title}
          </h3>
          <p className="text-sm text-neutral-500 line-clamp-2 mt-1">
            {guide.description}
          </p>
          {guide.examTypes[0] !== 'all' && (
            <div className="flex gap-1 mt-2">
              {guide.examTypes.map((exam) => (
                <span
                  key={exam}
                  className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full uppercase"
                >
                  {exam}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
}

function GuideDetail({ guide, onBack }: { guide: FeatureGuide; onBack: () => void }) {
  const Icon = iconMap[guide.icon] || HelpCircle;

  return (
    <div className="animate-fadeIn">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary mb-6 transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to guides
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{guide.title}</h1>
            <p className="text-white/80 mt-1">{guide.description}</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      {guide.tips && guide.tips.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-neutral-900">Pro Tips</h2>
          </div>
          <div className="space-y-3">
            {guide.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-600">{index + 1}</span>
                </div>
                <p className="text-neutral-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {guide.steps && guide.steps.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-neutral-900 mb-4">How to Use</h2>
          <div className="space-y-4">
            {guide.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{step.title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Features */}
      {guide.relatedFeatures && guide.relatedFeatures.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Related Features</h2>
          <div className="flex flex-wrap gap-2">
            {guide.relatedFeatures.map((featureId) => {
              const relatedGuide = featureGuides.find((g) => g.id === featureId);
              if (!relatedGuide) return null;
              return (
                <button
                  key={featureId}
                  onClick={onBack}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-primary/10 text-neutral-700 hover:text-primary rounded-lg text-sm transition-colors"
                >
                  {relatedGuide.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpCenter() {
  const { currentExamType } = useExamStore();
  const { startOnboarding, markGuideViewed } = useGuideStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<FeatureGuide | null>(null);

  // Filter guides based on search, category, and exam type
  const filteredGuides = useMemo(() => {
    let guides = getGuidesForExam(currentExamType);

    if (searchQuery) {
      guides = searchGuides(searchQuery, currentExamType);
    }

    if (selectedCategory) {
      guides = guides.filter((g) => g.category === selectedCategory);
    }

    return guides;
  }, [currentExamType, searchQuery, selectedCategory]);

  // Group guides by category
  const guidesGroupedByCategory = useMemo(() => {
    const groups: Record<GuideCategory, FeatureGuide[]> = {
      'getting-started': [],
      'practice': [],
      'exams': [],
      'social': [],
      'progress': [],
      'tools': [],
      'advanced': [],
    };

    filteredGuides.forEach((guide) => {
      groups[guide.category].push(guide);
    });

    return groups;
  }, [filteredGuides]);

  const handleGuideClick = (guide: FeatureGuide) => {
    setSelectedGuide(guide);
    markGuideViewed(guide.id);
  };

  if (selectedGuide) {
    return (
      <div className="max-w-4xl mx-auto">
        <GuideDetail guide={selectedGuide} onBack={() => setSelectedGuide(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">Help Center</h1>
        <p className="text-neutral-500 mt-2 max-w-xl mx-auto">
          Everything you need to know about Brilla. Search for topics or browse by category.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help topics..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <button
          onClick={startOnboarding}
          className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl hover:border-primary/40 transition-colors group"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              Watch Tour
            </h3>
            <p className="text-sm text-neutral-500">Quick platform overview</p>
          </div>
        </button>

        <button className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors group">
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <MessageCircle className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              Ask Brilla AI
            </h3>
            <p className="text-sm text-neutral-500">Get instant answers</p>
          </div>
        </button>

        <a
          href="mailto:support@brilla.edu"
          className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary/30 transition-colors group"
        >
          <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ExternalLink className="w-6 h-6 text-neutral-600 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              Contact Support
            </h3>
            <p className="text-sm text-neutral-500">We're here to help</p>
          </div>
        </a>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${!selectedCategory
              ? 'bg-primary text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }
          `}
        >
          All Topics
        </button>
        {(Object.keys(guideCategories) as GuideCategory[]).map((category) => {
          const CategoryIcon = categoryIcons[category];
          const count = guidesGroupedByCategory[category].length;
          if (count === 0) return null;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
            >
              <CategoryIcon className="w-4 h-4" />
              {guideCategories[category].label}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Guides Grid */}
      {selectedCategory ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
            {(() => {
              const CategoryIcon = categoryIcons[selectedCategory];
              return <CategoryIcon className="w-5 h-5 text-primary" />;
            })()}
            {guideCategories[selectedCategory].label}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guidesGroupedByCategory[selectedCategory].map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onClick={() => handleGuideClick(guide)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.keys(guideCategories) as GuideCategory[]).map((category) => {
            const guides = guidesGroupedByCategory[category];
            if (guides.length === 0) return null;

            const CategoryIcon = categoryIcons[category];
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 text-primary" />
                    {guideCategories[category].label}
                  </h2>
                  {guides.length > 4 && (
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className="text-sm text-primary hover:underline"
                    >
                      View all ({guides.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guides.slice(0, 4).map((guide) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      onClick={() => handleGuideClick(guide)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredGuides.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900">No guides found</h3>
          <p className="text-neutral-500 mt-1">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
            className="mt-4 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
