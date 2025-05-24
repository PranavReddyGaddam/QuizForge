from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
from typing import Optional, List
from pydantic import BaseModel
import fitz  # PyMuPDF
from dotenv import load_dotenv

from .ai_service import QuizForgeAI
from .models import SummaryRequest, QuizRequest, QuizResponse, SummaryResponse, FlashcardRequest, FlashcardResponse

# Load environment variables
load_dotenv()

app = FastAPI(title="QuizForge API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI service
ai_service = QuizForgeAI()

@app.get("/")
async def root():
    return {"message": "QuizForge API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "QuizForge API"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and extract text from PDF"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Save uploaded file temporarily
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text from PDF
        text_content = extract_text_from_pdf(file_path)
        
        # Clean up temporary file
        os.remove(file_path)
        
        return {
            "filename": file.filename,
            "text_content": text_content,
            "word_count": len(text_content.split())
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/generate-summary", response_model=SummaryResponse)
async def generate_summary(
    text_content: str = Form(...),
    summary_type: str = Form(...),  # "short", "bullet_points", "detailed"
    subject: Optional[str] = Form(None)
):
    """Generate summary from text content"""
    try:
        summary = await ai_service.generate_summary(
            text_content=text_content,
            summary_type=summary_type,
            subject=subject
        )
        
        return SummaryResponse(
            summary=summary["content"],
            tags=summary.get("tags", []),
            summary_type=summary_type,
            word_count=len(summary["content"].split())
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/generate-quiz", response_model=QuizResponse)
async def generate_quiz(
    text_content: str = Form(...),
    num_questions: int = Form(...),
    subject: str = Form(...),
    difficulty: str = Form(...),  # "easy", "medium", "hard"
    previous_score: Optional[int] = Form(None)
):
    """Generate quiz from text content with adaptive difficulty"""
    try:
        # Adaptive difficulty logic
        adjusted_difficulty = difficulty
        if previous_score is not None:
            if previous_score < 60:
                adjusted_difficulty = "easy" if difficulty != "easy" else "easy"
            elif previous_score > 90:
                adjusted_difficulty = "hard" if difficulty != "hard" else "hard"
        
        quiz = await ai_service.generate_quiz(
            text_content=text_content,
            num_questions=num_questions,
            subject=subject,
            difficulty=adjusted_difficulty
        )
        
        return QuizResponse(
            questions=quiz["questions"],
            total_questions=len(quiz["questions"]),
            difficulty=adjusted_difficulty,
            subject=subject,
            estimated_time=len(quiz["questions"]) * 2  # 2 minutes per question
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")

@app.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    text_content: str = Form(...),
    num_cards: int = Form(...),
    subject: str = Form(...),
    card_type: str = Form(...)  # "definition", "concept", "fact", "mixed"
):
    """Generate flashcards from text content"""
    try:
        flashcards = await ai_service.generate_flashcards(
            text_content=text_content,
            num_cards=num_cards,
            subject=subject,
            card_type=card_type
        )
        
        return FlashcardResponse(
            flashcards=flashcards["flashcards"],
            total_cards=len(flashcards["flashcards"]),
            subject=subject,
            card_type=card_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")

@app.post("/check-answers")
async def check_answers(
    user_answers: List[str] = Form(...),
    correct_answers: List[str] = Form(...)
):
    """Check user answers and provide score"""
    try:
        if len(user_answers) != len(correct_answers):
            raise HTTPException(status_code=400, detail="Answer count mismatch")
        
        correct_count = sum(1 for user, correct in zip(user_answers, correct_answers) 
                          if user.strip().lower() == correct.strip().lower())
        
        total_questions = len(correct_answers)
        score = (correct_count / total_questions) * 100
        
        # Generate performance feedback
        if score >= 90:
            feedback = "Excellent work! You've mastered this material."
            suggestion = "Consider trying a harder difficulty level."
        elif score >= 70:
            feedback = "Good job! You have a solid understanding."
            suggestion = "Review the areas you missed and try again."
        elif score >= 50:
            feedback = "You're getting there! Keep studying."
            suggestion = "Consider reviewing the material again or trying an easier difficulty."
        else:
            feedback = "Don't worry, this is part of learning!"
            suggestion = "Try reviewing the summary again and attempt an easier quiz."
        
        return {
            "score": score,
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "feedback": feedback,
            "suggestion": suggestion,
            "passed": score >= 60
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking answers: {str(e)}")

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file"""
    try:
        doc = fitz.open(file_path)
        text_content = ""
        
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text_content += page.get_text()
        
        doc.close()
        return text_content.strip()
    
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 