'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { api, APIError } from '@/lib/api'
import { 
  SummaryResponse, 
  QuizResponse, 
  QuizResult, 
  SummaryType, 
  Difficulty, 
  UserAnswer,
  FlashcardResponse,
  CardType
} from '@/types'
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  RotateCcw, 
  BookOpen,
  ArrowLeft,
  File,
  Presentation
} from 'lucide-react'

interface QuizForgeAppProps {
  initialStep?: 'upload' | 'configure' | 'results'
}

export default function QuizForgeApp({ initialStep = 'upload' }: QuizForgeAppProps) {
  const router = useRouter()
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State management
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState<string>('')
  const [pastedText, setPastedText] = useState<string>('')
  const [flashcardPdfFile, setFlashcardPdfFile] = useState<File | null>(null)
  const [flashcardPdfContent, setFlashcardPdfContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [flashcards, setFlashcards] = useState<FlashcardResponse | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'results'>(initialStep)
  const [activeTab, setActiveTab] = useState('upload-files')
  const [flashcardActiveTab, setFlashcardActiveTab] = useState('upload-pdf')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  // Form data
  const [formData, setFormData] = useState({
    numQuestions: 5,
    numCards: 10,
    subject: 'General',
    difficulty: 'medium' as Difficulty,
    summaryType: 'bullet_points' as SummaryType,
    cardType: 'mixed' as CardType
  })

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    console.log('📁 File selected:', selectedFile?.name, selectedFile?.size, selectedFile?.type)
    
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    setFile(selectedFile)
    setError('')
    setLoading(true)

    try {
      console.log('📡 Starting PDF upload to backend...')
      const result = await api.uploadPDF(selectedFile)
      console.log('✅ PDF upload successful:', result)
      console.log('📝 Text content length:', result.text_content?.length)
      
      setTextContent(result.text_content)
      setCurrentStep('configure')
    } catch (err) {
      console.error('❌ PDF upload failed:', err)
      console.error('❌ Error details:', {
        message: err instanceof APIError ? err.message : 'Failed to upload PDF',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      })
      setError(err instanceof APIError ? err.message : 'Failed to upload PDF')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    console.log('🔥 Generate button clicked!')
    console.log('📝 Text content exists:', !!textContent)
    console.log('📝 Text content length:', textContent?.length)
    
    if (!textContent) {
      console.log('❌ No text content, aborting')
      return
    }

    console.log('🚀 Starting generation process...')
    setLoading(true)
    setError('')

    try {
      console.log('📡 Making API calls to backend...')
      // Generate summary and quiz in parallel
      const [summaryResult, quizResult] = await Promise.all([
        api.generateSummary(textContent, formData.summaryType, formData.subject),
        api.generateQuiz(
          textContent, 
          formData.numQuestions, 
          formData.subject, 
          formData.difficulty
        )
      ])

      console.log('✅ API calls successful:', { summaryResult, quizResult })
      setSummary(summaryResult)
      setQuiz(quizResult)
      setCurrentStep('results')
      setUserAnswers([])
      setQuizResult(null)
      
      // Update URL to reflect quiz state
      router.push('/upload?step=results')
    } catch (err) {
      console.error('❌ API calls failed:', err)
      setError(err instanceof APIError ? err.message : 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }, [textContent, formData, router])

  const handleAnswerSelect = useCallback((questionIndex: number, selectedOption: string) => {
    setUserAnswers(prev => {
      const updated = prev.filter(a => a.questionIndex !== questionIndex)
      return [...updated, { questionIndex, selectedOption }]
    })
  }, [])

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz || userAnswers.length !== quiz.questions.length) return

    setLoading(true)

    try {
      const answers = quiz.questions.map((_, index) => {
        const userAnswer = userAnswers.find(a => a.questionIndex === index)
        return userAnswer?.selectedOption || ''
      })

      const correctAnswers = quiz.questions.map(q => q.correct_answer)
      const result = await api.checkAnswers(answers, correctAnswers)
      setQuizResult(result)
    } catch (err) {
      setError(err instanceof APIError ? err.message : 'Failed to check answers')
    } finally {
      setLoading(false)
    }
  }, [quiz, userAnswers])

  const resetApp = useCallback(() => {
    setFile(null)
    setTextContent('')
    setPastedText('')
    setFlashcardPdfFile(null)
    setFlashcardPdfContent('')
    setSummary(null)
    setQuiz(null)
    setFlashcards(null)
    setQuizResult(null)
    setUserAnswers([])
    setCurrentStep('upload')
    setActiveTab('upload-files')
    setError('')
    
    // Reset URL to upload page
    router.push('/upload')
  }, [router])

  // Add separate reset function for flashcards
  const resetFlashcards = useCallback(() => {
    setFlashcards(null)
    setPastedText('')
    setFlashcardPdfFile(null)
    setFlashcardPdfContent('')
    setError('')
  }, [])

  // Add helper function to format summary content
  const formatSummaryContent = (content: string, summaryType: SummaryType) => {
    // First, try to parse if content is JSON string
    let actualContent = content
    
    try {
      // Handle different JSON structures that might be returned
      if (content.trim().startsWith('{')) {
        const parsed = JSON.parse(content)
        if (parsed.content) {
          actualContent = parsed.content
        } else if (typeof parsed === 'string') {
          actualContent = parsed
        }
      } else {
        // Check if content contains JSON structure within it
        const jsonMatch = content.match(/\{"content":\s*"([^"]+)"/);
        if (jsonMatch) {
          actualContent = jsonMatch[1];
        }
      }
    } catch {
      // If JSON parsing fails, try to extract content manually
      const contentMatch = content.match(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/)
      if (contentMatch) {
        actualContent = contentMatch[1]
      } else {
        // Remove any remaining JSON-like structures
        actualContent = content.replace(/^\s*\{\s*"content":\s*"/, '').replace(/"[^}]*\}\s*$/, '')
      }
    }

    // Replace escaped newlines and quotes
    actualContent = actualContent.replace(/\\n/g, '\n').replace(/\\"/g, '"')

    // Remove any remaining JSON artifacts
    actualContent = actualContent.replace(/^[{"]/, '').replace(/[}"]$/, '')

    // Helper function to convert markdown text to JSX
    const convertMarkdownToJSX = (text: string) => {
      // Convert **bold** to <strong>
      const parts = text.split(/(\*\*.*?\*\*)/g)
      return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })
    }

    if (summaryType === 'detailed') {
      // Format detailed summaries with better structure
      return actualContent
        .split('\n\n')
        .map((paragraph, index) => {
          const trimmedParagraph = paragraph.trim()
          
          // Check if it's a heading (starts with ### or ##)
          if (trimmedParagraph.startsWith('###')) {
            return (
              <h4 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">
                {convertMarkdownToJSX(trimmedParagraph.replace(/^#+\s*/, ''))}
              </h4>
            )
          }
          if (trimmedParagraph.startsWith('##')) {
            return (
              <h3 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4">
                {convertMarkdownToJSX(trimmedParagraph.replace(/^#+\s*/, ''))}
              </h3>
            )
          }
          if (trimmedParagraph.startsWith('#')) {
            return (
              <h2 key={index} className="text-2xl font-bold text-gray-900 mt-10 mb-5">
                {convertMarkdownToJSX(trimmedParagraph.replace(/^#+\s*/, ''))}
              </h2>
            )
          }
          
          // Check if it's a bullet point section
          if (trimmedParagraph.includes('- ') || trimmedParagraph.includes('• ')) {
            const items = trimmedParagraph
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^[-•]\s*/, '').trim())
              .filter(item => item)
            
            return (
              <ul key={index} className="list-disc list-inside space-y-2 my-4 ml-4">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700 leading-relaxed">
                    {convertMarkdownToJSX(item)}
                  </li>
                ))}
              </ul>
            )
          }
          
          // Check if it's a numbered list
          if (trimmedParagraph.match(/^\d+\./)) {
            const items = trimmedParagraph
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^\d+\.\s*/, '').trim())
              .filter(item => item)
            
            return (
              <ol key={index} className="list-decimal list-inside space-y-2 my-4 ml-4">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-gray-700 leading-relaxed">
                    {convertMarkdownToJSX(item)}
                  </li>
                ))}
              </ol>
            )
          }
          
          // Regular paragraph
          if (trimmedParagraph) {
            return (
              <p key={index} className="text-gray-700 leading-relaxed mb-4 text-justify">
                {convertMarkdownToJSX(trimmedParagraph)}
              </p>
            )
          }
          
          return null
        })
        .filter(Boolean)
    } else if (summaryType === 'bullet_points') {
      // Format bullet points
      const points = actualContent
        .split('\n')
        .filter(line => line.trim() && (line.includes('- ') || line.includes('• ')))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
      
      return (
        <ul className="list-disc list-inside space-y-3 ml-2">
          {points.map((point, index) => (
            <li key={index} className="text-gray-700 leading-relaxed">
              {convertMarkdownToJSX(point)}
            </li>
          ))}
        </ul>
      )
    } else {
      // Default formatting for short summaries
      return actualContent
        .split('\n\n')
        .filter(para => para.trim())
        .map((paragraph, index) => (
          <p key={index} className="text-gray-700 leading-relaxed mb-4 text-justify">
            {convertMarkdownToJSX(paragraph.trim())}
          </p>
        ))
    }
  }

  const renderUploadStep = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <span className="text-xl font-semibold text-blue-600">QuizForge</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  // Reset all state and reload the page
                  resetApp()
                  window.location.reload()
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate a practice test
          </h1>
          <p className="text-lg text-gray-600">
            Choose or upload materials to generate practice questions designed for you
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100">
            <TabsTrigger value="flashcard-sets" className="text-sm">Flashcard sets</TabsTrigger>
            <TabsTrigger value="upload-files" className="text-sm">Upload files</TabsTrigger>
            <TabsTrigger value="paste-text" className="text-sm">Paste text</TabsTrigger>
            <TabsTrigger value="google-drive" className="text-sm">Google Drive</TabsTrigger>
          </TabsList>

          {/* Upload Files Tab */}
          <TabsContent value="upload-files" className="space-y-8">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-gray-400 transition-colors bg-white">
              {/* File Type Icons */}
              <div className="flex justify-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <File className="h-6 w-6 text-blue-600" />
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Presentation className="h-6 w-6 text-orange-600" />
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Drag and drop notes, readings, lecture slides, etc.
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Supported file types are .docx, .pdf, .pptx
              </p>

              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button 
                  variant="outline" 
                  className="mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse files
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </Label>

              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">{file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              )}

              {loading && (
                <div className="mt-4">
                  <Progress value={50} className="w-64 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">Processing file...</p>
                </div>
              )}
            </div>

            {/* Sample Text Button for Testing */}
            <div className="text-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('📝 Loading sample text...');
                  setTextContent('Photosynthesis is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. This process occurs in two main stages: the light-dependent reactions and the Calvin cycle. The light-dependent reactions take place in the thylakoid membranes of chloroplasts. During this stage, chlorophyll absorbs light energy, which excites electrons. These high-energy electrons are passed through an electron transport chain, ultimately producing ATP and NADPH. Oxygen is released as a byproduct when water molecules are split. The Calvin cycle occurs in the stroma of chloroplasts. In this stage, carbon dioxide from the atmosphere is fixed into organic molecules using the ATP and NADPH produced in the light-dependent reactions. The key enzyme in this process is RuBisCO.');
                  setCurrentStep('configure');
                }}
                className="text-sm"
              >
                Load Sample Text (for testing)
              </Button>
              
              <Button 
                variant="outline" 
                onClick={async () => {
                  console.log('🔍 Testing backend connection...');
                  try {
                    const result = await api.healthCheck();
                    console.log('✅ Health check successful:', result);
                    alert('Backend is healthy: ' + JSON.stringify(result));
                  } catch (err) {
                    console.error('❌ Health check failed:', err);
                    alert('Backend connection failed: ' + err);
                  }
                }}
                className="text-sm"
              >
                Test Backend Connection
              </Button>
            </div>
          </TabsContent>

          {/* Other Tabs - Placeholder */}
          <TabsContent value="flashcard-sets" className="py-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Flashcard Set
                </h3>
                <p className="text-lg text-gray-600">
                  Generate interactive flashcards from your study materials
                </p>
              </div>

              {/* Flashcard Tabs */}
              <Tabs value={flashcardActiveTab} onValueChange={setFlashcardActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="upload-pdf">Upload PDF</TabsTrigger>
                  <TabsTrigger value="paste-text">Paste Text</TabsTrigger>
                </TabsList>

                {/* Upload PDF Tab */}
                <TabsContent value="upload-pdf" className="space-y-6">
                  {!flashcardPdfContent ? (
                    // PDF Upload Area
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors bg-white">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Upload your PDF
                      </h4>
                      <p className="text-sm text-gray-500 mb-6">
                        Drag and drop or click to browse
                      </p>
                      
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const selectedFile = e.target.files?.[0]
                          if (!selectedFile) return

                          if (selectedFile.type !== 'application/pdf') {
                            setError('Please select a PDF file')
                            return
                          }

                          setFlashcardPdfFile(selectedFile)
                          setError('')
                          setLoading(true)

                          try {
                            const result = await api.uploadPDF(selectedFile)
                            setFlashcardPdfContent(result.text_content)
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to upload PDF')
                          } finally {
                            setLoading(false)
                          }
                        }}
                        className="hidden"
                        id="flashcard-pdf-input"
                        disabled={loading}
                      />
                      
                      <Label htmlFor="flashcard-pdf-input" className="cursor-pointer">
                        <Button variant="outline" asChild>
                          <span>
                            {loading ? (
                              <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-600 border-t-transparent rounded-full" />
                                Processing...
                              </>
                            ) : (
                              'Browse Files'
                            )}
                          </span>
                        </Button>
                      </Label>

                      {flashcardPdfFile && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700">{flashcardPdfFile.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {(flashcardPdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Configuration and Generation Interface
                    <div>
                      <div className="mb-6 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="h-5 w-5" />
                          <span className="font-medium">PDF processed successfully</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                          {flashcardPdfContent.length} characters extracted • Ready to generate flashcards
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Subject</Label>
                          <Select 
                            value={formData.subject} 
                            onValueChange={(value) => 
                              setFormData(prev => ({ ...prev, subject: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Biology">Biology</SelectItem>
                              <SelectItem value="Chemistry">Chemistry</SelectItem>
                              <SelectItem value="Physics">Physics</SelectItem>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="History">History</SelectItem>
                              <SelectItem value="Literature">Literature</SelectItem>
                              <SelectItem value="Economics">Economics</SelectItem>
                              <SelectItem value="Law">Law</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Card Type</Label>
                          <Select 
                            value={formData.cardType} 
                            onValueChange={(value: CardType) => 
                              setFormData(prev => ({ ...prev, cardType: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="definition">Definitions</SelectItem>
                              <SelectItem value="concept">Concepts</SelectItem>
                              <SelectItem value="fact">Facts</SelectItem>
                              <SelectItem value="mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Number of Cards</Label>
                          <Select 
                            value={formData.numCards.toString()} 
                            onValueChange={(value) => 
                              setFormData(prev => ({ ...prev, numCards: parseInt(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 10, 15, 20, 25, 30].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num} cards</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFlashcardPdfFile(null)
                            setFlashcardPdfContent('')
                            setFlashcards(null)
                          }}
                        >
                          Upload Different PDF
                        </Button>
                        
                        <Button
                          onClick={async () => {
                            setFlashcards(null)
                            setError('')
                            setLoading(true)

                            try {
                              const flashcardsResult = await api.generateFlashcards(
                                flashcardPdfContent,
                                formData.numCards,
                                formData.subject,
                                formData.cardType
                              )
                              setFlashcards(flashcardsResult)
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                              Generating...
                            </>
                          ) : (
                            'Generate Flashcards'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Paste Text Tab */}
                <TabsContent value="paste-text" className="space-y-6">
                  <div>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Enter or paste your study material here... (e.g., lecture notes, definitions, concepts)"
                      className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                      disabled={loading}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Subject</Label>
                        <Select 
                          value={formData.subject} 
                          onValueChange={(value) => 
                            setFormData(prev => ({ ...prev, subject: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="History">History</SelectItem>
                            <SelectItem value="Literature">Literature</SelectItem>
                            <SelectItem value="Economics">Economics</SelectItem>
                            <SelectItem value="Law">Law</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Card Type</Label>
                        <Select 
                          value={formData.cardType} 
                          onValueChange={(value: CardType) => 
                            setFormData(prev => ({ ...prev, cardType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="definition">Definitions</SelectItem>
                            <SelectItem value="concept">Concepts</SelectItem>
                            <SelectItem value="fact">Facts</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Number of Cards</Label>
                        <Select 
                          value={formData.numCards.toString()} 
                          onValueChange={(value) => 
                            setFormData(prev => ({ ...prev, numCards: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 25, 30].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} cards</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        {pastedText.length > 0 && (
                          <span>{pastedText.length} characters • {pastedText.split(/\s+/).filter(word => word.length > 0).length} words</span>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPastedText('Photosynthesis is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. This process occurs in two main stages: the light-dependent reactions and the Calvin cycle. The light-dependent reactions take place in the thylakoid membranes of chloroplasts. During this stage, chlorophyll absorbs light energy, which excites electrons. These high-energy electrons are passed through an electron transport chain, ultimately producing ATP and NADPH. Oxygen is released as a byproduct when water molecules are split. The Calvin cycle occurs in the stroma of chloroplasts. In this stage, carbon dioxide from the atmosphere is fixed into organic molecules using the ATP and NADPH produced in the light-dependent reactions. The key enzyme in this process is RuBisCO.')
                          }}
                          className="text-sm"
                        >
                          Load Sample
                        </Button>
                        
                        <Button
                          onClick={async () => {
                            if (!pastedText.trim()) {
                              setError('Please enter some text content')
                              return
                            }

                            setFlashcards(null)
                            setError('')
                            setLoading(true)

                            try {
                              const flashcardsResult = await api.generateFlashcards(
                                pastedText.trim(),
                                formData.numCards,
                                formData.subject,
                                formData.cardType
                              )
                              setFlashcards(flashcardsResult)
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
                            } finally {
                              setLoading(false)
                            }
                          }}
                          disabled={!pastedText.trim() || loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                              Generating...
                            </>
                          ) : (
                            'Generate Flashcards'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Display Generated Flashcards */}
              {flashcards && (
                <div className="mt-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Your Flashcard Set</h3>
                        <p className="text-sm text-gray-600">
                          {flashcards.total_cards} {flashcards.card_type} flashcards • Click to flip
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={resetFlashcards}
                        size="sm"
                      >
                        Create New Set
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.flashcards.map((card, index) => (
                        <FlashcardItem key={index} card={card} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paste-text" className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Paste Text Content
                </h3>
                <p className="text-sm text-gray-500">
                  Enter or paste your text content to generate study materials
                </p>
              </div>
              
              <div className="text-left">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your study material here... (e.g., lecture notes, textbook content, articles)"
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  disabled={loading}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="paste-subject" className="text-sm font-medium">Subject</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, subject: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Literature">Literature</SelectItem>
                        <SelectItem value="Economics">Economics</SelectItem>
                        <SelectItem value="Law">Law</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paste-summary-type" className="text-sm font-medium">Summary Format</Label>
                    <Select 
                      value={formData.summaryType} 
                      onValueChange={(value: SummaryType) => 
                        setFormData(prev => ({ ...prev, summaryType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (2-3 paragraphs)</SelectItem>
                        <SelectItem value="bullet_points">Bullet Points</SelectItem>
                        <SelectItem value="detailed">Detailed Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paste-num-questions" className="text-sm font-medium">Number of Questions</Label>
                    <Select 
                      value={formData.numQuestions.toString()} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, numQuestions: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} questions</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paste-difficulty" className="text-sm font-medium">Difficulty Level</Label>
                    <Select 
                      value={formData.difficulty} 
                      onValueChange={(value: Difficulty) => 
                        setFormData(prev => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Basic concepts)</SelectItem>
                        <SelectItem value="medium">Medium (Mixed)</SelectItem>
                        <SelectItem value="hard">Hard (Critical thinking)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    {pastedText.length > 0 && (
                      <span>{pastedText.length} characters • {pastedText.split(/\s+/).filter(word => word.length > 0).length} words</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPastedText('Photosynthesis is the process by which plants, algae, and some bacteria convert light energy, usually from the sun, into chemical energy stored in glucose. This process occurs in two main stages: the light-dependent reactions and the Calvin cycle. The light-dependent reactions take place in the thylakoid membranes of chloroplasts. During this stage, chlorophyll absorbs light energy, which excites electrons. These high-energy electrons are passed through an electron transport chain, ultimately producing ATP and NADPH. Oxygen is released as a byproduct when water molecules are split. The Calvin cycle occurs in the stroma of chloroplasts. In this stage, carbon dioxide from the atmosphere is fixed into organic molecules using the ATP and NADPH produced in the light-dependent reactions. The key enzyme in this process is RuBisCO.')
                      }}
                      className="text-sm"
                    >
                      Load Sample
                    </Button>
                    
                    <Button
                      onClick={async () => {
                        if (!pastedText.trim()) {
                          setError('Please enter some text content')
                          return
                        }

                        // Set the text content and move to configure step
                        setTextContent(pastedText.trim())
                        setCurrentStep('configure')
                        router.push('/upload?step=configure')
                      }}
                      disabled={!pastedText.trim() || loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Generate Study Materials
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="google-drive" className="text-center py-16">
            <div className="text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center opacity-50">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.5 7.5L12 16l5.5-8.5H6.5zM7.71 6h8.58l3.5 5.5H4.21L7.71 6zM12 18.5L4 7h16l-8 11.5z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Google Drive Integration</h3>
              <p className="text-sm text-gray-500 mb-4">Coming Soon</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Future feature: Connect your Google Drive account to access and generate study materials from your documents directly.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2025 QuizForge. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {/* Generate Button */}
      {textContent && (
        <div className="fixed bottom-6 right-6">
          <Button 
            onClick={() => {
              setCurrentStep('configure')
              router.push('/upload?step=configure')
            }}
            size="lg"
            className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full shadow-lg"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )

  const renderConfigureStep = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep('upload')
                  router.push('/upload')
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <span className="text-xl font-semibold text-blue-600">QuizForge</span>
              </div>
            </div>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  resetApp()
                  window.location.reload()
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customize your summary and quiz preferences
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="summary-type" className="text-sm font-medium">Summary Format</Label>
              <Select 
                value={formData.summaryType} 
                onValueChange={(value: SummaryType) => 
                  setFormData(prev => ({ ...prev, summaryType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (2-3 paragraphs)</SelectItem>
                  <SelectItem value="bullet_points">Bullet Points</SelectItem>
                  <SelectItem value="detailed">Detailed Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">Subject Area</Label>
              <Select 
                value={formData.subject} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, subject: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                  <SelectItem value="Economics">Economics</SelectItem>
                  <SelectItem value="Law">Law</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-questions" className="text-sm font-medium">Number of Questions</Label>
              <Select 
                value={formData.numQuestions.toString()} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, numQuestions: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm font-medium">Difficulty Level</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value: Difficulty) => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (Basic concepts)</SelectItem>
                  <SelectItem value="medium">Medium (Mixed)</SelectItem>
                  <SelectItem value="hard">Hard (Critical thinking)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </main>

      {/* Generate Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={handleGenerate}
          disabled={loading}
          size="lg"
          className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>
    </div>
  )

  // Results step (keeping the existing design for now)
  const renderResultsStep = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentStep('configure')
                  router.push('/upload?step=configure')
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
                <span className="text-xl font-semibold text-blue-600">QuizForge</span>
              </div>
            </div>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  resetApp()
                  window.location.reload()
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl p-4">
        <div className="space-y-6 mt-6">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">📋 Summary</TabsTrigger>
              <TabsTrigger value="quiz">🧠 Quiz</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {summary && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Generated Summary</h3>
                      <p className="text-sm text-gray-600">
                        {summary.summary_type.replace('_', ' ')} format • {summary.word_count} words
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {summary.summary_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="prose prose-gray max-w-none">
                    {summary.summary_type === 'detailed' ? (
                      <div className="space-y-2">
                        {formatSummaryContent(summary.summary, summary.summary_type as SummaryType)}
                      </div>
                    ) : summary.summary_type === 'bullet_points' ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {formatSummaryContent(summary.summary, summary.summary_type as SummaryType)}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formatSummaryContent(summary.summary, summary.summary_type as SummaryType)}
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4" />
                      <span>Key Topics:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4">
              {quiz && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {!quizResult ? (
                    <div className="space-y-6">
                      {/* Question Header */}
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <div className="text-sm text-gray-500">
                          Question {currentQuestionIndex + 1} of {quiz.questions.length}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userAnswers.length} of {quiz.questions.length} answered
                        </div>
                      </div>

                      {/* Current Question */}
                      {quiz.questions[currentQuestionIndex] && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 leading-relaxed mb-6">
                              {quiz.questions[currentQuestionIndex].question}
                            </h3>
                            
                            <div className="space-y-3">
                              {quiz.questions[currentQuestionIndex].options.map((option, optionIndex) => (
                                <label 
                                  key={optionIndex}
                                  className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="radio"
                                    name={`question-${currentQuestionIndex}`}
                                    value={option}
                                    onChange={() => handleAnswerSelect(currentQuestionIndex, option)}
                                    checked={userAnswers.find(a => a.questionIndex === currentQuestionIndex)?.selectedOption === option}
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-900 leading-relaxed">{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Navigation */}
                          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                              disabled={currentQuestionIndex === 0}
                              className="px-6"
                            >
                              Previous
                            </Button>
                            
                            {currentQuestionIndex === quiz.questions.length - 1 ? (
                              <Button 
                                onClick={handleSubmitQuiz}
                                disabled={loading || userAnswers.length !== quiz.questions.length}
                                className="bg-green-600 hover:bg-green-700 text-white px-8"
                              >
                                {loading ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                    Submitting...
                                  </>
                                ) : (
                                  'Submit Answers'
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                                className="px-6"
                              >
                                Next
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Performance Dashboard */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Performance Summary</h3>
                        
                        {/* Performance Analytics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                          {/* Performance by Category */}
                          <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center mb-3">
                              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                              <h4 className="font-medium text-gray-900">Performance by Category</h4>
                            </div>
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm">No categorized questions to display performance.</p>
                            </div>
                          </div>

                          {/* Performance by Difficulty */}
                          <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center mb-3">
                              <div className="w-3 h-3 bg-teal-500 rounded-full mr-2"></div>
                              <h4 className="font-medium text-gray-900">Performance by Difficulty</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Easy</span>
                                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                                  <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                                </div>
                                <span className="text-sm font-medium">75%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Medium</span>
                                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                                  <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.round(quizResult.score)}%`}}></div>
                                </div>
                                <span className="text-sm font-medium">{Math.round(quizResult.score)}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Hard</span>
                                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                                  <div className="bg-red-500 h-2 rounded-full" style={{width: '50%'}}></div>
                                </div>
                                <span className="text-sm font-medium">50%</span>
                              </div>
                            </div>
                          </div>

                          {/* Strengths vs. Improvements */}
                          <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex items-center mb-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                              <h4 className="font-medium text-gray-900">Strengths vs. Improvements</h4>
                            </div>
                            <div className="flex justify-center">
                              <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    strokeWidth="2"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                    strokeDasharray={`${quizResult.score}, 100`}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-900">{Math.round(quizResult.score)}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">Strengths</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                <span className="text-gray-600">Areas for Improvement</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Score */}
                        <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
                          <div className="text-4xl font-bold text-gray-900 mb-2">
                            {Math.round(quizResult.score)}%
                          </div>
                          <div className="text-gray-600 mb-4">
                            {quizResult.correct_answers} out of {quizResult.total_questions} correct answers
                          </div>
                          <Badge 
                            variant={quizResult.passed ? "default" : "destructive"} 
                            className="text-sm px-4 py-1"
                          >
                            {quizResult.passed ? "Passed" : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>

                      {/* AI Grading Feedback */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <div className="flex items-center mb-6">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 text-sm">🤖</span>
                          </div>
                          <h4 className="font-medium text-gray-900">AI Grading Feedback</h4>
                        </div>
                        
                        <div className="space-y-6">
                          {/* Overall Performance */}
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              Overall Performance
                            </h5>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-blue-800 text-sm leading-relaxed">
                                {quizResult.score >= 80 
                                  ? `The student's performance on this cardiovascular assessment reveals significant gaps in foundational knowledge of cardiac anatomy, ECG interpretation, and arrhythmia recognition. All three questions were answered incorrectly, indicating a lack of conceptual understanding of core cardiovascular physiology and clinical correlation. The errors suggest a pattern of confusion between cardiac chamber functions, coronary artery territories, and activation ECG features.`
                                  : quizResult.score >= 60
                                  ? `The student demonstrates moderate understanding of the subject matter with ${quizResult.correct_answers} out of ${quizResult.total_questions} questions answered correctly. There are clear areas of strength balanced with specific knowledge gaps that require targeted review and practice.`
                                  : `The student's performance indicates fundamental gaps in understanding key concepts. With ${quizResult.correct_answers} out of ${quizResult.total_questions} questions correct, comprehensive review of core material is recommended before advancing to more complex topics.`
                                }
                              </p>
                            </div>
                          </div>

                          {/* Strengths and Areas for Improvement */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Strengths */}
                            <div>
                              <h5 className="font-medium text-green-900 mb-3 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Strengths
                              </h5>
                              <div className="bg-green-50 p-4 rounded-lg">
                                <ul className="space-y-2 text-sm">
                                  {quizResult.score >= 80 ? (
                                    <>
                                      <li className="text-green-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Demonstrates strong analytical skills in complex problem-solving
                                      </li>
                                      <li className="text-green-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Shows excellent comprehension of foundational concepts
                                      </li>
                                      <li className="text-green-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Consistently applies knowledge accurately across question types
                                      </li>
                                    </>
                                  ) : quizResult.score >= 40 ? (
                                    <>
                                      <li className="text-green-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Shows understanding of basic concepts when properly focused
                                      </li>
                                      <li className="text-green-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Demonstrates willingness to engage with challenging material
                                      </li>
                                    </>
                                  ) : (
                                    <li className="text-green-800 flex items-start">
                                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      Shows effort in attempting all questions despite challenges
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            {/* Areas for Improvement */}
                            <div>
                              <h5 className="font-medium text-orange-900 mb-3 flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                Areas for Improvement
                              </h5>
                              <div className="bg-orange-50 p-4 rounded-lg">
                                <ul className="space-y-2 text-sm">
                                  {quizResult.score < 60 ? (
                                    <>
                                      <li className="text-orange-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Review fundamental concepts before advancing to complex topics
                                      </li>
                                      <li className="text-orange-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Focus on strengthening core knowledge through additional practice
                                      </li>
                                      <li className="text-orange-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Consider revisiting source materials and summary content
                                      </li>
                                    </>
                                  ) : quizResult.score < 80 ? (
                                    <>
                                      <li className="text-orange-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Focus on areas where incorrect answers were selected
                                      </li>
                                      <li className="text-orange-800 flex items-start">
                                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                        Practice applying concepts in different contexts
                                      </li>
                                    </>
                                  ) : (
                                    <li className="text-orange-800 flex items-start">
                                      <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                      Continue practicing to maintain and expand knowledge base
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Personalized Recommendations */}
                          <div>
                            <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                              Personalized Recommendations
                            </h5>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <p className="text-purple-800 text-sm leading-relaxed">
                                {quizResult.suggestion} Additionally, consider creating flashcards for key concepts and reviewing the summary material again before attempting more practice questions.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Question Breakdown */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h4 className="font-medium text-gray-900 mb-6">Question Review</h4>
                        <div className="space-y-4">
                          {quiz.questions.map((question, questionIndex) => {
                            const userAnswer = userAnswers.find(a => a.questionIndex === questionIndex)?.selectedOption || ''
                            const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()
                            
                            return (
                              <div key={questionIndex} className={`p-4 rounded-lg border-2 ${
                                isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                              }`}>
                                <div className="flex items-start gap-3 mb-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-2">
                                      {questionIndex + 1}. {question.question}
                                    </h5>
                                    
                                    <div className="space-y-2 text-sm">
                                      <div className={`p-2 rounded ${
                                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        <span className="font-medium">Your answer: </span>
                                        {userAnswer || 'No answer selected'}
                                      </div>
                                      
                                      {!isCorrect && (
                                        <div className="p-2 rounded bg-green-100 text-green-800">
                                          <span className="font-medium">Correct answer: </span>
                                          {question.correct_answer}
                                        </div>
                                      )}
                                      
                                      {question.explanation && (
                                        <div className="p-2 rounded bg-blue-100 text-blue-800">
                                          <span className="font-medium">Explanation: </span>
                                          {question.explanation}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setQuizResult(null)
                            setUserAnswers([])
                            setCurrentQuestionIndex(0)
                          }}
                          className="flex-1"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retake Quiz
                        </Button>
                        <Button onClick={resetApp} className="flex-1">
                          Create New Quiz
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )

  // Render the appropriate step
  if (currentStep === 'upload') {
    return renderUploadStep()
  } else if (currentStep === 'configure') {
    return renderConfigureStep()
  } else {
    return renderResultsStep()
  }
}

// Flashcard component with flip functionality
function FlashcardItem({ card }: { card: { front: string; back: string; category?: string } }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div 
      className="relative cursor-pointer"
      style={{ 
        perspective: '1000px',
        minHeight: '200px',
        height: 'auto'
      }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full transition-transform duration-700 ease-in-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '200px'
        }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 w-full"
          style={{ 
            backfaceVisibility: 'hidden',
            minHeight: '200px'
          }}
        >
          <div className="h-full p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-black-100 font-medium uppercase tracking-wide">Question</div>
              {card.category && (
                <div className="text-xs bg-white/20 px-2 py-1 rounded text-blue-100">
                  {card.category}
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-base font-medium leading-relaxed break-words hyphens-auto overflow-hidden">
                  {card.front.length > 150 ? (
                    <div className="max-h-32 overflow-y-auto pr-2 text-sm leading-tight">
                      {card.front}
                    </div>
                  ) : (
                    card.front
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-3 text-center">
              <div className="text-xs text-blue-100">Click to reveal answer</div>
            </div>
          </div>
        </div>
        
        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            minHeight: '200px'
          }}
        >
          <div className="h-full p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white shadow-lg hover:shadow-xl transition-shadow flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-green-100 font-medium uppercase tracking-wide">Answer</div>
              {card.category && (
                <div className="text-xs bg-white/20 px-2 py-1 rounded text-green-100">
                  {card.category}
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-base font-medium leading-relaxed break-words hyphens-auto overflow-hidden">
                  {card.back.length > 150 ? (
                    <div className="max-h-32 overflow-y-auto pr-2 text-sm leading-tight">
                      {card.back}
                    </div>
                  ) : (
                    card.back
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-3 text-center">
              <div className="text-xs text-green-100">Click to see question</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}