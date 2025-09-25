"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Play, Download, Eye, Loader2, Sparkles, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GenerationJob {
  jobId: string
  status: "queued" | "processing" | "completed" | "failed"
  progress: number
  audioUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

interface GeminiGeneratorProps {
  onVideoGenerated?: (videoUrl: string, audioUrl: string) => void
}

export default function GeminiGenerator({ onVideoGenerated }: GeminiGeneratorProps) {
  const [text, setText] = useState("")
  const [language, setLanguage] = useState("en-IN")
  const [style, setStyle] = useState("formal")
  const [duration, setDuration] = useState(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null)

  // Poll job status
  useEffect(() => {
    if (!currentJob || currentJob.status === "completed" || currentJob.status === "failed") {
      return
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/ml/gemini?jobId=${currentJob.jobId}`)
        const data = await response.json()

        setCurrentJob(data)

        if (data.status === "completed") {
          setIsGenerating(false)
          toast({
            title: "Generation Complete!",
            description: "Your Gemini AI-powered video and audio have been generated successfully.",
          })

          if (onVideoGenerated && data.videoUrl && data.audioUrl) {
            onVideoGenerated(data.videoUrl, data.audioUrl)
          }
        } else if (data.status === "failed") {
          setIsGenerating(false)
          toast({
            title: "Generation Failed",
            description: data.error || "An error occurred during Gemini generation.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to check job status:", error)
      }
    }

    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval)
  }, [currentJob, onVideoGenerated])

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter text to generate video and audio with Gemini AI.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ml/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language,
          style,
          duration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Gemini generation failed")
      }

      setCurrentJob({
        jobId: data.jobId,
        status: data.status,
        progress: 0,
      })

      toast({
        title: "Gemini AI Generation Started",
        description: "Your content is being enhanced and generated using Google's Gemini AI.",
      })
    } catch (error) {
      setIsGenerating(false)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const languages = [
    { value: "en-IN", label: "English (India)" },
    { value: "hi-IN", label: "Hindi" },
    { value: "ta-IN", label: "Tamil" },
    { value: "te-IN", label: "Telugu" },
    { value: "bn-IN", label: "Bengali" },
    { value: "gu-IN", label: "Gujarati" },
    { value: "kn-IN", label: "Kannada" },
    { value: "ml-IN", label: "Malayalam" },
    { value: "mr-IN", label: "Marathi" },
    { value: "or-IN", label: "Odia" },
    { value: "pa-IN", label: "Punjabi" },
    { value: "as-IN", label: "Assamese" },
    { value: "ur-IN", label: "Urdu" },
    { value: "ne-IN", label: "Nepali" },
  ]

  const styles = [
    { value: "formal", label: "Formal/Official" },
    { value: "news", label: "News Report" },
    { value: "announcement", label: "Public Announcement" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Gemini AI Video Generator
          </CardTitle>
          <CardDescription>Generate professional videos and audio using Google's advanced Gemini AI</CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Powered by Gemini AI
            </Badge>
            <Badge variant="secondary">14 Indian Languages</Badge>
            <Badge variant="secondary">Professional Quality</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="input-text">PIB Press Release Text</Label>
            <Textarea
              id="input-text"
              placeholder="Enter the PIB press release text that will be enhanced and converted to video using Gemini AI..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      {styleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="10"
              max="120"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 30)}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !text.trim()} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with Gemini AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle>Gemini AI Generation Progress</CardTitle>
            <CardDescription>Job ID: {currentJob.jobId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status: {currentJob.status}</span>
                <span>{currentJob.progress}%</span>
              </div>
              <Progress value={currentJob.progress} className="w-full" />
            </div>

            {currentJob.status === "completed" && (
              <div className="flex gap-2">
                {currentJob.audioUrl && (
                  <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Play Audio
                  </Button>
                )}
                {currentJob.videoUrl && (
                  <>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Video
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </>
                )}
              </div>
            )}

            {currentJob.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">Error: {currentJob.error}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
