import os
import requests
import json
import re
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class QuizForgeAI:
    def __init__(self):
        self.api_key = os.getenv('API_KEY')
        if not self.api_key:
            raise ValueError("API_KEY environment variable is required")
        
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        self.base_system_message = "You are QuizForge AI, an expert educational assistant specialized in creating summaries and quizzes from academic content. Always provide accurate, well-structured responses."
    
    async def _make_request(self, messages: List[Dict]) -> str:
        """Make a request to the OpenRouter API"""
        data = {
            "model": "qwen/qwen3-32b",
            "provider": {
                "only": ["Cerebras"]
            },
            "messages": messages
        }
        
        try:
            response = requests.post(self.url, headers=self.headers, json=data)
            response.raise_for_status()
            response_data = response.json()
            return response_data["choices"][0]["message"]["content"]
        except Exception as e:
            raise Exception(f"API request failed: {str(e)}")
    
    async def generate_summary(self, text_content: str, summary_type: str, subject: Optional[str] = None) -> Dict:
        """Generate a summary based on the specified type"""
        
        # Truncate content if too long (approximate token limit)
        max_chars = 15000  # Rough estimate for token limits
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "..."
        
        subject_context = f" in the field of {subject}" if subject else ""
        
        if summary_type == "short":
            prompt = f"""Create a concise summary of the following text{subject_context}. 
            Keep it to 2-3 paragraphs maximum, focusing on the most important points.
            
            Text: {text_content}
            
            Provide your response in this JSON format:
            {{
                "content": "your summary here",
                "tags": ["key", "topic", "tags"]
            }}"""
        
        elif summary_type == "bullet_points":
            prompt = f"""Create a bullet-point summary of the following text{subject_context}.
            Organize key points into clear, actionable bullet points with sub-points where needed.
            
            Text: {text_content}
            
            Provide your response in this JSON format:
            {{
                "content": "• Main point 1\\n  - Sub-point\\n• Main point 2\\n  - Sub-point",
                "tags": ["key", "topic", "tags"]
            }}"""
        
        elif summary_type == "detailed":
            prompt = f"""Create a comprehensive, detailed summary of the following text{subject_context}.
            Include all major concepts, methodologies, findings, and conclusions.
            Organize into clear sections with headings.
            
            Text: {text_content}
            
            Provide your response in this JSON format:
            {{
                "content": "your detailed summary with sections and headings",
                "tags": ["key", "topic", "tags"]
            }}"""
        
        messages = [
            {"role": "system", "content": self.base_system_message},
            {"role": "user", "content": prompt}
        ]
        
        response = await self._make_request(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback if JSON parsing fails
                return {
                    "content": response,
                    "tags": ["general", "summary"]
                }
        except json.JSONDecodeError:
            return {
                "content": response,
                "tags": ["general", "summary"]
            }
    
    async def generate_quiz(self, text_content: str, num_questions: int, subject: str, difficulty: str) -> Dict:
        """Generate a quiz based on the text content"""
        
        # Truncate content if too long
        max_chars = 12000  # Leave room for the prompt
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "..."
        
        difficulty_instructions = {
            "easy": "Focus on basic concepts, definitions, and straightforward facts. Avoid complex reasoning.",
            "medium": "Include some analysis and application questions. Mix factual and conceptual questions.",
            "hard": "Focus on critical thinking, analysis, synthesis, and complex problem-solving."
        }
        
        prompt = f"""Create a {difficulty} level quiz with {num_questions} multiple-choice questions based on the following {subject} content.

        Difficulty level: {difficulty}
        Instructions: {difficulty_instructions[difficulty]}
        
        Content: {text_content}
        
        For each question:
        1. Create a clear, specific question
        2. Provide 4 answer options (A, B, C, D)
        3. Mark the correct answer
        4. Optionally provide a brief explanation
        
        Provide your response in this JSON format:
        {{
            "questions": [
                {{
                    "question": "What is...?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option B",
                    "explanation": "Brief explanation of why this is correct"
                }}
            ]
        }}
        
        Ensure questions are directly based on the provided content and test understanding rather than memorization."""
        
        messages = [
            {"role": "system", "content": self.base_system_message},
            {"role": "user", "content": prompt}
        ]
        
        response = await self._make_request(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                quiz_data = json.loads(json_match.group())
                
                # Validate and limit questions to requested number
                if "questions" in quiz_data and isinstance(quiz_data["questions"], list):
                    quiz_data["questions"] = quiz_data["questions"][:num_questions]
                    return quiz_data
                else:
                    raise ValueError("Invalid quiz format")
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: create a simple question if parsing fails
            return {
                "questions": [{
                    "question": "Based on the content provided, what was the main topic discussed?",
                    "options": ["Topic A", "Topic B", "Topic C", "Topic D"],
                    "correct_answer": "Topic A",
                    "explanation": "This question requires manual review as AI parsing failed."
                }]
            }
    
    async def extract_key_topics(self, text_content: str) -> List[str]:
        """Extract key topics from text content for tagging"""
        prompt = f"""Analyze the following text and extract 5-8 key topics or themes.
        Return only the topics as a comma-separated list.
        
        Text: {text_content[:5000]}...
        
        Topics:"""
        
        messages = [
            {"role": "system", "content": self.base_system_message},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self._make_request(messages)
            topics = [topic.strip() for topic in response.split(',')]
            return topics[:8]  # Limit to 8 topics
        except:
            return ["general"]

    async def generate_flashcards(self, text_content: str, num_cards: int, subject: str, card_type: str) -> Dict:
        """Generate flashcards based on the text content"""
        
        # Truncate content if too long
        max_chars = 12000
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "..."
        
        card_type_instructions = {
            "definition": "Create cards with terms/concepts on the front and their definitions on the back.",
            "concept": "Create cards with conceptual questions on the front and explanations on the back.",
            "fact": "Create cards with factual questions on the front and specific answers on the back.",
            "mixed": "Create a mix of definitions, concepts, and factual questions."
        }
        
        prompt = f"""Create {num_cards} flashcards based on the following {subject} content.

        Card type: {card_type}
        Instructions: {card_type_instructions[card_type]}
        
        Content: {text_content}
        
        For each flashcard:
        1. Front: Question, term, or concept
        2. Back: Answer, definition, or explanation
        3. Keep both sides concise but informative
        4. Ensure the back fully answers what's on the front
        
        Provide your response in this JSON format:
        {{
            "flashcards": [
                {{
                    "front": "What is photosynthesis?",
                    "back": "The process by which plants convert light energy into chemical energy",
                    "category": "Biology"
                }}
            ]
        }}
        
        Make sure flashcards are directly based on the provided content and test key concepts."""
        
        messages = [
            {"role": "system", "content": self.base_system_message},
            {"role": "user", "content": prompt}
        ]
        
        response = await self._make_request(messages)
        
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                flashcard_data = json.loads(json_match.group())
                
                # Validate and limit flashcards to requested number
                if "flashcards" in flashcard_data and isinstance(flashcard_data["flashcards"], list):
                    flashcard_data["flashcards"] = flashcard_data["flashcards"][:num_cards]
                    return flashcard_data
                else:
                    raise ValueError("Invalid flashcard format")
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback: create a simple flashcard if parsing fails
            return {
                "flashcards": [{
                    "front": "Main topic",
                    "back": "Based on the content provided, this requires manual review as AI parsing failed.",
                    "category": subject
                }]
            } 