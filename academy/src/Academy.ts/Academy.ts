import type { LessonPlan } from './LessonPlan';
import type { LearnerProgress } from './LearnerProgress';

export class Academy {
  private readonly lessonPlans: LessonPlan[] = [];
  private readonly progress: LearnerProgress[] = [];

  addLessonPlan(plan: LessonPlan): void {
    this.lessonPlans.push(plan);
  }

  addProgress(progress: LearnerProgress): void {
    this.progress.push(progress);
  }

  getLessonPlans(): readonly LessonPlan[] {
    return [...this.lessonPlans];
  }

  getProgress(): readonly LearnerProgress[] {
    return [...this.progress];
  }
}