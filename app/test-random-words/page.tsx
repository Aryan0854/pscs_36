"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Play, Download } from "lucide-react"

export default function TestRandomWords() {
  const [wordFile, setWordFile] = useState<File | null>(null)
  const [wordFileName, setWordFileName] = useState("")
  const [scriptText, setScriptText] = useState("")
  const [audioUrl, setAudioUrl] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")

  const handleWordFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setWordFile(file)
    setWordFileName(file ? file.name : "")
  }

  const handleGenerateVideo = async () => {
    if (!scriptText.trim()) {
      alert("Please enter script text")
      return
    }

    if (!audioUrl) {
      alert("Please enter audio URL")
      return
    }

    setIsGenerating(true)
    setVideoUrl("")
    setThumbnailUrl("")

    try {
      const formData = new FormData()
      formData.append('script', scriptText)
      formData.append('dialogue', scriptText)
      formData.append('audioUrl', audioUrl)
      formData.append('style', 'news')
      formData.append('resolution', '1080p')
      
      if (wordFile) {
        formData.append('wordFile', wordFile)
      }

      const response = await fetch("/api/video/generate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setVideoUrl(data.videoUrl || "")
        setThumbnailUrl(data.thumbnailUrl || "")
      } else {
        alert(`Error: ${data.error || "Failed to generate video"}`)
      }
    } catch (error) {
      console.error("Error generating video:", error)
      alert("Error generating video. Check console for details.")
    } finally {
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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Random Words Feature</CardTitle>
          <CardDescription>
            Test the new feature that uses random words from a text file to search for images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Script Text</Label>
            <Textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Enter script text for the video"
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Audio URL</Label>
            <Input
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="Enter audio URL"
            />
          </div>

          <div className="space-y-2">
            <Label>Word File (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".txt"
                onChange={handleWordFileChange}
              />
              {wordFileName && (
                <span className="text-sm text-muted-foreground truncate">
                  {wordFileName}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a text file to use random words from it for image search instead of script keywords
            </p>
          </div>

          <Button
            onClick={handleGenerateVideo}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Play className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>

          {videoUrl && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Generated Video</h3>
              <div className="bg-muted p-4 rounded-lg">
                <video
                  controls
                  className="w-full max-w-2xl mx-auto rounded-lg"
                  poster={thumbnailUrl}
                  preload="metadata"
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video element.
                </video>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(videoUrl, 'random_words_video.mp4')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
                {thumbnailUrl && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(thumbnailUrl, 'video_thumbnail.jpg')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Thumbnail
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}