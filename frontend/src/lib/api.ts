import { 
  PDFUploadResponse, 
  SummaryResponse, 
  QuizResponse, 
  QuizResult, 
  SummaryType, 
  Difficulty,
  FlashcardResponse,
  CardType
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = {
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(`Failed to upload PDF: ${error}`, response.status);
    }

    return response.json();
  },

  async generateSummary(
    textContent: string,
    summaryType: SummaryType,
    subject?: string
  ): Promise<SummaryResponse> {
    const formData = new FormData();
    formData.append('text_content', textContent);
    formData.append('summary_type', summaryType);
    if (subject) {
      formData.append('subject', subject);
    }

    const response = await fetch(`${API_BASE_URL}/generate-summary`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(`Failed to generate summary: ${error}`, response.status);
    }

    return response.json();
  },

  async generateQuiz(
    textContent: string,
    numQuestions: number,
    subject: string,
    difficulty: Difficulty,
    previousScore?: number
  ): Promise<QuizResponse> {
    const formData = new FormData();
    formData.append('text_content', textContent);
    formData.append('num_questions', numQuestions.toString());
    formData.append('subject', subject);
    formData.append('difficulty', difficulty);
    if (previousScore !== undefined) {
      formData.append('previous_score', previousScore.toString());
    }

    const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(`Failed to generate quiz: ${error}`, response.status);
    }

    return response.json();
  },

  async checkAnswers(
    userAnswers: string[],
    correctAnswers: string[]
  ): Promise<QuizResult> {
    const formData = new FormData();
    userAnswers.forEach((answer) => {
      formData.append('user_answers', answer);
    });
    correctAnswers.forEach((answer) => {
      formData.append('correct_answers', answer);
    });

    const response = await fetch(`${API_BASE_URL}/check-answers`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(`Failed to check answers: ${error}`, response.status);
    }

    return response.json();
  },

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new APIError('Health check failed', response.status);
    }

    return response.json();
  },

  async generateFlashcards(
    textContent: string,
    numCards: number,
    subject: string,
    cardType: CardType
  ): Promise<FlashcardResponse> {
    const formData = new FormData();
    formData.append('text_content', textContent);
    formData.append('num_cards', numCards.toString());
    formData.append('subject', subject);
    formData.append('card_type', cardType);

    const response = await fetch(`${API_BASE_URL}/generate-flashcards`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new APIError(`Failed to generate flashcards: ${error}`, response.status);
    }

    return response.json();
  }
};

export { APIError }; 