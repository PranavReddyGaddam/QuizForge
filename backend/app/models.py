from pydantic import BaseModel
from typing import List, Optional

class SummaryRequest(BaseModel):
    text_content: str
    summary_type: str  # "short", "bullet_points", "detailed"
    subject: Optional[str] = None

class SummaryResponse(BaseModel):
    summary: str
    tags: List[str]
    summary_type: str
    word_count: int

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None

class QuizRequest(BaseModel):
    text_content: str
    num_questions: int
    subject: str
    difficulty: str  # "easy", "medium", "hard"
    previous_score: Optional[int] = None

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
    total_questions: int
    difficulty: str
    subject: str
    estimated_time: int  # in minutes

class AnswerCheckRequest(BaseModel):
    user_answers: List[str]
    correct_answers: List[str]

class AnswerCheckResponse(BaseModel):
    score: float
    correct_answers: int
    total_questions: int
    feedback: str
    suggestion: str
    passed: bool

class Flashcard(BaseModel):
    front: str
    back: str
    category: Optional[str] = None

class FlashcardRequest(BaseModel):
    text_content: str
    num_cards: int
    subject: str
    card_type: str  # "definition", "concept", "fact", "mixed"

class FlashcardResponse(BaseModel):
    flashcards: List[Flashcard]
    total_cards: int
    subject: str
    card_type: str 