'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  FileText, 
  Brain, 
  Target,
  Upload
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const handleNavigateToUpload = () => {
    router.push('/upload')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <span className="text-xl font-bold text-blue-600">QuizForge</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Button 
                onClick={handleNavigateToUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
            <span className="text-gray-900">Don&apos;t just </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              read
            </span>
            <span className="text-gray-900">. </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Remember.
            </span>
            {/* <span className="text-gray-900">.</span> */}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            QuizForge turns dense study material into memory-boosting summaries and quizzes in seconds.
          </p>
        </div>
      </section>

      {/* Study Mode Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PDF Upload Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToUpload}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">PDF Upload</h3>
                <div className="bg-white/20 rounded-lg p-4 mt-4">
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 opacity-80" />
                    <span className="text-xs">Upload & Convert</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flashcards Card */}
            <Card className="bg-gradient-to-br from-cyan-400 to-cyan-500 border-0 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToUpload}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flashcards</h3>
                <div className="bg-white/20 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Study Cards</span>
                    <div className="w-12 h-8 bg-white/30 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paste Text Card */}
            <Card className="bg-gradient-to-br from-pink-400 to-pink-500 border-0 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToUpload}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Paste Text</h3>
                <div className="bg-white/20 rounded-lg p-4 mt-4">
                  <div className="mb-2">
                    <span className="text-sm font-medium">Text Input</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">Quick</span>
                    <span className="text-xs border-b border-white/50">Generate</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Practice Tests Card */}
            <Card className="bg-gradient-to-br from-orange-400 to-orange-500 border-0 text-white hover:shadow-lg transition-shadow cursor-pointer" onClick={handleNavigateToUpload}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Practice Tests</h3>
                <div className="bg-white/20 rounded-lg p-4 mt-4">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>Score: <span className="font-bold">84%</span></div>
                    <div>Results: <span className="font-bold">76/90</span></div>
                    <div>Time: <span className="font-bold">70m</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ultimate Study App Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Every class, every test, one ultimate study app
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Create your own study materials or upload PDFs to generate AI-powered summaries and quizzes. Study them anytime, anywhere with our smart learning platform.
              </p>
            </div>
            <div className="bg-blue-600 rounded-2xl p-8 text-white">
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🌍</span>
                  <span className="text-gray-700 text-sm">World map</span>
                </div>
                <div className="bg-gray-100 rounded p-3">
                  <div className="text-gray-700 text-sm">South Africa</div>
                  <div className="w-16 h-12 bg-green-200 rounded mt-2"></div>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <span className="text-xs">Study suggestions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PDF to Study Materials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-pink-500 rounded-2xl p-8 text-white">
              <div className="bg-white rounded-lg p-6">
                <div className="mb-4">
                  <div className="text-pink-600 font-medium text-sm mb-2">📋 Study Guides</div>
                  <h3 className="text-gray-900 font-bold text-lg">Biology 101</h3>
                </div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">Key terms</div>
                    <div className="text-xs text-gray-500 mt-1">Mitosis - a type of cell division that produces genetically identical</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">Interphase</div>
                    <div className="text-xs text-gray-500 mt-1">The cell prepares for mitosis by duplicating its DNA during</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Make class material instantly studiable
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Turn your slides, videos, and notes into flashcard sets, practice tests, and study guides with AI.
              </p>
              <Button 
                onClick={handleNavigateToUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Try it out
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Test Prep Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Test prep for any subject
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Memorize anything with personalized practice tests and study sessions. 98% of students say QuizForge has improved their understanding.
              </p>
              <Button 
                onClick={handleNavigateToUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Get started
              </Button>
            </div>
            <div className="bg-cyan-400 rounded-2xl p-8">
              <div className="bg-white rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-xs">📚</span>
                    </div>
                    <span className="font-medium">Learn</span>
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">Tree</h3>
                    <div className="text-green-600 font-medium text-sm">Awesome!</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-100 p-2 rounded">Tierra</div>
                    <div className="bg-gray-100 p-2 rounded">Hoja</div>
                    <div className="bg-gray-100 p-2 rounded">Raíz</div>
                    <div className="bg-green-100 border-2 border-green-500 p-2 rounded">✓ Árbol</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 mt-4">
                <div className="text-white text-xs">
                  <div className="flex justify-between mb-2">
                    <span>Multiple Choice</span>
                    <span>🔘</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Written</span>
                    <span>⚪</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flashcards</span>
                    <span>⚪</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-xl font-bold">QuizForge</span>
          </div>
          <p className="text-gray-400 mb-2">
            AI-powered learning platform for the modern student
          </p>
          <p className="text-sm text-gray-500">
            © 2025 QuizForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
} 