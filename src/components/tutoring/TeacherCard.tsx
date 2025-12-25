import { Link } from 'react-router-dom';
import { Video, MessageCircle, PenTool, Clock, Users, Award } from 'lucide-react';
import { StarRating } from './StarRating';
import type { TeacherDirectoryCard, SessionType } from '@/types/tutoring';

interface TeacherCardProps {
  teacher: TeacherDirectoryCard;
}

const sessionTypeIcons: Record<SessionType, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
  whiteboard: <PenTool className="w-4 h-4" />,
};

const sessionTypeLabels: Record<SessionType, string> = {
  video: 'Video',
  chat: 'Chat',
  whiteboard: 'Whiteboard',
};

export function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <Link
      to={`/tutors/${teacher.id}`}
      className="group block bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200"
    >
      {/* Header with photo */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
        {teacher.isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-400 text-amber-900 text-xs font-semibold rounded-full flex items-center gap-1">
            <Award className="w-3 h-3" />
            Featured
          </div>
        )}
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-neutral-100 overflow-hidden shadow-md">
            {teacher.profilePhotoUrl ? (
              <img
                src={teacher.profilePhotoUrl}
                alt={teacher.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-2xl font-bold">
                {teacher.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-4 pb-4">
        {/* Name and tagline */}
        <h3 className="font-semibold text-lg text-neutral-900 group-hover:text-blue-600 transition-colors">
          {teacher.displayName}
        </h3>
        {teacher.tagline && (
          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
            {teacher.tagline}
          </p>
        )}

        {/* Rating */}
        <div className="mt-3">
          <StarRating
            rating={teacher.averageRating}
            showValue
            count={teacher.ratingCount}
            size="sm"
          />
        </div>

        {/* Subjects */}
        <div className="mt-3 flex flex-wrap gap-1">
          {teacher.subjects.slice(0, 3).map((subject, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {subject.subjectName}
            </span>
          ))}
          {teacher.subjects.length > 3 && (
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
              +{teacher.subjects.length - 3} more
            </span>
          )}
        </div>

        {/* Session types */}
        <div className="mt-3 flex items-center gap-2">
          {teacher.sessionTypes.map((type) => (
            <div
              key={type}
              className="flex items-center gap-1 text-neutral-500"
              title={sessionTypeLabels[type]}
            >
              {sessionTypeIcons[type]}
            </div>
          ))}
        </div>

        {/* Stats and price */}
        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <div className="flex items-center gap-1" title="Total sessions">
              <Users className="w-4 h-4" />
              <span>{teacher.totalSessions}</span>
            </div>
            <div className="flex items-center gap-1" title="Response rate">
              <Clock className="w-4 h-4" />
              <span>{teacher.responseRate}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-blue-600">
              GH₵{teacher.hourlyRate}
            </span>
            <span className="text-sm text-neutral-500">/hr</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
