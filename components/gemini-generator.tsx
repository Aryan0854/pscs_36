"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  onAudioGenerated?: (audioUrl: string, transcriptUrl: string) => void
}

interface VoicePersona {
  id: string
  name: string
  gender: 'male' | 'female'
  voiceType: string
  sampleUrl?: string
}

export default function GeminiGenerator({ onAudioGenerated }: GeminiGeneratorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setResult(null)
    }
  }

  const handleGenerate = async () => {
    if (!uploadedFile) {
      toast({
        title: "File Required",
        description: "Please select a document file to generate audio discussion.",
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
      console.log("Starting audio generation with file:", uploadedFile.name)
      console.log("Using personas:", personas.slice(0, numHosts))

      const formData = new FormData()
      formData.append('file', uploadedFile)
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
      // Generate a sample audio for this persona
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
            <Label htmlFor="file-upload">Upload Document</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                accept=".txt,.pdf,.docx,.doc,.html,.htm,.rtf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Drop your document here</p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOCX, TXT, HTML, RTF files (max 16MB)
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
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
            disabled={isGenerating || !uploadedFile}
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
