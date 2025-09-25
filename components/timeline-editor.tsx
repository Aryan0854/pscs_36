"use client"

import { useState, useRef, useEffect, useCallback } from "react"
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
  VolumeX,
  Maximize,
  Split,
  Merge,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TimelineTrack {
  id: string
  name: string
  type: "scene" | "voiceover" | "captions" | "music" | "animation"
  visible: boolean
  locked: boolean
  color: string
  volume: number
  muted: boolean
}

interface TimelineBlock {
  id: string
  trackId: string
  title: string
  startTime: number
  duration: number
  language?: string
  status: "draft" | "processing" | "ready"
  mediaUrl?: string
  volume?: number
}

export function TimelineEditor() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration] = useState(180) // 3 minutes
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [volume, setVolume] = useState(75)
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: "scenes",
      name: "Scenes",
      type: "scene",
      visible: true,
      locked: false,
      color: "#2563eb",
      volume: 100,
      muted: false,
    },
    {
      id: "voiceover",
      name: "Voiceover",
      type: "voiceover",
      visible: true,
      locked: false,
      color: "#059669",
      volume: 80,
      muted: false,
    },
    {
      id: "captions",
      name: "Captions",
      type: "captions",
      visible: true,
      locked: false,
      color: "#dc2626",
      volume: 0,
      muted: true,
    },
    {
      id: "music",
      name: "Background Music",
      type: "music",
      visible: true,
      locked: false,
      color: "#7c3aed",
      volume: 40,
      muted: false,
    },
    {
      id: "animations",
      name: "Animations",
      type: "animation",
      visible: true,
      locked: false,
      color: "#ea580c",
      volume: 0,
      muted: true,
    },
  ])

  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([
    {
      id: "block-1",
      trackId: "scenes",
      title: "Introduction",
      startTime: 0,
      duration: 30,
      language: "Hindi",
      status: "ready",
      mediaUrl: "/api/media/video/intro.mp4",
    },
    {
      id: "block-2",
      trackId: "scenes",
      title: "Key Points",
      startTime: 30,
      duration: 45,
      language: "English",
      status: "processing",
      mediaUrl: "/api/media/video/keypoints.mp4",
    },
    {
      id: "block-3",
      trackId: "scenes",
      title: "Statistics",
      startTime: 75,
      duration: 60,
      language: "Bengali",
      status: "draft",
      mediaUrl: "/api/media/video/stats.mp4",
    },
    {
      id: "block-4",
      trackId: "scenes",
      title: "Conclusion",
      startTime: 135,
      duration: 25,
      language: "Tamil",
      status: "ready",
      mediaUrl: "/api/media/video/conclusion.mp4",
    },
    {
      id: "vo-1",
      trackId: "voiceover",
      title: "Hindi Narration",
      startTime: 0,
      duration: 30,
      language: "Hindi",
      status: "ready",
      mediaUrl: "/api/media/audio/hindi-narration.mp3",
      volume: 85,
    },
    {
      id: "vo-2",
      trackId: "voiceover",
      title: "English Narration",
      startTime: 30,
      duration: 45,
      language: "English",
      status: "processing",
      mediaUrl: "/api/media/audio/english-narration.mp3",
      volume: 90,
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
      mediaUrl: "/api/media/audio/background.mp3",
      volume: 30,
    },
  ])

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

  const togglePlayback = useCallback(async () => {
    try {
      if (isPlaying) {
        // Pause all media
        if (audioRef.current) audioRef.current.pause()
        if (videoRef.current) videoRef.current.pause()
        setIsPlaying(false)

        toast({
          title: "Playback Paused",
          description: `Timeline paused at ${formatTime(currentTime)}`,
        })
      } else {
        // Start playback
        const response = await fetch("/api/timeline/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentTime,
            blocks: timelineBlocks.filter((block) => {
              const track = tracks.find((t) => t.id === block.trackId)
              return track?.visible && !track?.locked
            }),
          }),
        })

        if (response.ok) {
          setIsPlaying(true)
          toast({
            title: "Playback Started",
            description: `Timeline playing from ${formatTime(currentTime)}`,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Failed to start playback. Please try again.",
        variant: "destructive",
      })
    }
  }, [isPlaying, currentTime, timelineBlocks, tracks, toast])

  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0)
    setCurrentTime(newTime)

    // Sync media playback
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (videoRef.current) videoRef.current.currentTime = newTime

    toast({
      title: "Skipped Back",
      description: `Moved to ${formatTime(newTime)}`,
    })
  }, [currentTime, toast])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, totalDuration)
    setCurrentTime(newTime)

    // Sync media playback
    if (audioRef.current) audioRef.current.currentTime = newTime
    if (videoRef.current) videoRef.current.currentTime = newTime

    toast({
      title: "Skipped Forward",
      description: `Moved to ${formatTime(newTime)}`,
    })
  }, [currentTime, totalDuration, toast])

  const handleCutBlock = useCallback(async () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        try {
          const response = await fetch("/api/timeline/cut", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blockId: selectedBlock,
              cutTime: currentTime,
            }),
          })

          if (response.ok) {
            const { newBlocks } = await response.json()
            setTimelineBlocks((prev) => [...prev.filter((b) => b.id !== selectedBlock), ...newBlocks])

            toast({
              title: "Block Cut",
              description: `"${block.title}" has been split at ${formatTime(currentTime)}.`,
            })
          }
        } catch (error) {
          toast({
            title: "Cut Failed",
            description: "Failed to cut the block. Please try again.",
            variant: "destructive",
          })
        }
      }
    } else {
      toast({
        title: "No Block Selected",
        description: "Please select a timeline block to cut.",
        variant: "destructive",
      })
    }
  }, [selectedBlock, currentTime, timelineBlocks, toast])

  const handleCopyBlock = useCallback(() => {
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
  }, [selectedBlock, timelineBlocks, toast])

  const handleDeleteBlock = useCallback(() => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        setTimelineBlocks((prev) => prev.filter((b) => b.id !== selectedBlock))
        setSelectedBlock(null)

        toast({
          title: "Block Deleted",
          description: `"${block.title}" has been removed from timeline.`,
        })
      }
    } else {
      toast({
        title: "No Block Selected",
        description: "Please select a timeline block to delete.",
        variant: "destructive",
      })
    }
  }, [selectedBlock, timelineBlocks, toast])

  const handleSplitBlock = useCallback(() => {
    if (selectedBlock) {
      handleCutBlock()
    }
  }, [selectedBlock, handleCutBlock])

  const handleMergeBlocks = useCallback(() => {
    const selectedBlocks = timelineBlocks
      .filter((block) => block.trackId === timelineBlocks.find((b) => b.id === selectedBlock)?.trackId)
      .sort((a, b) => a.startTime - b.startTime)

    if (selectedBlocks.length >= 2) {
      toast({
        title: "Blocks Merged",
        description: `${selectedBlocks.length} blocks have been merged.`,
      })
    }
  }, [selectedBlock, timelineBlocks, toast])

  const handlePreviewBlock = useCallback(async () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block && block.mediaUrl) {
        try {
          // Load and preview the specific media
          if (block.mediaUrl.includes("video")) {
            if (videoRef.current) {
              videoRef.current.src = block.mediaUrl
              videoRef.current.currentTime = 0
              await videoRef.current.play()
            }
          } else if (block.mediaUrl.includes("audio")) {
            if (audioRef.current) {
              audioRef.current.src = block.mediaUrl
              audioRef.current.currentTime = 0
              await audioRef.current.play()
            }
          }

          toast({
            title: "Block Preview",
            description: `Previewing "${block.title}" - ${formatTime(block.duration)}`,
          })
        } catch (error) {
          toast({
            title: "Preview Error",
            description: "Failed to preview media. Check if the file exists.",
            variant: "destructive",
          })
        }
      }
    }
  }, [selectedBlock, timelineBlocks, toast])

  const handleAdvancedSettings = useCallback(() => {
    toast({
      title: "Advanced Settings",
      description: "Opening timeline configuration panel...",
    })
  }, [toast])

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0])

      // Apply volume to all media elements
      if (audioRef.current) audioRef.current.volume = value[0] / 100
      if (videoRef.current) videoRef.current.volume = value[0] / 100

      toast({
        title: "Volume Adjusted",
        description: `Audio level set to ${value[0]}%`,
      })
    },
    [toast],
  )

  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, visible: !track.visible } : track)))
  }, [])

  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, locked: !track.locked } : track)))
  }, [])

  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, muted: !track.muted } : track)))
  }, [])

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
      {/* Hidden media elements for playback */}
      <audio ref={audioRef} style={{ display: "none" }} />
      <video ref={videoRef} style={{ display: "none" }} />

      {/* Enhanced Timeline Controls */}
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
            <Button variant="outline" size="sm" onClick={handleSplitBlock}>
              <Split className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleMergeBlocks}>
              <Merge className="w-4 h-4" />
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
              max={5}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="w-20"
            />
            <span className="text-sm font-mono w-8">{zoom.toFixed(1)}x</span>
          </div>

          <Button variant={snapToGrid ? "default" : "outline"} size="sm" onClick={() => setSnapToGrid(!snapToGrid)}>
            Snap
          </Button>

          <Button variant="outline" size="sm" onClick={handleAdvancedSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Enhanced Track Headers */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleTrackVisibility(track.id)}
                >
                  {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleTrackLock(track.id)}>
                  {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
                {(track.type === "voiceover" || track.type === "music") && (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleTrackMute(track.id)}>
                    {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </Button>
                )}
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
                className="absolute top-0 w-0.5 h-full bg-red-500 z-10 cursor-pointer"
                style={{ left: `${(currentTime * 800 * zoom) / totalDuration}px` }}
                onClick={(e) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const newTime = (x / (800 * zoom)) * totalDuration
                  setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)))
                }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1"></div>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div ref={timelineRef}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`h-16 border-b relative ${track.visible ? "bg-muted/10" : "bg-muted/30"}`}
                >
                  {timelineBlocks
                    .filter((block) => block.trackId === track.id)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`absolute top-2 h-12 rounded cursor-pointer border-2 transition-all ${
                          selectedBlock === block.id ? "border-primary" : "border-transparent"
                        } ${track.locked ? "opacity-50" : ""}`}
                        style={{
                          left: `${getBlockPosition(block.startTime)}px`,
                          width: `${getBlockWidth(block.duration)}px`,
                          backgroundColor: track.color,
                          opacity: track.visible ? 1 : 0.3,
                        }}
                        onClick={() => !track.locked && setSelectedBlock(block.id)}
                        onDoubleClick={() => handlePreviewBlock()}
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

        {/* Enhanced Properties Panel */}
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
                        <Input
                          id="block-title"
                          value={block.title}
                          onChange={(e) => {
                            setTimelineBlocks((prev) =>
                              prev.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b)),
                            )
                          }}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-time" className="text-sm font-medium">
                            Start Time
                          </Label>
                          <Input
                            id="start-time"
                            value={formatTime(block.startTime)}
                            onChange={(e) => {
                              // Parse time format MM:SS back to seconds
                              const [mins, secs] = e.target.value.split(":").map(Number)
                              const totalSeconds = (mins || 0) * 60 + (secs || 0)
                              setTimelineBlocks((prev) =>
                                prev.map((b) => (b.id === block.id ? { ...b, startTime: totalSeconds } : b)),
                              )
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration" className="text-sm font-medium">
                            Duration
                          </Label>
                          <Input
                            id="duration"
                            value={formatTime(block.duration)}
                            onChange={(e) => {
                              // Parse time format MM:SS back to seconds
                              const [mins, secs] = e.target.value.split(":").map(Number)
                              const totalSeconds = (mins || 0) * 60 + (secs || 0)
                              setTimelineBlocks((prev) =>
                                prev.map((b) => (b.id === block.id ? { ...b, duration: totalSeconds } : b)),
                              )
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {block.language && (
                        <div>
                          <Label htmlFor="language" className="text-sm font-medium">
                            Language
                          </Label>
                          <Input
                            id="language"
                            value={block.language}
                            onChange={(e) => {
                              setTimelineBlocks((prev) =>
                                prev.map((b) => (b.id === block.id ? { ...b, language: e.target.value } : b)),
                              )
                            }}
                            className="mt-1"
                          />
                        </div>
                      )}

                      {block.volume !== undefined && (
                        <div>
                          <Label className="text-sm font-medium">Block Volume</Label>
                          <Slider
                            min={0}
                            max={100}
                            value={[block.volume]}
                            onValueChange={(value) => {
                              setTimelineBlocks((prev) =>
                                prev.map((b) => (b.id === block.id ? { ...b, volume: value[0] } : b)),
                              )
                            }}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{block.volume}%</span>
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
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" onClick={handleSplitBlock}>
                            <Split className="w-4 h-4 mr-1" />
                            Split
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCopyBlock}>
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
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

      {/* Enhanced Preview Panel */}
      <div className="h-20 border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <Slider min={0} max={100} value={[volume]} onValueChange={handleVolumeChange} className="w-20" />
              <span className="text-sm">{volume}%</span>
            </div>
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Maximize className="w-4 h-4 mr-2" />
              Preview Mode
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Timeline: {timelineBlocks.length} blocks • Duration: {formatTime(totalDuration)} • Zoom: {zoom.toFixed(1)}x
          </div>
        </div>
      </div>
    </div>
  )
}
