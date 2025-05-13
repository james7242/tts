import TextToSpeechConverter from '@/components/tts/TextToSpeechConverter'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-8 h-screen overflow-y-auto mb-12">
      <div className="container mx-auto  max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">텍스트-음성 변환기</h1>
        <TextToSpeechConverter />
      </div>
    </main>
  )
}