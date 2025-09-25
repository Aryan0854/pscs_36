"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Play, Download, Upload, Loader2, Mic, Users, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AudioResult {
  success: boolean
  audioUrl?: string
  transcriptUrl?: string
  dialogue?: Array<{
    speaker: string
    content: string
  }>
  summary?: string
  personas?: Array<{
    name: string
    type: string
    expertise: string
  }>
  message?: string
  rawOutput?: string
  error?: string
}

interface GeminiGeneratorProps {
  scriptText?: string
  onAudioGenerated?: (audioUrl: string, transcriptUrl: string) => void
}

interface VoicePersona {
  id: string
  name: string
  gender: 'male' | 'female'
  voiceType: string
  sampleUrl?: string
}

export default function GeminiGenerator({ scriptText: propScriptText, onAudioGenerated }: GeminiGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [result, setResult] = useState<AudioResult | null>(null)
  const [numHosts, setNumHosts] = useState(3)
  const [personas, setPersonas] = useState<VoicePersona[]>([
    { id: '1', name: 'Sarah Chen', gender: 'female', voiceType: 'professional' },
    { id: '2', name: 'Dr. Michael Rodriguez', gender: 'male', voiceType: 'authoritative' },
    { id: '3', name: 'Emma Thompson', gender: 'female', voiceType: 'engaging' }
  ])
  const [playingSample, setPlayingSample] = useState<string | null>(null)
  const [localScriptText, setLocalScriptText] = useState("")

  // Use prop script text if provided, otherwise use local state
  const scriptText = propScriptText || localScriptText
  const setScriptText = propScriptText ? () => {} : setLocalScriptText

  // Component will receive script text as prop or from context

  const handleGenerate = async () => {
    if (!scriptText.trim()) {
      toast({
        title: "Script Required",
        description: "Please provide script text to generate audio discussion.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setResult(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      console.log("Starting audio generation with script text")
      console.log("Using personas:", personas.slice(0, numHosts))

      const formData = new FormData()
      formData.append('text', scriptText)
      formData.append('personas', JSON.stringify(personas.slice(0, numHosts)))
      formData.append('numHosts', numHosts.toString())

      console.log("Making API call to /api/audio/generate")
      const response = await fetch("/api/audio/generate", {
        method: "POST",
        body: formData,
      })

      console.log("API response status:", response.status)
      clearInterval(progressInterval)
      setGenerationProgress(100)

      const data: AudioResult = await response.json()
      console.log("API response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Audio generation failed")
      }

      setResult(data)

      if (data.audioUrl && data.transcriptUrl && onAudioGenerated) {
        onAudioGenerated(data.audioUrl, data.transcriptUrl)
      }

      toast({
        title: "Audio Generated Successfully!",
        description: "Your AI-powered news discussion has been created.",
      })

    } catch (error) {
      console.error("Audio generation error:", error)
      clearInterval(progressInterval)
      setGenerationProgress(0)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred during audio generation",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 1000)
    }
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const updateNumHosts = (newNum: number) => {
    setNumHosts(newNum)
    setPersonas(prev => {
      const updated = [...prev]
      if (newNum > prev.length) {
        // Add new personas
        for (let i = prev.length; i < newNum; i++) {
          updated.push({
            id: `${i + 1}`,
            name: `Host ${i + 1}`,
            gender: 'male' as const,
            voiceType: 'neutral'
          })
        }
      } else if (newNum < prev.length) {
        // Remove excess personas
        updated.splice(newNum)
      }
      return updated
    })
  }

  const updatePersona = (id: string, field: keyof VoicePersona, value: any) => {
    setPersonas(prev => prev.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const playVoiceSample = async (persona: VoicePersona) => {
    setPlayingSample(persona.id)
    try {
      // Use Web Speech API for voice samples (browser-based TTS)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Hello, this is ${persona.name} speaking. I am a ${persona.gender} voice with a ${persona.voiceType} tone.`
        )

        // Try to find a voice that matches the gender
        const voices = speechSynthesis.getVoices()
        const preferredVoice = voices.find(voice =>
          voice.lang.startsWith('en') &&
          ((persona.gender === 'female' && voice.name.toLowerCase().includes('female')) ||
           (persona.gender === 'male' && voice.name.toLowerCase().includes('male')) ||
           voice.name.toLowerCase().includes(persona.gender))
        )

        if (preferredVoice) {
          utterance.voice = preferredVoice
        }

        // Adjust speech parameters dramatically based on voice type for truly distinct personalities
        switch (persona.voiceType) {
          case 'calm':
            utterance.rate = 0.6  // Extremely slow and deliberate
            utterance.pitch = 0.75 // Very low, soothing pitch
            utterance.volume = 0.7 // Soft, gentle volume
            break
          case 'energetic':
            utterance.rate = 1.6  // Very fast and animated
            utterance.pitch = 1.3  // High, excited pitch
            utterance.volume = 1.0 // Full, enthusiastic volume
            break
          case 'authoritative':
            utterance.rate = 0.75 // Slow and deliberate
            utterance.pitch = 0.65 // Deep, commanding pitch
            utterance.volume = 1.1 // Powerful volume
            break
          case 'engaging':
            utterance.rate = 1.2  // Lively pace
            utterance.pitch = 1.15 // Warm, engaging pitch
            utterance.volume = 0.95 // Inviting volume
            break
          case 'professional':
            utterance.rate = 0.9  // Steady, measured pace
            utterance.pitch = 0.9  // Clear, professional pitch
            utterance.volume = 0.95 // Confident volume
            break
          case 'warm':
            utterance.rate = 0.85 // Comfortable, flowing pace
            utterance.pitch = 1.05 // Gentle, warm pitch
            utterance.volume = 0.8 // Soft, nurturing volume
            break
          case 'confident':
            utterance.rate = 1.05 // Assured pace
            utterance.pitch = 0.85 // Strong, confident pitch
            utterance.volume = 1.0 // Bold volume
            break
          case 'friendly':
            utterance.rate = 1.1  // Welcoming pace
            utterance.pitch = 1.1  // Cheerful, friendly pitch
            utterance.volume = 0.9 // Warm, approachable volume
            break
          case 'formal':
            utterance.rate = 0.8  // Measured, formal pace
            utterance.pitch = 0.8  // Refined, proper pitch
            utterance.volume = 0.85 // Dignified volume
            break
          case 'casual':
            utterance.rate = 1.15 // Relaxed, conversational pace
            utterance.pitch = 0.95 // Easy-going pitch
            utterance.volume = 0.9 // Natural, casual volume
            break
          default:
            utterance.rate = 1.0
            utterance.pitch = 1.0
            utterance.volume = 1.0
        }

        // Try to select different voices based on personality if available
        const availableVoices = speechSynthesis.getVoices()
        let selectedVoice = null

        // Voice selection based on personality and gender
        if (persona.voiceType === 'calm' && persona.gender === 'female') {
          selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('samantha'))
        } else if (persona.voiceType === 'energetic' && persona.gender === 'male') {
          selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel'))
        } else if (persona.voiceType === 'authoritative' && persona.gender === 'male') {
          selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes('tom') || v.name.toLowerCase().includes('lee'))
        } else if (persona.voiceType === 'warm' && persona.gender === 'female') {
          selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('susan'))
        } else if (persona.voiceType === 'professional') {
          selectedVoice = availableVoices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('tom'))
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        utterance.onend = () => setPlayingSample(null)
        utterance.onerror = () => setPlayingSample(null)

        speechSynthesis.speak(utterance)
      } else {
        // Fallback to server-side TTS
        const response = await fetch('/api/audio/sample', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `Hello, this is ${persona.name} speaking. I am a ${persona.gender} voice with a ${persona.voiceType} tone.`,
            gender: persona.gender,
            voiceType: persona.voiceType
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.audioUrl) {
            const audio = new Audio(data.audioUrl)
            audio.onended = () => setPlayingSample(null)
            audio.play()
          }
        }
      }
    } catch (error) {
      console.error('Failed to play voice sample:', error)
      setPlayingSample(null)
    }
  }

  const voiceTypes = [
    'professional', 'authoritative', 'engaging', 'warm', 'energetic',
    'calm', 'confident', 'friendly', 'formal', 'casual'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-green-500" />
            AI Audio News Generator
          </CardTitle>
          <CardDescription>
            Transform documents into engaging conversational news discussions with multiple AI personas
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Multi-Persona Dialogue
            </Badge>
            <Badge variant="secondary">Custom AI Models</Badge>
            <Badge variant="secondary">No API Dependencies</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Script Text</Label>
            <div className="border rounded-lg p-4 bg-muted/30">
              <Textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                readOnly={!!propScriptText}
                placeholder={propScriptText ? "Script text from Script Editor" : "Enter or paste your script text here. This will be used to generate the AI audio discussion."}
                className="min-h-[150px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {scriptText.length} characters • {propScriptText ? "Using text from Script Editor" : "This text will be converted into a multi-persona AI discussion"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Number of Hosts</Label>
              <Select value={numHosts.toString()} onValueChange={(value) => updateNumHosts(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Configure Host Voices</Label>
              {personas.slice(0, numHosts).map((persona, index) => (
                <Card key={persona.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-sm">Host {index + 1} Name</Label>
                      <Input
                        value={persona.name}
                        onChange={(e) => updatePersona(persona.id, 'name', e.target.value)}
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Gender</Label>
                      <Select
                        value={persona.gender}
                        onValueChange={(value: 'male' | 'female') => updatePersona(persona.id, 'gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Voice Type</Label>
                      <Select
                        value={persona.voiceType}
                        onValueChange={(value) => updatePersona(persona.id, 'voiceType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voiceTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playVoiceSample(persona)}
                        disabled={playingSample === persona.id}
                      >
                        {playingSample === persona.id ? (
                          <>🔊 Playing...</>
                        ) : (
                          <>🎧 Sample</>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !scriptText.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Audio Discussion...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Generate AI Audio Discussion
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing document...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {result && result.success && (
        <div className="space-y-6">
          {result.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Document Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.summary}</p>
              </CardContent>
            </Card>
          )}

          {result.personas && result.personas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  AI Personas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.personas.map((persona, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{persona.name}</h4>
                      <p className="text-sm text-muted-foreground">{persona.type} • {persona.expertise}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.dialogue && result.dialogue.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Dialogue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.dialogue.map((turn, index) => (
                    <div key={index} className="flex gap-3">
                      <Badge variant="outline" className="shrink-0">
                        {turn.speaker}
                      </Badge>
                      <p className="text-sm flex-1">{turn.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Generated Audio</CardTitle>
            </CardHeader>
            <CardContent>
              {result.audioUrl && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🎧 Listen to AI News Discussion</h4>
                    <audio
                      controls
                      className="w-full"
                      preload="metadata"
                    >
                      <source src={result.audioUrl} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    <p className="text-xs text-muted-foreground mt-2">
                      Multi-persona AI discussion generated from your document
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(result.audioUrl!, 'ai_news_discussion.wav')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Audio
                    </Button>
                    {result.transcriptUrl && (
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(result.transcriptUrl!, 'transcript.txt')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Transcript
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {result && !result.success && result.error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Generation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{result.error}</p>
            {result.rawOutput && (
              <details className="mt-2">
                <summary className="text-sm cursor-pointer">Show raw output</summary>
                <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                  {result.rawOutput}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
