export class LearningRuntime {
  createLesson(title: string, content: string): {
    id: string;
    title: string;
    content: string;
  } {
    return {
      id: crypto.randomUUID(),
      title,
      content,
    };
  }
}