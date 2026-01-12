import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImmersiveClassroom } from '@/components/immersive';

export function ImmersiveLearningPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const subjectId = searchParams.get('subject') || '';
  const topicId = searchParams.get('topic') || undefined;
  const lessonId = searchParams.get('lesson') || undefined;

  // Validate we have required params
  useEffect(() => {
    if (!subjectId) {
      navigate('/revision-classroom');
    }
  }, [subjectId, navigate]);

  const handleExit = () => {
    navigate('/revision-classroom');
  };

  if (!subjectId) {
    return null;
  }

  return (
    <ImmersiveClassroom
      subjectId={subjectId}
      topicId={topicId}
      lessonId={lessonId}
      onExit={handleExit}
    />
  );
}

export default ImmersiveLearningPage;
