'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import QuizForgeApp from '@/components/QuizForgeApp'

function UploadContent() {
  const searchParams = useSearchParams()
  const step = searchParams.get('step') || 'upload'
  
  return <QuizForgeApp initialStep={step as 'upload' | 'configure' | 'results'} />
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadContent />
    </Suspense>
  )
} 