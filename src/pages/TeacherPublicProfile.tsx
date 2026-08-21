import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  MessageCircle,
  PenTool,
  Clock,
  Users,
  Award,
  Calendar,
  CheckCircle,
  Loader2,
  Star,
} from 'lucide-react';
import { StarRating } from '@/components/tutoring/StarRating';
import { ReviewCard } from '@/components/tutoring/ReviewCard';
import { SessionRequestForm } from '@/components/tutoring/SessionRequestForm';
import { useTutoringStore } from '@/stores/tutoringStore';
import { useAuthStore } from '@/stores/authStore';
import type { SessionType, TeacherDirectoryProfile } from '@/types/tutoring';

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string; description: string }> = {
  video: {
    icon: <Video className="w-6 h-6" />,
    label: 'Video Call',
    description: 'Live video session with screen sharing',
  },
  chat: {
    icon: <MessageCircle className="w-6 h-6" />,
    label: 'Chat Session',
    description: 'Text-based tutoring with instant messaging',
  },
  whiteboard: {
    icon: <PenTool className="w-6 h-6" />,
    label: 'Whiteboard',
    description: 'Interactive whiteboard with drawing tools',
  },
};

export default function TeacherPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { selectedTeacher, teacherReviews, isLoadingProfile, error, loadTeacherProfile, loadTeacherReviews, createRequest } = useTutoringStore();
  const isLoading = isLoadingProfile;
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);

  useEffect(() => {
    if (id) {
      loadTeacherProfile(id);
      loadTeacherReviews(id, 1);
    }
  }, [id, loadTeacherProfile, loadTeacherReviews]);

  const handleRequestSession = async (data: {
    teacherProfileId: string;
    subjectId: string;
    topicDescription?: string;
    sessionType: SessionType;
    proposedDatetime: string;
    proposedDuration: number;
    message?: string;
  }) => {
    await createRequest(data);
    setShowRequestForm(false);
    navigate('/tutoring/requests');
  };

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/tutors/${id}` } });
      return;
    }
    setShowRequestForm(true);
  };

  if (isLoading && !selectedTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !selectedTeacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || 'Teacher not found'}</p>
        <Link to="/tutors" className="text-blue-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>
    );
  }

  const teacher = selectedTeacher;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/tutors"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
        </div>

        {/* Profile Header */}
        <div className="container mx-auto px-4 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Photo */}
            <div className="w-32 h-32 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
              {teacher.profilePhotoUrl ? (
                <img
                  src={teacher.profilePhotoUrl}
                  alt={teacher.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-bold">
                  {teacher.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{teacher.displayName}</h1>
                {teacher.isFeatured && (
                  <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Featured
                  </span>
                )}
              </div>

              {teacher.tagline && (
                <p className="text-lg text-blue-100 mb-3">{teacher.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <StarRating rating={teacher.averageRating} size="sm" />
                  <span className="ml-1 font-medium">{teacher.averageRating.toFixed(1)}</span>
                  <span className="text-blue-200">({teacher.ratingCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-blue-200">
                  <Users className="w-4 h-4" />
                  <span>{teacher.totalSessions} sessions</span>
                </div>
                <div className="flex items-center gap-1 text-blue-200">
                  <Clock className="w-4 h-4" />
                  <span>{teacher.responseRate}% response rate</span>
                </div>
              </div>
            </div>

            {/* Price & Book Button */}
            <div className="w-full md:w-auto">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                <div className="text-center mb-3">
                  <span className="text-3xl font-bold text-blue-600">GH₵{teacher.hourlyRate}</span>
                  <span className="text-neutral-500">/hour</span>
                </div>
                <button
                  onClick={handleBookClick}
                  className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {teacher.bio && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">About</h2>
                <p className="text-neutral-600 whitespace-pre-wrap">{teacher.bio}</p>
              </div>
            )}

            {/* Session Types */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Session Types Available</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {teacher.sessionTypes.map((type) => (
                  <div
                    key={type}
                    className="p-4 border border-neutral-200 rounded-lg flex flex-col items-center text-center"
                  >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                      {sessionTypeConfig[type].icon}
                    </div>
                    <h3 className="font-medium text-neutral-900">{sessionTypeConfig[type].label}</h3>
                    <p className="text-sm text-neutral-500 mt-1">{sessionTypeConfig[type].description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Reviews ({teacher.ratingCount})
                </h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-lg">{teacher.averageRating.toFixed(1)}</span>
                </div>
              </div>

              {teacherReviews.length > 0 ? (
                <div className="space-y-4">
                  {teacherReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}

                  {teacher.ratingCount > teacherReviews.length && (
                    <button
                      onClick={() => {
                        setReviewsPage((p) => p + 1);
                        loadTeacherReviews(teacher.id, reviewsPage + 1);
                      }}
                      className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Load More Reviews
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Star className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                  <p>No reviews yet. Be the first to book a session!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Subjects */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Subjects</h2>
              <div className="space-y-2">
                {teacher.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                    <span className="font-medium text-neutral-900">{subject.subjectName}</span>
                    <span className="text-sm text-neutral-500">{subject.level}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            {teacher.availability && (
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Availability</h2>
                <div className="space-y-2 text-sm">
                  {Object.entries(teacher.availability).map(([day, times]) => (
                    <div key={day} className="flex items-center justify-between py-1">
                      <span className="capitalize text-neutral-600">{day}</span>
                      {times ? (
                        <span className="text-neutral-900">{times}</span>
                      ) : (
                        <span className="text-neutral-400">Not available</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Facts */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Facts</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-neutral-600">Verified Teacher</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-neutral-600">{teacher.totalSessions} sessions completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="text-neutral-600">{teacher.responseRate}% response rate</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 text-center">
              <h3 className="font-semibold text-neutral-900 mb-2">Ready to Start Learning?</h3>
              <p className="text-sm text-neutral-600 mb-4">
                Book a session with {teacher.displayName.split(' ')[0]} and take your studies to the next level.
              </p>
              <button
                onClick={handleBookClick}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Now - GH₵{teacher.hourlyRate}/hr
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Request Modal */}
      <SessionRequestForm
        teacher={teacher as TeacherDirectoryProfile}
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleRequestSession}
      />
    </div>
  );
}
