"use client"

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
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
  Languages,
  Mic,
  Music,
  Upload,
  Plus,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

interface TimelineEditorProps {
  pendingAudio?: { audioUrl: string, transcriptUrl: string, dialogue?: any[], addedToTimeline?: boolean } | null
  onPendingAudioProcessed?: () => void
}

export const TimelineEditor = forwardRef<unknown, TimelineEditorProps>((props, ref) => {
  const { pendingAudio, onPendingAudioProcessed } = props
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(180) // Will be calculated from blocks
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedAudioType, setSelectedAudioType] = useState<string>("")
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [resizingBlock, setResizingBlock] = useState<{id: string, edge: 'start' | 'end'} | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()


  // Function to add generated audio to timeline
  const addGeneratedAudioToTimeline = async (audioUrl: string, transcriptUrl: string, dialogue?: any[]) => {
    console.log('🎵 addGeneratedAudioToTimeline called with URL:', audioUrl, 'transcriptUrl:', transcriptUrl)

    // Calculate actual audio duration
    let actualDuration = 60 // fallback
    if (audioUrl) {
      try {
        // Add a small delay to ensure the file is ready
        await new Promise(resolve => setTimeout(resolve, 1000))

        const audio = new Audio()
        audio.preload = 'metadata'

        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0 && isFinite(audio.duration)) {
              actualDuration = Math.round(audio.duration)
              console.log('✅ Calculated generated audio duration:', actualDuration, 'seconds for', audioUrl)
            } else {
              console.warn('Invalid duration received:', audio.duration, 'for', audioUrl)
            }
            resolve(actualDuration)
          }

          audio.onerror = (e) => {
            console.warn('❌ Generated audio load error:', e, 'for URL:', audioUrl)
            resolve(actualDuration) // Use fallback
          }

          // Set src after adding event listeners
          audio.src = audioUrl
          console.log('Set audio src to:', audioUrl)

          // Timeout after 15 seconds (longer for generated audio)
          setTimeout(() => {
            console.warn('⏰ Generated audio duration calculation timeout, using fallback for', audioUrl)
            resolve(actualDuration)
          }, 15000)
        })
      } catch (error) {
        console.warn('❌ Could not calculate generated audio duration, using default:', error, 'for URL:', audioUrl)
      }
    } else {
      console.warn('❌ No audio URL provided for generated audio')
    }

    console.log('Creating timeline block with duration:', actualDuration)

    const newBlock: TimelineBlock = {
      id: `generated-${Date.now()}`,
      trackId: "voiceover",
      title: "AI Generated Discussion",
      startTime: currentTime,
      duration: actualDuration,
      language: "English",
      status: "ready",
      mediaUrl: audioUrl,
      volume: 85,
    }

    // Use functional update to prevent potential re-render issues
    setTimelineBlocks(prev => {
      const updated = [...prev, newBlock]
      console.log('🎵 Added generated audio block to timeline:', newBlock)
      console.log('🎵 Timeline blocks now:', updated.length, 'total blocks')
      return updated
    })

    // Don't show toast here to avoid conflicts with the main page toast
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addGeneratedAudio: addGeneratedAudioToTimeline
  }))

  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: "dialogue",
      name: "AI Dialogue",
      type: "voiceover",
      visible: true,
      locked: false,
      color: "#059669",
      volume: 85,
      muted: false,
    },
    {
      id: "voiceover",
      name: "Voice Narration",
      type: "voiceover",
      visible: true,
      locked: false,
      color: "#2563eb",
      volume: 90,
      muted: false,
    },
    {
      id: "music",
      name: "Background Music",
      type: "music",
      visible: true,
      locked: false,
      color: "#7c3aed",
      volume: 35,
      muted: false,
    },
    {
      id: "sfx",
      name: "Sound Effects",
      type: "music",
      visible: false,
      locked: false,
      color: "#ea580c",
      volume: 60,
      muted: false,
    },
    {
      id: "transitions",
      name: "Audio Transitions",
      type: "music",
      visible: false,
      locked: false,
      color: "#dc2626",
      volume: 70,
      muted: false,
    },
  ])

  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([])

  // Load timeline blocks from localStorage on mount
  useEffect(() => {
    const savedBlocks = localStorage.getItem('timelineBlocks')
    if (savedBlocks) {
      try {
        const parsed = JSON.parse(savedBlocks)
        setTimelineBlocks(parsed)
      } catch (error) {
        console.error('Failed to load timeline blocks from localStorage:', error)
        // Fallback to default blocks
        setTimelineBlocks([
          {
            id: "dialogue-1",
            trackId: "dialogue",
            title: "AI Discussion - Part 1",
            startTime: 0,
            duration: 25,
            language: "English",
            status: "ready",
            mediaUrl: "/api/audio/download/generated_discussion_1.mp3",
            volume: 85,
          },
          {
            id: "dialogue-2",
            trackId: "dialogue",
            title: "AI Discussion - Part 2",
            startTime: 25,
            duration: 35,
            language: "English",
            status: "ready",
            mediaUrl: "/api/audio/download/generated_discussion_2.mp3",
            volume: 85,
          },
          {
            id: "voice-1",
            trackId: "voiceover",
            title: "Opening Narration",
            startTime: 0,
            duration: 15,
            language: "Hindi",
            status: "ready",
            mediaUrl: "/api/audio/download/opening_narration.mp3",
            volume: 90,
          },
          {
            id: "voice-2",
            trackId: "voiceover",
            title: "Key Insights",
            startTime: 40,
            duration: 20,
            language: "English",
            status: "processing",
            mediaUrl: "/api/audio/download/key_insights.mp3",
            volume: 88,
          },
          {
            id: "music-bg",
            trackId: "music",
            title: "Ambient Background",
            startTime: 0,
            duration: 60,
            status: "ready",
            mediaUrl: "/api/audio/download/ambient_bg.mp3",
            volume: 35,
          },
          {
            id: "sfx-transition",
            trackId: "sfx",
            title: "Smooth Transition",
            startTime: 25,
            duration: 3,
            status: "ready",
            mediaUrl: "/api/audio/download/transition_sfx.mp3",
            volume: 60,
          },
        ])
      }
    } else {
      // No saved blocks, use default
      setTimelineBlocks([
        {
          id: "dialogue-1",
          trackId: "dialogue",
          title: "AI Discussion - Part 1",
          startTime: 0,
          duration: 25,
          language: "English",
          status: "ready",
          mediaUrl: "/api/audio/download/generated_discussion_1.mp3",
          volume: 85,
        },
        {
          id: "dialogue-2",
          trackId: "dialogue",
          title: "AI Discussion - Part 2",
          startTime: 25,
          duration: 35,
          language: "English",
          status: "ready",
          mediaUrl: "/api/audio/download/generated_discussion_2.mp3",
          volume: 85,
        },
        {
          id: "voice-1",
          trackId: "voiceover",
          title: "Opening Narration",
          startTime: 0,
          duration: 15,
          language: "Hindi",
          status: "ready",
          mediaUrl: "/api/audio/download/opening_narration.mp3",
          volume: 90,
        },
        {
          id: "voice-2",
          trackId: "voiceover",
          title: "Key Insights",
          startTime: 40,
          duration: 20,
          language: "English",
          status: "processing",
          mediaUrl: "/api/audio/download/key_insights.mp3",
          volume: 88,
        },
        {
          id: "music-bg",
          trackId: "music",
          title: "Ambient Background",
          startTime: 0,
          duration: 60,
          status: "ready",
          mediaUrl: "/api/audio/download/ambient_bg.mp3",
          volume: 35,
        },
        {
          id: "sfx-transition",
          trackId: "sfx",
          title: "Smooth Transition",
          startTime: 25,
          duration: 3,
          status: "ready",
          mediaUrl: "/api/audio/download/transition_sfx.mp3",
          volume: 60,
        },
      ])
    }
  }, [])

  // Calculate total duration from blocks
  useEffect(() => {
    if (timelineBlocks.length > 0) {
      const maxEndTime = Math.max(
        ...timelineBlocks.map(block => block.startTime + block.duration),
        180 // Minimum 3 minutes
      )
      setTotalDuration(Math.ceil(maxEndTime / 10) * 10) // Round up to nearest 10 seconds
    }
  }, [timelineBlocks])

  // Save timeline blocks to localStorage when they change
  useEffect(() => {
    if (timelineBlocks.length > 0) {
      localStorage.setItem('timelineBlocks', JSON.stringify(timelineBlocks))
    }
  }, [timelineBlocks])

  // Initialize audio elements for each block
  useEffect(() => {
    timelineBlocks.forEach(block => {
      if (block.mediaUrl && !audioElementsRef.current.has(block.id)) {
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = block.mediaUrl
        audio.volume = (block.volume || 80) / 100
        audioElementsRef.current.set(block.id, audio)
      }
    })

    // Cleanup removed blocks
    const blockIds = new Set(timelineBlocks.map(b => b.id))
    audioElementsRef.current.forEach((audio, id) => {
      if (!blockIds.has(id)) {
        audio.pause()
        audio.src = ''
        audioElementsRef.current.delete(id)
      }
    })
  }, [timelineBlocks])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioElementsRef.current.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      audioElementsRef.current.clear()
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [])

  // Process pending audio when component mounts
  useEffect(() => {
    console.log('🎵 TimelineEditor useEffect triggered, pendingAudio:', pendingAudio)
    if (pendingAudio && !pendingAudio.addedToTimeline) {
      console.log('🎵 Processing pending audio in TimelineEditor:', pendingAudio)
      addGeneratedAudioToTimeline(pendingAudio.audioUrl, pendingAudio.transcriptUrl, pendingAudio.dialogue)
      onPendingAudioProcessed?.()
      console.log('🎵 Pending audio processed and callback called')
    } else {
      console.log('🎵 No pending audio to process or already processed')
    }
  }, [pendingAudio, onPendingAudioProcessed])

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
        // Pause all audio elements
        audioElementsRef.current.forEach(audio => {
          audio.pause()
        })
        
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current)
          playbackIntervalRef.current = null
        }
        
        setIsPlaying(false)
        toast({
          title: "Playback Paused",
          description: `Timeline paused at ${formatTime(currentTime)}`,
        })
      } else {
        // Start playback - play all active blocks at their start times
        const activeBlocks = timelineBlocks.filter((block) => {
          const track = tracks.find((t) => t.id === block.trackId)
          return track?.visible && !track?.locked && !track?.muted && block.mediaUrl
        })

        // Calculate which blocks should be playing at currentTime
        const blocksToPlay = activeBlocks.filter(block => {
          const blockStart = block.startTime
          const blockEnd = block.startTime + block.duration
          return currentTime >= blockStart && currentTime < blockEnd
        })

        // Start playing blocks that should be active
        blocksToPlay.forEach(block => {
          const audio = audioElementsRef.current.get(block.id)
          if (audio) {
            const track = tracks.find(t => t.id === block.trackId)
            const blockVolume = (block.volume || 80) / 100
            const trackVolume = (track?.volume || 100) / 100
            audio.volume = blockVolume * trackVolume
            audio.currentTime = currentTime - block.startTime
            audio.play().catch(err => {
              console.error(`Failed to play block ${block.id}:`, err)
            })
          }
        })

        // Start playback interval to update currentTime and manage block playback
        setIsPlaying(true)
        playbackIntervalRef.current = setInterval(() => {
          setCurrentTime(prev => {
            const newTime = prev + 0.1
            
            // Check which blocks should start/stop
            activeBlocks.forEach(block => {
              const audio = audioElementsRef.current.get(block.id)
              if (!audio) return
              
              const blockStart = block.startTime
              const blockEnd = block.startTime + block.duration
              const track = tracks.find(t => t.id === block.trackId)
              
              if (newTime >= blockStart && newTime < blockEnd) {
                // Block should be playing
                if (audio.paused) {
                  const blockVolume = (block.volume || 80) / 100
                  const trackVolume = (track?.volume || 100) / 100
                  audio.volume = blockVolume * trackVolume
                  audio.currentTime = newTime - blockStart
                  audio.play().catch(err => console.error(`Play error for ${block.id}:`, err))
                } else {
                  // Update volume in case it changed
                  const blockVolume = (block.volume || 80) / 100
                  const trackVolume = (track?.volume || 100) / 100
                  audio.volume = blockVolume * trackVolume
                }
              } else {
                // Block should be stopped
                if (!audio.paused) {
                  audio.pause()
                }
              }
            })
            
            if (newTime >= totalDuration) {
              // Reached end, stop playback
              audioElementsRef.current.forEach(audio => audio.pause())
              if (playbackIntervalRef.current) {
                clearInterval(playbackIntervalRef.current)
                playbackIntervalRef.current = null
              }
              setIsPlaying(false)
              return totalDuration
            }
            
            return newTime
          })
        }, 100)

        toast({
          title: "Playback Started",
          description: `Timeline playing from ${formatTime(currentTime)}`,
        })
      }
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Failed to start playback. Please try again.",
        variant: "destructive",
      })
    }
  }, [isPlaying, currentTime, timelineBlocks, tracks, totalDuration, toast])

  const handleSkipBack = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0)
    setCurrentTime(newTime)
    
    // If playing, update all audio elements
    if (isPlaying) {
      const activeBlocks = timelineBlocks.filter((block) => {
        const track = tracks.find((t) => t.id === block.trackId)
        return track?.visible && !track?.locked && !track?.muted && block.mediaUrl
      })
      
      activeBlocks.forEach(block => {
        const audio = audioElementsRef.current.get(block.id)
        if (audio) {
          const blockStart = block.startTime
          const blockEnd = block.startTime + block.duration
          if (newTime >= blockStart && newTime < blockEnd) {
            audio.currentTime = newTime - blockStart
          } else {
            audio.pause()
          }
        }
      })
    }
  }, [currentTime, isPlaying, timelineBlocks, tracks])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, totalDuration)
    setCurrentTime(newTime)
    
    // If playing, update all audio elements
    if (isPlaying) {
      const activeBlocks = timelineBlocks.filter((block) => {
        const track = tracks.find((t) => t.id === block.trackId)
        return track?.visible && !track?.locked && !track?.muted && block.mediaUrl
      })
      
      activeBlocks.forEach(block => {
        const audio = audioElementsRef.current.get(block.id)
        if (audio) {
          const blockStart = block.startTime
          const blockEnd = block.startTime + block.duration
          if (newTime >= blockStart && newTime < blockEnd) {
            audio.currentTime = newTime - blockStart
            if (audio.paused) {
              audio.play().catch(err => console.error(`Play error:`, err))
            }
          } else {
            audio.pause()
          }
        }
      })
    }
  }, [currentTime, totalDuration, isPlaying, timelineBlocks, tracks])

  const handleCutBlock = useCallback(() => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block) {
        const blockStart = block.startTime
        const blockEnd = block.startTime + block.duration
        
        // Check if currentTime is within block range
        if (currentTime > blockStart && currentTime < blockEnd) {
          const firstPartDuration = currentTime - blockStart
          const secondPartDuration = blockEnd - currentTime
          
          // Create two new blocks
          const firstBlock: TimelineBlock = {
            ...block,
            id: `${block.id}-part1`,
            duration: firstPartDuration,
          }
          
          const secondBlock: TimelineBlock = {
            ...block,
            id: `${block.id}-part2`,
            startTime: currentTime,
            duration: secondPartDuration,
          }
          
          setTimelineBlocks((prev) => [
            ...prev.filter((b) => b.id !== selectedBlock),
            firstBlock,
            secondBlock,
          ])
          
          setSelectedBlock(secondBlock.id)
          
          toast({
            title: "Block Cut",
            description: `"${block.title}" has been split at ${formatTime(currentTime)}.`,
          })
        } else {
          toast({
            title: "Invalid Cut Position",
            description: `Cut time must be within the block (${formatTime(blockStart)} - ${formatTime(blockEnd)}).`,
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
    if (!selectedBlock) {
      toast({
        title: "No Block Selected",
        description: "Please select a block to merge with adjacent blocks.",
        variant: "destructive",
      })
      return
    }

    const selectedBlockData = timelineBlocks.find((b) => b.id === selectedBlock)
    if (!selectedBlockData) return

    // Find blocks on the same track
    const sameTrackBlocks = timelineBlocks
      .filter((block) => block.trackId === selectedBlockData.trackId && block.id !== selectedBlock)
      .sort((a, b) => a.startTime - b.startTime)

    // Find adjacent blocks (touching or overlapping)
    const adjacentBlocks = sameTrackBlocks.filter(block => {
      const blockEnd = block.startTime + block.duration
      const selectedEnd = selectedBlockData.startTime + selectedBlockData.duration
      return (
        (block.startTime <= selectedBlockData.startTime && blockEnd >= selectedBlockData.startTime) ||
        (block.startTime <= selectedEnd && blockEnd >= selectedEnd) ||
        (block.startTime >= selectedBlockData.startTime && blockEnd <= selectedEnd)
      )
    })

    if (adjacentBlocks.length === 0) {
      toast({
        title: "No Adjacent Blocks",
        description: "No adjacent blocks found on the same track to merge.",
        variant: "destructive",
      })
      return
    }

    // Merge all blocks
    const allBlocks = [selectedBlockData, ...adjacentBlocks].sort((a, b) => a.startTime - b.startTime)
    const mergedStart = allBlocks[0].startTime
    const mergedEnd = Math.max(...allBlocks.map(b => b.startTime + b.duration))
    const mergedDuration = mergedEnd - mergedStart

    const mergedBlock: TimelineBlock = {
      ...selectedBlockData,
      id: `merged-${Date.now()}`,
      title: `${selectedBlockData.title} (Merged)`,
      startTime: mergedStart,
      duration: mergedDuration,
    }

    const blocksToRemove = [selectedBlock, ...adjacentBlocks.map(b => b.id)]
    setTimelineBlocks((prev) => [
      ...prev.filter((b) => !blocksToRemove.includes(b.id)),
      mergedBlock,
    ])

    setSelectedBlock(mergedBlock.id)

    toast({
      title: "Blocks Merged",
      description: `${allBlocks.length} blocks have been merged into one.`,
    })
  }, [selectedBlock, timelineBlocks, toast])

  const handlePasteBlock = useCallback(() => {
    if (copiedBlock) {
      const originalBlock = timelineBlocks.find((b) => b.id === copiedBlock)
      if (originalBlock) {
        const newBlock: TimelineBlock = {
          ...originalBlock,
          id: `pasted-${Date.now()}`,
          title: `${originalBlock.title} (Copy)`,
          startTime: currentTime,
        }

        setTimelineBlocks((prev) => [...prev, newBlock])
        setSelectedBlock(newBlock.id)

        toast({
          title: "Block Pasted",
          description: `"${originalBlock.title}" has been pasted at ${formatTime(currentTime)}.`,
        })
      }
    } else {
      toast({
        title: "No Block to Paste",
        description: "Copy a block first before pasting.",
        variant: "destructive",
      })
    }
  }, [copiedBlock, timelineBlocks, currentTime, toast])

  const handlePreviewBlock = useCallback(async () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block && block.mediaUrl) {
        try {
          // Stop all other playback
          audioElementsRef.current.forEach(audio => audio.pause())
          if (isPlaying) {
            setIsPlaying(false)
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current)
              playbackIntervalRef.current = null
            }
          }

          // Get or create audio element for this block
          let audio = audioElementsRef.current.get(block.id)
          if (!audio) {
            audio = new Audio()
            audio.preload = 'auto'
            audioElementsRef.current.set(block.id, audio)
          }

          audio.src = block.mediaUrl
          audio.currentTime = 0
          audio.volume = (block.volume || 80) / 100

          // Wait for audio to be ready
          await new Promise((resolve, reject) => {
            const onCanPlay = () => {
              audio?.removeEventListener('canplay', onCanPlay)
              audio?.removeEventListener('error', onError)
              resolve(true)
            }
            const onError = (e: any) => {
              audio?.removeEventListener('canplay', onCanPlay)
              audio?.removeEventListener('error', onError)
              reject(new Error('Audio load failed'))
            }

            audio?.addEventListener('canplay', onCanPlay)
            audio?.addEventListener('error', onError)

            setTimeout(() => {
              audio?.removeEventListener('canplay', onCanPlay)
              audio?.removeEventListener('error', onError)
              reject(new Error('Audio load timeout'))
            }, 5000)
          })

          await audio.play()

          toast({
            title: "Block Preview",
            description: `Previewing "${block.title}" - ${formatTime(block.duration)}`,
          })
        } catch (error) {
          console.error('Preview error:', error)
          toast({
            title: "Preview Error",
            description: `Failed to preview media: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          })
        }
      }
    }
  }, [selectedBlock, timelineBlocks, isPlaying, toast])

  const handleAdvancedSettings = useCallback(() => {
    toast({
      title: "Advanced Settings",
      description: "Opening timeline configuration panel...",
    })
  }, [toast])

  const handleLanguageChange = useCallback(async () => {
    if (selectedBlock) {
      const block = timelineBlocks.find((b) => b.id === selectedBlock)
      if (block && block.language) {
        try {
          // Here you would call an API to regenerate the audio in the new language
          toast({
            title: "Language Change",
            description: `Regenerating "${block.title}" in ${block.language}...`,
          })

          // Simulate API call
          setTimeout(() => {
            toast({
              title: "Language Updated",
              description: `"${block.title}" has been regenerated in ${block.language}.`,
            })
          }, 2000)
        } catch (error) {
          toast({
            title: "Language Change Failed",
            description: "Failed to regenerate audio in new language.",
            variant: "destructive",
          })
        }
      }
    }
  }, [selectedBlock, timelineBlocks, toast])

  const handleFileUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if it's an audio file
      const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']
      if (!audioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an audio file (MP3, WAV, OGG, AAC, M4A).",
          variant: "destructive",
        })
        return
      }

      setUploadingFile(file)
      setUploadDialogOpen(true)
    }
  }, [toast])

  const handleAudioTypeConfirm = useCallback(async () => {
    if (!uploadingFile || !selectedAudioType) {
      toast({
        title: "Missing Information",
        description: "Please select an audio type.",
        variant: "destructive",
      })
      return
    }

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', uploadingFile)
      formData.append('audioType', selectedAudioType)

      // Generate CSRF token
      const csrfToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Upload to audio API
      const response = await fetch('/api/audio/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      if (response.ok) {
        const result = await response.json()

        // Calculate actual audio duration
        let actualDuration = 10 // fallback
        const audioUrl = result.data?.audioUrl || result.audioUrl

        if (audioUrl) {
          try {
            const audio = new Audio()
            audio.preload = 'metadata'

            await new Promise((resolve, reject) => {
              audio.onloadedmetadata = () => {
                if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                  actualDuration = Math.round(audio.duration)
                  console.log('Calculated audio duration:', actualDuration, 'seconds for', audioUrl)
                }
                resolve(actualDuration)
              }

              audio.onerror = (e) => {
                console.warn('Audio load error:', e, 'for URL:', audioUrl)
                resolve(actualDuration) // Use fallback
              }

              // Set src after adding event listeners
              audio.src = audioUrl

              // Timeout after 10 seconds
              setTimeout(() => {
                console.warn('Audio duration calculation timeout, using fallback for', audioUrl)
                resolve(actualDuration)
              }, 10000)
            })
          } catch (error) {
            console.warn('Could not calculate audio duration, using default:', error, 'for URL:', audioUrl)
          }
        } else {
          console.warn('No audio URL provided in result:', result)
        }

        // Add the uploaded audio to the timeline
        const newBlock: TimelineBlock = {
          id: `uploaded-${Date.now()}`,
          trackId: selectedAudioType.toLowerCase().replace(' ', '-'),
          title: uploadingFile.name,
          startTime: currentTime,
          duration: actualDuration,
          language: "English", // Default language
          status: "ready",
          mediaUrl: audioUrl,
          volume: selectedAudioType.includes('Music') ? 35 : selectedAudioType.includes('Effects') ? 60 : 85,
        }

        setTimelineBlocks(prev => [...prev, newBlock])

        toast({
          title: "Audio Uploaded",
          description: `"${uploadingFile.name}" added to ${selectedAudioType} track.`,
        })

        // Reset state
        setUploadDialogOpen(false)
        setSelectedAudioType("")
        setUploadingFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload audio file. Please try again.",
        variant: "destructive",
      })
    }
  }, [uploadingFile, selectedAudioType, currentTime, toast])


  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, visible: !track.visible } : track)))
  }, [])

  const toggleTrackLock = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, locked: !track.locked } : track)))
  }, [])

  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, muted: !track.muted } : track)))
    
    // Update audio volumes for blocks on this track
    const track = tracks.find(t => t.id === trackId)
    if (track) {
      timelineBlocks
        .filter(block => block.trackId === trackId)
        .forEach(block => {
          const audio = audioElementsRef.current.get(block.id)
          if (audio) {
            const blockVolume = (block.volume || 80) / 100
            const trackVolume = (track.volume || 100) / 100
            audio.volume = !track.muted ? blockVolume * trackVolume : 0
          }
        })
    }
  }, [tracks, timelineBlocks])

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, volume } : track)))
    
    // Update audio volumes for blocks on this track
    timelineBlocks
      .filter(block => block.trackId === trackId)
      .forEach(block => {
        const audio = audioElementsRef.current.get(block.id)
        if (audio) {
          const blockVolume = (block.volume || 80) / 100
          const trackVolume = volume / 100
          const track = tracks.find(t => t.id === trackId)
          audio.volume = track?.muted ? 0 : blockVolume * trackVolume
        }
      })
  }, [timelineBlocks, tracks])

  // Handle drag and drop
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    if (e.button !== 0) return // Only left mouse button
    const block = timelineBlocks.find(b => b.id === blockId)
    if (!block) return
    
    const track = tracks.find(t => t.id === block.trackId)
    if (track?.locked) return
    
    // Don't start drag if clicking on resize handle
    const target = e.target as HTMLElement
    if (target.classList.contains('cursor-ew-resize')) return
    
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDraggedBlock(blockId)
    
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const startX = e.clientX - rect.left
    const blockStartX = (block.startTime / totalDuration) * 800 * zoom
    setDragOffset(startX - blockStartX)
  }, [timelineBlocks, tracks, zoom, totalDuration])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedBlock || !timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset
    const newStartTime = Math.max(0, (x / (800 * zoom)) * totalDuration)
    
    const snapTime = snapToGrid ? Math.round(newStartTime / 1) * 1 : newStartTime
    
    setTimelineBlocks(prev => prev.map(block => 
      block.id === draggedBlock 
        ? { ...block, startTime: Math.max(0, snapTime) }
        : block
    ))
  }, [isDragging, draggedBlock, dragOffset, zoom, totalDuration, snapToGrid])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      setDraggedBlock(null)
      setDragOffset(0)
    }
    if (resizingBlock) {
      setResizingBlock(null)
    }
  }, [isDragging, resizingBlock])

  useEffect(() => {
    if (isDragging && !resizingBlock) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e)
      const handleUp = () => handleMouseUp()
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [isDragging, resizingBlock, handleMouseMove, handleMouseUp])

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent, blockId: string, edge: 'start' | 'end') => {
    e.stopPropagation()
    e.preventDefault()
    setResizingBlock({ id: blockId, edge })
    setIsDragging(true)
  }, [])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingBlock || !timelineRef.current) return
    
    const block = timelineBlocks.find(b => b.id === resizingBlock.id)
    if (!block) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const timeAtX = (x / (800 * zoom)) * totalDuration
    const snapTime = snapToGrid ? Math.round(timeAtX / 1) * 1 : timeAtX
    
    setTimelineBlocks(prev => prev.map(b => {
      if (b.id !== resizingBlock.id) return b
      
      if (resizingBlock.edge === 'start') {
        const newStart = Math.max(0, Math.min(snapTime, b.startTime + b.duration - 1))
        const newDuration = b.duration + (b.startTime - newStart)
        return { ...b, startTime: newStart, duration: newDuration }
      } else {
        const newDuration = Math.max(1, snapTime - b.startTime)
        return { ...b, duration: newDuration }
      }
    }))
  }, [resizingBlock, timelineBlocks, zoom, totalDuration, snapToGrid])

  useEffect(() => {
    if (resizingBlock) {
      const handleMove = (e: MouseEvent) => handleResizeMove(e)
      const handleUp = () => {
        setResizingBlock(null)
        setIsDragging(false)
      }
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [resizingBlock, handleResizeMove])

  // Handle timeline scrubbing
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Don't scrub if clicking on a block
    const target = e.target as HTMLElement
    if (target.closest('[data-timeline-block]')) return
    
    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = Math.max(0, Math.min((x / (800 * zoom)) * totalDuration, totalDuration))
    setCurrentTime(newTime)
    
    // If playing, update audio positions
    if (isPlaying) {
      const activeBlocks = timelineBlocks.filter((block) => {
        const track = tracks.find((t) => t.id === block.trackId)
        return track?.visible && !track?.locked && !track?.muted && block.mediaUrl
      })
      
      activeBlocks.forEach(block => {
        const audio = audioElementsRef.current.get(block.id)
        if (audio) {
          const blockStart = block.startTime
          const blockEnd = block.startTime + block.duration
          if (newTime >= blockStart && newTime < blockEnd) {
            audio.currentTime = newTime - blockStart
            if (audio.paused) {
              audio.play().catch(err => console.error(`Play error:`, err))
            }
          } else {
            audio.pause()
          }
        }
      })
    }
  }, [zoom, totalDuration, isPlaying, timelineBlocks, tracks])

  return (
    <div className="h-[700px] w-full flex flex-col bg-background">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Audio Type Selection Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Audio Type</DialogTitle>
            <DialogDescription>
              What type of audio is "{uploadingFile?.name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "dialogue", label: "AI Dialogue", description: "Generated AI conversations and discussions" },
                { id: "voiceover", label: "Voice Narration", description: "Professional voice recordings and narration" },
                { id: "music", label: "Background Music", description: "Ambient music and background audio" },
                { id: "sfx", label: "Sound Effects", description: "Sound effects and audio transitions" },
                { id: "transitions", label: "Audio Transitions", description: "Smooth audio transitions and fades" },
              ].map((type) => (
                <div
                  key={type.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAudioType === type.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAudioType(type.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAudioType === type.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {selectedAudioType === type.id && (
                        <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAudioTypeConfirm} disabled={!selectedAudioType}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Timeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              disabled={zoom <= 0.5}
            >
              −
            </Button>
            <div className="text-sm text-muted-foreground w-16 text-center">
              {zoom.toFixed(1)}x
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
              disabled={zoom >= 4}
            >
              +
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleFileUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Audio
          </Button>

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
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-semibold">Audio Tracks</span>
            </div>
          </div>
          {tracks.map((track) => (
            <div key={track.id} className="h-20 border-b flex flex-col px-4 py-2 bg-card">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }}></div>
                <span className="text-sm font-medium flex-1">{track.name}</span>
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
              {(track.type === "voiceover" || track.type === "music") && (
                <div className="flex items-center gap-2 mt-1">
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                  <Slider
                    value={[track.volume]}
                    onValueChange={(value) => handleTrackVolumeChange(track.id, value[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1 h-2"
                    disabled={track.muted}
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{track.volume}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: `${800 * zoom}px` }}>
            {/* Time Ruler */}
            <div 
              className="h-12 border-b bg-card relative cursor-pointer"
              onClick={handleTimelineClick}
            >
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex flex-col justify-between text-xs text-muted-foreground pointer-events-none"
                  style={{ left: `${(i * 10 * 800 * zoom) / totalDuration}px` }}
                >
                  <div className="border-l border-border h-2"></div>
                  <span className="px-1">{formatTime(i * 10)}</span>
                  <div className="border-l border-border h-2"></div>
                </div>
              ))}

              {/* Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500 z-10 pointer-events-none"
                style={{ left: `${(currentTime * 800 * zoom) / totalDuration}px` }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1"></div>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div ref={timelineRef} onClick={handleTimelineClick}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`h-20 border-b relative ${track.visible ? "bg-muted/10" : "bg-muted/30"}`}
                >
                  {timelineBlocks
                    .filter((block) => block.trackId === track.id)
                    .map((block) => (
                      <div
                        key={block.id}
                        data-timeline-block
                        className={`absolute top-2 h-12 rounded cursor-move border-2 transition-all ${
                          selectedBlock === block.id ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                        } ${track.locked ? "opacity-50 cursor-not-allowed" : ""} ${isDragging && draggedBlock === block.id ? "opacity-80" : ""}`}
                        style={{
                          left: `${getBlockPosition(block.startTime)}px`,
                          width: `${getBlockWidth(block.duration)}px`,
                          backgroundColor: track.color,
                          opacity: track.visible ? 1 : 0.3,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!track.locked) setSelectedBlock(block.id)
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          if (!track.locked) handlePreviewBlock()
                        }}
                        onMouseDown={(e) => {
                          if (!track.locked) handleBlockMouseDown(e, block.id)
                        }}
                      >
                        <div className="p-2 h-full flex flex-col justify-between text-white text-xs relative">
                          {/* Resize handles */}
                          {!track.locked && selectedBlock === block.id && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  handleResizeStart(e, block.id, 'start')
                                }}
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-10"
                                onMouseDown={(e) => {
                                  e.stopPropagation()
                                  handleResizeStart(e, block.id, 'end')
                                }}
                              />
                            </>
                          )}
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
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Audio Properties</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {selectedBlock ? (
              <>
                {(() => {
                  const block = timelineBlocks.find((b) => b.id === selectedBlock)
                  if (!block) {
                    // Clear invalid selectedBlock to prevent loops
                    setSelectedBlock(null)
                    return (
                      <div className="text-center text-muted-foreground">
                        <p>Block not found. Please select a valid timeline block.</p>
                      </div>
                    )
                  }

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

                      <div>
                        <Label htmlFor="language" className="text-sm font-medium">
                          Language
                        </Label>
                        <Select
                          value={block.language || ""}
                          onValueChange={(value) => {
                            setTimelineBlocks((prev) =>
                              prev.map((b) => (b.id === block.id ? { ...b, language: value } : b)),
                            )
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                            <SelectItem value="Marathi">Marathi</SelectItem>
                            <SelectItem value="Gujarati">Gujarati</SelectItem>
                            <SelectItem value="Urdu">Urdu</SelectItem>
                            <SelectItem value="Kannada">Kannada</SelectItem>
                            <SelectItem value="Odia">Odia</SelectItem>
                            <SelectItem value="Malayalam">Malayalam</SelectItem>
                            <SelectItem value="Punjabi">Punjabi</SelectItem>
                            <SelectItem value="Assamese">Assamese</SelectItem>
                            <SelectItem value="Maithili">Maithili</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>


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

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Volume</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[block.volume || 80]}
                            onValueChange={(value) => {
                              setTimelineBlocks((prev) =>
                                prev.map((b) => (b.id === block.id ? { ...b, volume: value[0] } : b))
                              )
                              // Update audio element volume if it exists
                              const audio = audioElementsRef.current.get(block.id)
                              if (audio) {
                                const track = tracks.find(t => t.id === block.trackId)
                                const trackVolume = (track?.volume || 100) / 100
                                audio.volume = (value[0] / 100) * trackVolume
                              }
                            }}
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm w-12 text-right">{block.volume || 80}%</span>
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
                          <Button variant="outline" size="sm" onClick={handlePasteBlock}>
                            <Plus className="w-4 h-4 mr-1" />
                            Paste
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleLanguageChange}
                          >
                            <Languages className="w-4 h-4 mr-2" />
                            Regenerate in Language
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
})

TimelineEditor.displayName = "TimelineEditor"
