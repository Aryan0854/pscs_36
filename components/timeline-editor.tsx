"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Scissors,
  Copy,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Video,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TimelineTrack {
  id: string
  name: string
  type: "scene" | "voiceover" | "captions" | "music" | "animation"
  visible: boolean
  locked: boolean
  color: string
}

interface TimelineBlock {
  id: string
  trackId: string
  title: string
  startTime: number
  duration: number
  language?: string
  status: "draft" | "processing" | "ready"
}

export function TimelineEditor() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration] = useState(180) // 3 minutes
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [volume, setVolume] = useState(75)
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const tracks: TimelineTrack[] = [
    { id: "scenes", name: "Scenes", type: "scene", visible: true, locked: false, color: "#2563eb" },
    { id: "voiceover", name: "Voiceover", type: "voiceover", visible: true, locked: false, color: "#059669" },
    { id: "captions", name: "Captions", type: "captions", visible: true, locked: false, color: "#dc2626" },
    { id: "music", name: "Background Music", type: "music", visible: true, locked: false, color: "#7c3aed" },
    { id: "animations", name: "Animations", type: "animation", visible: true, locked: false, color: "#ea580c" },
  ]

  const timelineBlocks: TimelineBlock[] = [
    {
      id: "block-1",
      trackId: "scenes",
      title: "Introduction",
      startTime: 0,
      duration: 30,
      language: "Hindi",
      status: "ready",
    },
    {
      id: "block-2",
      trackId: "scenes",
      title: "Key Points",
      startTime: 30,
      duration: 45,
      language: "English",
      status: "processing",
    },
    {
      id: "block-3",
      trackId: "scenes",
      title: "Statistics",
      startTime: 75,
      duration: 60,
      language: "Bengali",
      status: "draft",
    },
    {
      id: "block-4",
      trackId: "scenes",
      title: "Conclusion",
      startTime: 135,
      duration: 25,
      language: "Tamil",
      status: "ready",
    },
    {
      id: "vo-1",
      trackId: "voiceover",
      title: "Hindi Narration",
      startTime: 0,
      duration: 30,
      language: "Hindi",
      status: "ready",
    },
    {
      id: "vo-2",
      trackId: "voiceover",
      title: "English Narration",
      startTime: 30,
      duration: 45,
      language: "English",
      status: "processing",
    },
    {
      id: "cap-1",
      trackId: "captions",
      title: "Hindi Subtitles",
      startTime: 0,
      duration: 75,
      status: "ready",
    },
    {
      id: "music-1",
      trackId: "music",
      title: "Background Track",
      startTime: 0,
      duration: 180,
      status: "ready",
    },
  ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getBlockWidth = (duration: number) => {
    return (duration / totalDuration) * 800 * zoom
  }

  const getBlockPosition = (startTime: number) => {
    return (startTime / totalDuration) * 800 * zoom
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    toast({
      title: isPlaying ? "Playback Paused" : "Playback Started",
      description: `Timeline ${isPlaying ? "paused" : "playing"} at ${formatTime(currentTime)}`,
    })
  }

  const handleSkipBack = () => {
    const newTime = Math.max(currentTime - 10, 0)
    setCurrentTime(newTime)
    toast({
      title: "Skipped Back",
      description: `Moved to ${formatTime(newTime)}`,
    })
  }

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 10, totalDuration)
    setCurrentTime(newTime)
    toast({
      title: "Skipped Forward",
      description: `Moved to ${formatTime(newTime)}`,
    })
  }

  const handleCutBlock = () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        toast({
          title: "Block Cut",
          description: `"${block.title}" has been cut at current position.`,
        })
      }
    } else {
      toast({
        title: "No Block Selected",
        description: "Please select a timeline block to cut.",
        variant: "destructive",
      })
    }
  }

  const handleCopyBlock = () => {
    if (selectedBlock) {
      setCopiedBlock(selectedBlock)
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        toast({
          title: "Block Copied",
          description: `"${block.title}" has been copied to clipboard.`,
        })
      }
    } else {
      toast({
        title: "No Block Selected",
        description: "Please select a timeline block to copy.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBlock = () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        toast({
          title: "Block Deleted",
          description: `"${block.title}" has been removed from timeline.`,
        })
        setSelectedBlock(null)
      }
    } else {
      toast({
        title: "No Block Selected",
        description: "Please select a timeline block to delete.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewBlock = () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        toast({
          title: "Block Preview",
          description: `Previewing "${block.title}" - ${formatTime(block.duration)}`,
        })
      }
    }
  }

  const handleAdvancedSettings = () => {
    toast({
      title: "Advanced Settings",
      description: "Opening timeline configuration panel...",
    })
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    toast({
      title: "Volume Adjusted",
      description: `Audio level set to ${value[0]}%`,
    })
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false)
            return totalDuration
          }
          return prev + 0.1
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, totalDuration])

  return (
    <div className="h-[700px] w-full flex flex-col bg-background">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSkipBack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSkipForward}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm font-mono">
            <span>{formatTime(currentTime)}</span>
            <span className="text-muted-foreground">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCutBlock}>
              <Scissors className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyBlock}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeleteBlock}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="zoom" className="text-sm">
              Zoom:
            </Label>
            <Slider
              id="zoom"
              min={0.5}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="w-20"
            />
            <span className="text-sm font-mono w-8">{zoom.toFixed(1)}x</span>
          </div>

          <Button variant="outline" size="sm" onClick={handleAdvancedSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track Headers */}
        <div className="w-48 border-r bg-muted/30">
          <div className="h-12 border-b flex items-center px-4 bg-card">
            <span className="text-sm font-semibold">Tracks</span>
          </div>
          {tracks.map((track) => (
            <div key={track.id} className="h-16 border-b flex items-center px-4 bg-card">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }}></div>
                <span className="text-sm font-medium">{track.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: `${800 * zoom}px` }}>
            {/* Time Ruler */}
            <div className="h-12 border-b bg-card relative">
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex flex-col justify-between text-xs text-muted-foreground"
                  style={{ left: `${(i * 10 * 800 * zoom) / totalDuration}px` }}
                >
                  <div className="border-l border-border h-2"></div>
                  <span className="px-1">{formatTime(i * 10)}</span>
                  <div className="border-l border-border h-2"></div>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                style={{ left: `${(currentTime * 800 * zoom) / totalDuration}px` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1"></div>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div ref={timelineRef}>
              {tracks.map((track) => (
                <div key={track.id} className="h-16 border-b relative bg-muted/10">
                  {timelineBlocks
                    .filter((block) => block.trackId === track.id)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`absolute top-2 h-12 rounded cursor-pointer border-2 transition-all ${
                          selectedBlock === block.id ? "border-primary" : "border-transparent"
                        }`}
                        style={{
                          left: `${getBlockPosition(block.startTime)}px`,
                          width: `${getBlockWidth(block.duration)}px`,
                          backgroundColor: track.color,
                        }}
                        onClick={() => setSelectedBlock(block.id)}
                      >
                        <div className="p-2 h-full flex flex-col justify-between text-white text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{block.title}</span>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(block.status)}`}></div>
                          </div>
                          <div className="flex items-center justify-between">
                            {block.language && (
                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                {block.language}
                              </Badge>
                            )}
                            <span>{formatTime(block.duration)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l bg-card">
          <div className="h-12 border-b flex items-center px-4">
            <span className="text-sm font-semibold">Properties</span>
          </div>
          <div className="p-4 space-y-4">
            {selectedBlock ? (
              <>
                {(() => {
                  const block = timelineBlocks.find((b) => b.id === selectedBlock)
                  if (!block) return null

                  return (
                    <>
                      <div>
                        <Label htmlFor="block-title" className="text-sm font-medium">
                          Title
                        </Label>
                        <Input id="block-title" value={block.title} className="mt-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-time" className="text-sm font-medium">
                            Start Time
                          </Label>
                          <Input id="start-time" value={formatTime(block.startTime)} className="mt-1" />
                        </div>
                        <div>
                          <Label htmlFor="duration" className="text-sm font-medium">
                            Duration
                          </Label>
                          <Input id="duration" value={formatTime(block.duration)} className="mt-1" />
                        </div>
                      </div>

                      {block.language && (
                        <div>
                          <Label htmlFor="language" className="text-sm font-medium">
                            Language
                          </Label>
                          <Input id="language" value={block.language} className="mt-1" />
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          <Badge
                            variant={block.status === "ready" ? "default" : "secondary"}
                            className={block.status === "processing" ? "bg-yellow-100 text-yellow-800" : ""}
                          >
                            {block.status}
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button size="sm" className="w-full" onClick={handlePreviewBlock}>
                          <Play className="w-4 h-4 mr-2" />
                          Preview Block
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={handleAdvancedSettings}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Advanced Settings
                        </Button>
                      </div>
                    </>
                  )
                })()}
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a timeline block to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="h-20 border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Slider min={0} max={100} value={[volume]} onValueChange={handleVolumeChange} className="w-20" />
              <span className="text-sm">{volume}%</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Timeline: {timelineBlocks.length} blocks • Duration: {formatTime(totalDuration)}
          </div>
        </div>
      </div>
    </div>
  )
}
