"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

export default function GeminiGenerator({ onAudioGenerated }: GeminiGeneratorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [result, setResult] = useState<AudioResult | null>(null)
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
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch("/api/audio/generate", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const data: AudioResult = await response.json()

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
        <CardContent className="space-y-4">
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
              <CardTitle>Download Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {result.audioUrl && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(result.audioUrl!, 'ai_news_discussion.wav')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Audio
                  </Button>
                )}
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
