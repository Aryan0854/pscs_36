"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Play, Download, Upload, Loader2, Video, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface VideoResult {
  success: boolean
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  message?: string
  error?: string
}

interface VideoGeneratorProps {
  scriptText?: string
  audioUrl?: string
  dialogue?: string
  projectId?: string // Add projectId prop
  onVideoGenerated?: (videoUrl: string, thumbnailUrl: string) => void
  onNavigateToTimeline?: () => void
}

interface WordFileState {
  file: File | null
  name: string
}

export default function VideoGenerator({ scriptText, audioUrl, dialogue, projectId, onVideoGenerated, onNavigateToTimeline }: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [result, setResult] = useState<VideoResult | null>(null)
  const [videoStyle, setVideoStyle] = useState("news")
  const [resolution, setResolution] = useState("1080p")
  const [localScriptText, setLocalScriptText] = useState("")
  const [localAudioUrl, setLocalAudioUrl] = useState("")
  const [wordFile, setWordFile] = useState<WordFileState>({ file: null, name: "" })
  const videoRef = useRef<HTMLVideoElement>(null)

  // Use prop values if provided, otherwise use local state
  const currentScriptText = scriptText || localScriptText
  const currentAudioUrl = audioUrl || localAudioUrl
  const setCurrentScriptText = scriptText ? () => {} : setLocalScriptText
  const setCurrentAudioUrl = audioUrl ? () => {} : setLocalAudioUrl

  const styles = [
    { id: "news", label: "📰 News Broadcast", description: "Professional news studio style" },
    { id: "documentary", label: "📽️ Documentary", description: "Cinematic style with visual effects" },
    { id: "educational", label: "🎓 Educational", description: "Clean and informative presentation style" },
    { id: "corporate", label: "🏢 Corporate", description: "Modern business presentation" },
  ]

  const resolutions = [
    { id: "720p", label: "HD (720p)", description: "1280×720 pixels - Good for web" },
    { id: "1080p", label: "Full HD (1080p)", description: "1920×1080 pixels - Standard quality" },
    { id: "4k", label: "4K Ultra HD", description: "3840×2160 pixels - Premium quality" },
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setWordFile({ file, name: file.name })
    }
  }

  const handleGenerate = async () => {
    if (!currentScriptText.trim()) {
      toast({
        title: "Missing Script",
        description: "Please provide script text to generate a video.",
        variant: "destructive",
      })
      return
    }

    if (!currentAudioUrl) {
      toast({
        title: "Missing Audio",
        description: "Please generate audio first before creating a video.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setResult(null)

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 500)

    try {
      const formData = new FormData()
      formData.append('script', currentScriptText)
      formData.append('dialogue', dialogue || currentScriptText)
      formData.append('audioUrl', currentAudioUrl)
      formData.append('style', videoStyle)
      formData.append('resolution', resolution)
      
      if (projectId) {
        formData.append('projectId', projectId)
      }
      
      if (wordFile.file) {
        formData.append('wordFile', wordFile.file)
      }

      const response = await fetch("/api/video/generate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setGenerationProgress(100)
        
        if (onVideoGenerated) {
          onVideoGenerated(data.videoUrl!, data.thumbnailUrl!)
        }
        
        toast({
          title: "Video Generated Successfully",
          description: "Your AI-generated video is ready to view and download.",
        })
      } else {
        setResult({ success: false, error: data.error || "Failed to generate video" })
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate video",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating video:", error)
      setResult({ success: false, error: "Error generating video. Check console for details." })
      toast({
        title: "Generation Error",
        description: "An error occurred while generating the video.",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
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

  // Effect to handle video loading errors
  useEffect(() => {
    if (result?.videoUrl && videoRef.current) {
      const video = videoRef.current
      
      const handleLoadStart = () => {
        console.log('Video loading started')
      }
      
      const handleCanPlay = () => {
        console.log('Video can play')
      }
      
      const handleError = (e: any) => {
        console.error('Video error:', e)
        toast({
          title: "Video Playback Error",
          description: "There was an issue playing the video. Try downloading it instead.",
          variant: "destructive",
        })
      }
      
      video.addEventListener('loadstart', handleLoadStart)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('error', handleError)
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('error', handleError)
      }
    }
  }, [result?.videoUrl, toast])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Video Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!scriptText && (
            <div className="space-y-2">
              <Label htmlFor="script">Script Text</Label>
              <Textarea
                id="script"
                placeholder="Enter your script text here..."
                value={localScriptText}
                onChange={(e) => setCurrentScriptText(e.target.value)}
                rows={6}
              />
            </div>
          )}

          {!audioUrl && (
            <div className="space-y-2">
              <Label htmlFor="audioUrl">Audio URL</Label>
              <Input
                id="audioUrl"
                placeholder="Enter audio URL..."
                value={localAudioUrl}
                onChange={(e) => setCurrentAudioUrl(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enhance with Word File (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="wordFile"
                />
                <Label
                  htmlFor="wordFile"
                  className="flex-1 cursor-pointer"
                >
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                    {wordFile.name ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{wordFile.name}</span>
                        <Badge variant="secondary">Selected</Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-medium text-primary">Click to upload</span>{" "}
                          <span className="text-muted-foreground">a text file</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use keywords to enhance Video Genration (max 1MB)
                        </p>
                      </div>
                    )}
                  </div>
                </Label>
                {wordFile.name && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWordFile({ file: null, name: "" })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Video Style</Label>
                <div className="grid grid-cols-1 gap-2">
                  {styles.map((style) => (
                    <div
                      key={style.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        videoStyle === style.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setVideoStyle(style.id)}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-muted-foreground">{style.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resolution</Label>
                <div className="grid grid-cols-1 gap-2">
                  {resolutions.map((res) => (
                    <div
                      key={res.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        resolution === res.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setResolution(res.id)}
                    >
                      <div className="font-medium">{res.label}</div>
                      <div className="text-sm text-muted-foreground">{res.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !currentScriptText.trim() || !currentAudioUrl}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate AI Video
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing video...</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && result.success && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Video</CardTitle>
            </CardHeader>
            <CardContent>
              {result.videoUrl && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🎬 Watch Your AI-Generated Video</h4>
                    <video
                      ref={videoRef}
                      controls
                      className="w-full max-w-2xl mx-auto rounded-lg"
                      poster={result.thumbnailUrl}
                      preload="metadata"
                      onError={(e) => {
                        console.error('Video element error:', e)
                        toast({
                          title: "Video Playback Error",
                          description: "There was an issue playing the video. Try downloading it instead.",
                          variant: "destructive",
                        })
                      }}
                    >
                      <source src={result.videoUrl} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      AI-generated video with synchronized audio • {result.duration}s duration
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(result.videoUrl!, 'ai_generated_video.mp4')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Video
                    </Button>
                    {result.thumbnailUrl && (
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(result.thumbnailUrl!, 'video_thumbnail.jpg')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Thumbnail
                      </Button>
                    )}
                    {onNavigateToTimeline && (
                      <Button
                        variant="default"
                        onClick={onNavigateToTimeline}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Edit in Timeline
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}