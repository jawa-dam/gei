export interface Activity {
  id: string;
  title: string;
  type: 'reading' | 'question' | 'quiz' | 'simulation' | 'discussion';
}