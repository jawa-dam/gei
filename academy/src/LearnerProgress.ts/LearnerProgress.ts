export interface LearnerProgress {
  learnerId: string;
  completedLessons: string[];
  currentLesson?: string;
  score?: number;
}