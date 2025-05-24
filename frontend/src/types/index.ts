export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export interface SummaryResponse {
  summary: string;
  tags: string[];
  summary_type: string;
  word_count: number;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  total_questions: number;
  difficulty: string;
  subject: string;
  estimated_time: number;
}

export interface QuizResult {
  score: number;
  correct_answers: number;
  total_questions: number;
  feedback: string;
  suggestion: string;
  passed: boolean;
}

export interface PDFUploadResponse {
  filename: string;
  text_content: string;
  word_count: number;
}

export type SummaryType = 'short' | 'bullet_points' | 'detailed';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface QuizFormData {
  numQuestions: number;
  subject: string;
  difficulty: Difficulty;
  summaryType: SummaryType;
}

export interface UserAnswer {
  questionIndex: number;
  selectedOption: string;
}

export interface Flashcard {
  front: string;
  back: string;
  category?: string;
}

export interface FlashcardResponse {
  flashcards: Flashcard[];
  total_cards: number;
  subject: string;
  card_type: string;
}

export type CardType = 'definition' | 'concept' | 'fact' | 'mixed'; 