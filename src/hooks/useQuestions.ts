import { useState, useCallback } from 'react';
import type { Question, Subject, Topic, Difficulty, RoundType } from '@/types';
import { api } from '@/lib/api';
import { getQuestionBankError } from '@/lib/subjectAvailability';

interface UseQuestionsOptions {
  subjectId?: string;
  topicId?: string;
  difficulty?: Difficulty;
  roundType?: RoundType;
  limit?: number;
}

interface UseQuestionsReturn {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  fetchQuestions: (options?: UseQuestionsOptions) => Promise<void>;
  getRandomQuestions: (count: number, options?: UseQuestionsOptions) => Question[];
}

export function useQuestions(initialOptions?: UseQuestionsOptions): UseQuestionsReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (options?: UseQuestionsOptions) => {
    const opts = { ...initialOptions, ...options };
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (opts?.subjectId) params.append('subject', opts.subjectId);
      if (opts?.topicId) params.append('topic', opts.topicId);
      if (opts?.difficulty) params.append('difficulty', opts.difficulty);
      if (opts?.roundType) params.append('round', opts.roundType);
      if (opts?.limit) params.append('limit', opts.limit.toString());

      const res = await api.get<Question[]>(`/questions?${params.toString()}`);
      if (res.success && res.data) {
        setQuestions(res.data);
      } else {
        setError(getQuestionBankError(res, 'Failed to fetch questions'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  }, [initialOptions]);

  const getRandomQuestions = useCallback((count: number, options?: UseQuestionsOptions) => {
    let filtered = [...questions];

    if (options?.subjectId) {
      filtered = filtered.filter((q) => q.subjectId === options.subjectId);
    }
    if (options?.topicId) {
      filtered = filtered.filter((q) => q.topicId === options.topicId);
    }
    if (options?.difficulty) {
      filtered = filtered.filter((q) => q.difficulty === options.difficulty);
    }
    if (options?.roundType) {
      filtered = filtered.filter((q) => q.roundType === options.roundType);
    }

    // Shuffle and return requested count
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, [questions]);

  return {
    questions,
    isLoading,
    error,
    fetchQuestions,
    getRandomQuestions,
  };
}

// Hook for fetching subjects
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<Subject[]>('/subjects');
      if (res.success && res.data) {
        setSubjects(res.data);
      } else {
        setError(res.error || 'Failed to fetch subjects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    subjects,
    isLoading,
    error,
    fetchSubjects,
  };
}

// Hook for fetching topics
export function useTopics(subjectId?: string) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async (subject?: string) => {
    const id = subject || subjectId;
    setIsLoading(true);
    setError(null);

    try {
      const url = id ? `/topics?subject=${id}` : '/topics';
      const res = await api.get<Topic[]>(url);
      if (res.success && res.data) {
        setTopics(res.data);
      } else {
        setError(res.error || 'Failed to fetch topics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  return {
    topics,
    isLoading,
    error,
    fetchTopics,
  };
}
