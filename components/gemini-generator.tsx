"use client"

import { useState, useRef, useEffect } from "react"
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
import { useLanguage } from "@/lib/contexts/language-context"

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
  templateUsed?: string // Add template information
}

interface GeminiGeneratorProps {
  scriptText?: string
  projectId?: string // Add projectId prop
  onAudioGenerated?: (audioUrl: string, transcriptUrl: string, dialogue?: any[]) => void
  onNavigateToTimeline?: () => void
}

interface VoicePersona {
  id: string
  name: string
  gender: 'male' | 'female'
  voiceType: string
  sampleUrl?: string
}

const defaultPersonas: VoicePersona[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    gender: 'female',
    voiceType: 'professional'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    gender: 'male',
    voiceType: 'authoritative'
  },
  {
    id: '3',
    name: 'Emma Thompson',
    gender: 'female',
    voiceType: 'engaging'
  }
]

export function GeminiGenerator({ 
  scriptText: propScriptText, 
  projectId, // Add projectId prop
  onAudioGenerated,
  onNavigateToTimeline
}: GeminiGeneratorProps) {
  const { language: uiLanguage, t } = useLanguage()
  const [scriptText, setScriptText] = useState(propScriptText || '')
  const [numHosts, setNumHosts] = useState(3)
  const [discussionTime, setDiscussionTime] = useState(60)
  const [personas, setPersonas] = useState<VoicePersona[]>(defaultPersonas)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null)
  const [playingSample, setPlayingSample] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update script text when prop changes
  useEffect(() => {
    if (propScriptText) {
      setScriptText(propScriptText)
    }
  }, [propScriptText])

  // Restore persisted audio data on component mount
  useEffect(() => {
    const restorePersistedAudioData = () => {
      const persistedAudioData = localStorage.getItem('persistedAudioData')
      if (persistedAudioData) {
        try {
          const audioData = JSON.parse(persistedAudioData)
          // Only restore if data is not too old (e.g., less than 24 hours)
          if (Date.now() - audioData.timestamp < 24 * 60 * 60 * 1000) {
            // Create audio result from persisted data
            const result: AudioResult = {
              success: true,
              audioUrl: audioData.audioUrl,
              transcriptUrl: audioData.transcriptUrl,
              dialogue: audioData.dialogue,
              summary: audioData.summary,
              personas: audioData.personas,
              templateUsed: audioData.templateUsed
            }
            setAudioResult(result)
          } else {
            // Remove old data
            localStorage.removeItem('persistedAudioData')
          }
        } catch (e) {
          console.error('Failed to restore persisted audio data:', e)
          localStorage.removeItem('persistedAudioData')
        }
      }
    }

    restorePersistedAudioData()

    // Listen for storage changes (e.g., when data is cleared on logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'persistedAudioData') {
        if (e.newValue === null) {
          // Data was cleared (e.g., on logout)
          setAudioResult(null);
        } else {
          // Data was updated
          try {
            const audioData = JSON.parse(e.newValue);
            const result: AudioResult = {
              success: true,
              audioUrl: audioData.audioUrl,
              transcriptUrl: audioData.transcriptUrl,
              dialogue: audioData.dialogue,
              summary: audioData.summary,
              personas: audioData.personas,
              templateUsed: audioData.templateUsed
            };
            setAudioResult(result);
          } catch (error) {
            console.error('Failed to parse updated audio data:', error);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [])

  const updateNumHosts = (num: number) => {
    setNumHosts(num)
    
    // Adjust personas array size
    if (num > personas.length) {
      // Add new personas
      const newPersonas = [...personas]
      for (let i = personas.length; i < num; i++) {
        newPersonas.push({
          id: `${i + 1}`,
          name: `Host ${i + 1}`,
          gender: i % 2 === 0 ? 'male' : 'female',
          voiceType: 'professional'
        })
      }
      setPersonas(newPersonas)
    } else if (num < personas.length) {
      // Remove excess personas
      setPersonas(personas.slice(0, num))
    }
  }

  const updatePersona = (index: number, field: keyof VoicePersona, value: string) => {
    const updatedPersonas = [...personas]
    updatedPersonas[index] = {
      ...updatedPersonas[index],
      [field]: value
    }
    setPersonas(updatedPersonas)
  }

  const handleGenerateAudio = async () => {
    if (!scriptText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate audio",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev: number) => Math.min(prev + 10, 90))
      }, 200)

      // Prepare form data
      const formData = new FormData()
      formData.append('text', scriptText)
      formData.append('personas', JSON.stringify(personas))
      formData.append('numHosts', personas.length.toString())
      formData.append('discussionTime', discussionTime.toString())
      formData.append('projectId', projectId || '') // Add project ID
      
      // Add audio language setting
      const userSettings = localStorage.getItem("userSettings")
      let audioLanguage = uiLanguage // Default to UI language
      
      if (userSettings) {
        try {
          const settings = JSON.parse(userSettings)
          if (settings.audioLanguage && settings.audioLanguage !== "same-as-ui") {
            audioLanguage = settings.audioLanguage
          }
        } catch (e) {
          console.error("Failed to parse user settings", e)
        }
      }
      
      formData.append('language', audioLanguage) // Add language to form data

      // Generate CSRF token
      const csrfToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      clearInterval(interval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate audio')
      }

      const data = await response.json()
      console.log('Audio generation response:', data)

      if (data.success) {
        const result: AudioResult = {
          success: true,
          audioUrl: data.audioUrl,
          transcriptUrl: data.transcriptUrl,
          dialogue: data.dialogue,
          summary: data.summary,
          personas: data.personas,
          templateUsed: data.templateUsed
        }
        
        setAudioResult(result)

        // Persist the generated audio data to localStorage
        const audioData = {
          audioUrl: data.audioUrl,
          transcriptUrl: data.transcriptUrl,
          dialogue: data.dialogue,
          summary: data.summary,
          personas: data.personas,
          templateUsed: data.templateUsed,
          timestamp: Date.now()
        };
        localStorage.setItem('persistedAudioData', JSON.stringify(audioData));

        // Pass the result to the parent component
        if (onAudioGenerated) {
          onAudioGenerated(data.audioUrl, data.transcriptUrl, data.dialogue)
        }

        // Add a small delay to ensure UI updates
        setTimeout(() => {
          toast({
            title: "Audio Generated",
            description: "Your audio has been successfully generated.",
          })
        }, 100);
      } else {
        throw new Error(data.error || 'Failed to generate audio')
      }
    } catch (error) {
      console.error('Audio generation error:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate audio",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const playVoiceSample = async (persona: VoicePersona) => {
    try {
      setPlayingSample(persona.id)
      
      // Try to use Web Speech API for immediate feedback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Hello, this is ${persona.name} speaking. I am a ${persona.gender} voice with a ${persona.voiceType} tone.`
        )
        
        // Try to find a suitable voice
        const voices = speechSynthesis.getVoices()
        const preferredVoice = voices.find(voice => 
          voice.lang.includes('en') && 
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
    'professional', 'engaging', 'warm', 'confident'
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

            <div className="flex items-center justify-between">
              <div>
                <Label>Discussion Time</Label>
                <p className="text-xs text-muted-foreground">Choose discussion duration</p>
              </div>
              <Select value={discussionTime.toString()} onValueChange={(value) => setDiscussionTime(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="40">40 seconds</SelectItem>
                  <SelectItem value="50">50 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Configure Host Voices</Label>
              {personas.slice(0, numHosts).map((persona, index) => (
                <Card key={persona.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={persona.name}
                        onChange={(e) => updatePersona(index, 'name', e.target.value)}
                        placeholder="Host name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`gender-${index}`}>Gender</Label>
                      <Select value={persona.gender} onValueChange={(value) => updatePersona(index, 'gender', value as 'male' | 'female')}>
                        <SelectTrigger id={`gender-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`voice-${index}`}>Voice Type</Label>
                      <Select value={persona.voiceType} onValueChange={(value) => updatePersona(index, 'voiceType', value)}>
                        <SelectTrigger id={`voice-${index}`}>
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
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => playVoiceSample(persona)}
                        disabled={playingSample === persona.id}
                      >
                        {playingSample === persona.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Sample
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !scriptText.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Audio...
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
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  Generating your audio discussion... {progress}%
                </p>
              </div>
            )}

            {audioResult && audioResult.success && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Mic className="h-5 w-5" />
                    Audio Generated Successfully
                  </CardTitle>
                  {audioResult.templateUsed && (
                    <CardDescription>
                      Template used: {audioResult.templateUsed}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {audioResult.audioUrl && (
                    <div className="flex items-center gap-2">
                      <audio 
                        key={audioResult.audioUrl} 
                        controls 
                        className="w-full"
                        onError={(e) => {
                          console.error('Audio element error:', e);
                          toast({
                            title: "Audio Playback Error",
                            description: "There was an issue playing the audio. Try downloading it instead.",
                            variant: "destructive",
                          });
                        }}
                      >
                        <source src={audioResult.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {audioResult.dialogue && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-black">Generated Dialogue</h4>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 bg-white">
                        {audioResult.dialogue.map((turn, index) => (
                          <div key={index} className="text-sm py-1 border-b last:border-b-0 text-black">
                            <span className="font-medium text-black">{turn.speaker}:</span> <span className="text-black">{turn.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {audioResult.audioUrl && (
                      <Button asChild>
                        <a href={audioResult.audioUrl} download>
                          <Download className="mr-2 h-4 w-4" />
                          Download Audio
                        </a>
                      </Button>
                    )}
                    {audioResult.transcriptUrl && (
                      <Button asChild variant="outline">
                        <a href={audioResult.transcriptUrl} download>
                          <FileText className="mr-2 h-4 w-4" />
                          Download Transcript
                        </a>
                      </Button>
                    )}
                    <Button onClick={onNavigateToTimeline} variant="outline">
                      Edit in Timeline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}