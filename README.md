# 🚀 QuizForge

**Don't just read. Remember.**

An AI-powered educational tool that transforms your study materials into interactive quizzes, comprehensive summaries, and engaging flashcards using cutting-edge AI technology.

![QuizForge Demo](https://img.shields.io/badge/Demo-Live-green) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-blue) ![Next.js](https://img.shields.io/badge/Next.js-Frontend-black) ![AI Powered](https://img.shields.io/badge/AI-Powered-purple)

## ✨ Features

### 🧠 **AI-Powered Study Tools**
- **PDF Upload & Processing**: Extract text from PDF documents automatically
- **Smart Summarization**: Generate bullet points, detailed summaries, or concise overviews
- **Interactive Quizzes**: Create multiple-choice questions with explanations
- **Flashcard Generation**: Build interactive flashcards with flip animations
- **Paste Text Support**: Work with any text content directly

### 📊 **Professional Quiz Interface**
- **Medical-Style Quiz Layout**: Single question display with progress tracking
- **Comprehensive Analytics**: Performance dashboards with detailed feedback
- **AI Grading System**: Intelligent feedback based on performance levels
- **Question Review**: Detailed breakdown of correct/incorrect answers with explanations

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Tabbed Interface**: Easy navigation between different study modes
- **Real-time Progress**: Visual indicators and completion tracking
- **Interactive Elements**: Hover effects, animations, and smooth transitions

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **OpenRouter API**: AI model integration with Qwen 3-32B from Cerebras
- **PyPDF2**: PDF text extraction
- **Uvicorn**: ASGI server for production deployment

### Frontend
- **Next.js 15**: React framework with Turbopack
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Custom UI Components**: Reusable component library

### AI Integration
- **Model**: Qwen 3-32B via Cerebras through OpenRouter
- **Capabilities**: Text analysis, question generation, summarization

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **OpenRouter API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quizforge.git
   cd quizforge
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the Development Servers**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000 (or next available port)
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🎯 Usage

### 1. **Generate Practice Tests**
- Upload PDF files or paste text content
- Configure quiz settings (difficulty, number of questions, subject)
- Take interactive quizzes with real-time feedback
- Review detailed performance analytics

### 2. **Create Flashcard Sets**
- Choose between PDF upload or text input
- Select card types (definitions, concepts, facts, mixed)
- Study with interactive flip cards
- Track learning progress

### 3. **Generate Summaries**
- Upload study materials
- Choose summary format (bullet points, detailed, short)
- Get AI-generated comprehensive summaries
- Export or save for later review

## 🔧 API Endpoints

### Core Endpoints
- `POST /upload-pdf` - Upload and process PDF files
- `POST /generate-summary` - Create AI-powered summaries
- `POST /generate-quiz` - Generate interactive quizzes
- `POST /generate-flashcards` - Create flashcard sets
- `POST /check-answers` - Grade quiz submissions
- `GET /health` - Health check endpoint

### Example API Usage
```python
import requests

# Upload PDF
files = {'file': open('document.pdf', 'rb')}
response = requests.post('http://localhost:8000/upload-pdf', files=files)

# Generate Quiz
quiz_data = {
    "text_content": "Your study material here...",
    "num_questions": 5,
    "subject": "Biology",
    "difficulty": "medium"
}
response = requests.post('http://localhost:8000/generate-quiz', json=quiz_data)
```

## 🏗️ Project Structure

```
quizforge/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Pydantic models
│   │   ├── ai_service.py    # AI integration logic
│   │   └── utils.py         # Utility functions
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility libraries
│   │   └── types/         # TypeScript type definitions
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind configuration
└── README.md              # Project documentation
```

## 🌟 Key Features in Detail

### AI-Powered Content Generation
- **Context-Aware**: Understands content structure and generates relevant questions
- **Adaptive Difficulty**: Adjusts question complexity based on selected difficulty level
- **Comprehensive Explanations**: Provides detailed explanations for learning reinforcement

### Professional Quiz Interface
- **Single Question Display**: Focus on one question at a time
- **Progress Tracking**: Visual progress indicators and question counters
- **Intelligent Navigation**: Smart previous/next button logic
- **Performance Analytics**: Detailed performance breakdowns and improvement suggestions

### Interactive Flashcards
- **3D Flip Animation**: Smooth card flip transitions
- **Categorized Content**: Organized by subject and card type
- **Responsive Design**: Works perfectly on all screen sizes

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests, create issues, or suggest new features.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cerebras** for providing high-performance AI computing
- **OpenRouter** for AI model API access
- **Next.js Team** for the excellent React framework
- **FastAPI** for the intuitive Python web framework

## 📞 Support

If you encounter any issues or have questions:
- Create an [Issue](https://github.com/yourusername/quizforge/issues)
- Check the [Documentation](https://github.com/yourusername/quizforge/wiki)

---

Made with ❤️ for better learning experiences 