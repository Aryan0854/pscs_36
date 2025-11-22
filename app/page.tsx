"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Video, Globe, Layers, Play, Settings, Clapperboard, Download, Mic } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TimelineEditor } from "@/components/timeline-editor"
import { SceneManager } from "@/components/scene-manager"
import { ExportPipeline } from "@/components/export-pipeline"
import { ProjectDashboard } from "@/components/project-dashboard"
import { ScriptEditor } from "@/components/script-editor"
import { GeminiGenerator } from "@/components/gemini-generator"
import DocumentAnalyzer from "@/components/document-analyzer"
import { useToast } from "@/hooks/use-toast"
import { SettingsModal } from "@/components/settings-modal"
import { LoginModal } from "@/components/login-modal"
import { useAutoSave } from "@/hooks/use-auto-save"
import { supabase } from "@/lib/supabase/client"
import VideoGenerator from "@/components/video-generator"
import { protectConsole, protectDOM } from "@/lib/security"
import { useTranslation } from "@/hooks/use-translation"
import { LanguageSelector } from "@/components/language-selector"

interface UserSettings {
  theme: "light" | "dark" | "system"
  defaultLanguage: string
  enabledLanguages: string[]
  notifications: boolean
  autoSave: boolean
  exportQuality: "high" | "medium" | "low"
  exportFormat: "mp4" | "mov" | "avi"
  parallelProcessing: boolean
  autoDownload: boolean
  audioLanguage?: string // Add audio language setting
}

interface ProjectData {
  uploadedFile?: string
  lastModified?: string
  projectId?: string
  [key: string]: any
}

export default function PIBPlatform() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [projectData, setProjectData] = useState<ProjectData>({})
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [extractedText, setExtractedText] = useState<string>("")
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingTabSwitch, setPendingTabSwitch] = useState<string | null>(null)
  const [pendingAudio, setPendingAudio] = useState<{audioUrl: string, transcriptUrl: string, dialogue?: any[], addedToTimeline?: boolean} | null>(null)
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const [generatedDialogue, setGeneratedDialogue] = useState<any[] | null>(null)
  const { toast } = useToast()
  const t = useTranslation()
  const initRef = useRef(false)

  // Apply security protections
  useEffect(() => {
    protectConsole()
    protectDOM()
  }, [])

  // Persist generated content on page refresh instead of clearing it
  useEffect(() => {
    console.log("Page refresh detected - persisting generated content")
    // Save generated audio data to localStorage
    if (generatedAudioUrl || generatedDialogue) {
      const audioData = {
        audioUrl: generatedAudioUrl,
        dialogue: generatedDialogue,
        timestamp: Date.now()
      };
      localStorage.setItem('persistedAudioData', JSON.stringify(audioData));
    }
    
    // Only clear non-persisted data
    setExtractedText("")
    setUploadResult(null)
    setPendingAudio(null)
    setProjectData({})
    setUploadedFile(null)
  }, [])
  
  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) return
    initRef.current = true

    // Restore persisted audio data on component mount
    const restorePersistedAudioData = () => {
      const persistedAudioData = localStorage.getItem('persistedAudioData')
      if (persistedAudioData) {
        try {
          const audioData = JSON.parse(persistedAudioData)
          // Only restore if data is not too old (e.g., less than 24 hours)
          if (Date.now() - audioData.timestamp < 24 * 60 * 60 * 1000) {
            setGeneratedAudioUrl(audioData.audioUrl)
            setGeneratedDialogue(audioData.dialogue)
            // Also set pending audio if audio URL exists
            if (audioData.audioUrl) {
              setPendingAudio({
                audioUrl: audioData.audioUrl,
                transcriptUrl: '', // transcript URL is not persisted
                dialogue: audioData.dialogue,
                addedToTimeline: false
              })
            }
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

    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get("auth_success")
    const authError = urlParams.get("auth_error")

    if (authSuccess) {
      toast({
        title: t("messages.welcomeBack"),
        description: "Your account has been activated. You can now login with your credentials.",
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (authError) {
      toast({
        title: "Authentication Error",
        description: decodeURIComponent(authError),
        variant: "destructive",
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const getInitialSession = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log("Session timeout - showing login modal")
        setLoading(false)
        setLoginOpen(true)
      }, 5000)

      try {
        console.log("Getting initial session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()
        console.log("Session result:", session ? "found" : "none")
        
        clearTimeout(timeoutId)
        
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          // Don't await these calls to prevent blocking
          fetchUserProfile(session.user.id)
          fetchUserSettings()
          fetchUserProjects()
        } else {
          setLoginOpen(true)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        clearTimeout(timeoutId)
        setLoginOpen(true)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event)
      if (session?.user) {
        setUser(session.user)
        setIsAuthenticated(true)
        setLoginOpen(false)
        // Don't await these calls to prevent blocking
        fetchUserProfile(session.user.id)
        fetchUserSettings()
        fetchUserProjects() // Fetch projects when user logs in
        
        // Restore persisted audio data when user logs in
        const persistedAudioData = localStorage.getItem('persistedAudioData')
        if (persistedAudioData) {
          try {
            const audioData = JSON.parse(persistedAudioData)
            // Only restore if data is not too old (e.g., less than 24 hours)
            if (Date.now() - audioData.timestamp < 24 * 60 * 60 * 1000) {
              setGeneratedAudioUrl(audioData.audioUrl)
              setGeneratedDialogue(audioData.dialogue)
              // Also set pending audio if audio URL exists
              if (audioData.audioUrl) {
                setPendingAudio({
                  audioUrl: audioData.audioUrl,
                  transcriptUrl: '', // transcript URL is not persisted
                  dialogue: audioData.dialogue,
                  addedToTimeline: false
                })
              }
            } else {
              // Remove old data
              localStorage.removeItem('persistedAudioData')
            }
          } catch (e) {
            console.error('Failed to restore persisted audio data:', e)
            localStorage.removeItem('persistedAudioData')
          }
        }
      } else {
        // Clear all generated content on auth state change (logout)
        setExtractedText("")
        setUploadResult(null)
        // Don't clear generated audio data here, it's persisted
        setPendingAudio(null)
        setProjectData({})
        setUploadedFile(null)
        setActiveTab("dashboard")

        setUser(null)
        setUserProfile(null)
        setUserSettings(null)
        setUserProjects([]) // Clear projects on logout
        setIsAuthenticated(false)
        setLoginOpen(true)
      }
      setLoading(false)
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [toast])

  // Handle pending tab switches after state updates
  useEffect(() => {
    if (pendingTabSwitch) {
      const timer = setTimeout(() => {
        setActiveTab(pendingTabSwitch)
        setPendingTabSwitch(null)
        toast({
          title: t("messages.audioAddedToTimeline"),
          description: t("messages.audioAddedDescription"),
        })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [pendingTabSwitch, toast, t])

  // Debug logging for dialogue
  useEffect(() => {
    console.log("Page - generatedDialogue changed:", generatedDialogue)
  }, [generatedDialogue])

  // Fetch project data when active project changes
  useEffect(() => {
    if (activeProject) {
      fetchProjectById(activeProject).then(project => {
        if (project) {
          setProjectData({
            projectId: project.id,
            audioUrl: project.audio_url,
            videoUrl: project.video_url
          })
          
          // If project has audio URL, set it as generated audio
          if (project.audio_url) {
            setGeneratedAudioUrl(project.audio_url)
            // Also set pending audio if it's not already set
            if (!pendingAudio) {
              setPendingAudio({
                audioUrl: project.audio_url,
                transcriptUrl: '', // transcript URL is not stored in project
                dialogue: undefined, // dialogue is not stored in project
                addedToTimeline: false
              })
            }
          }
          
          // If project has video URL, we could set it here if needed
        }
      })
    }
  }, [activeProject, pendingAudio])

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch("/api/user-profile")
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchUserSettings = async () => {
    if (user) {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUserSettings(data.data)
          }
        }
      } catch (error) {
        console.error("Error fetching user settings:", error)
      }
    } else {
      // Load from localStorage if not logged in
      const localSettings = localStorage.getItem("userSettings")
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings)
          setUserSettings(parsed)
        } catch (error) {
          console.error("Failed to parse local settings:", error)
        }
      }
    }
  }

  const fetchUserProjects = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/projects?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserProjects(data.data || [])
        }
      }
    } catch (error) {
      console.error("Error fetching user projects:", error)
    }
  }

  const fetchProjectById = async (projectId: string) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    }
    return null
  }

  const updateProject = async (projectId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/user/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.data
        }
      }
    } catch (error) {
      console.error("Error updating project:", error)
    }
    return null
  }

  const handleSettingsChange = async (newSettings?: any) => {
    if (newSettings) {
      setUserSettings(newSettings)
    } else {
      await fetchUserSettings()
    }
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleLogout = async () => {
    // Clear persisted audio data on logout
    localStorage.removeItem('persistedAudioData');
    
    // Clear all generated content on logout
    setExtractedText("")
    setUploadResult(null)
    setGeneratedAudioUrl(null)
    setGeneratedDialogue(null)
    setPendingAudio(null)
    setProjectData({})
    setUploadedFile(null)
    setActiveTab("dashboard")

    await supabase.auth.signOut()
    toast({
      title: t("messages.loggedOut"),
      description: t("messages.loggedOutSuccess"),
    })
  }

  const handleAuthSuccess = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    setLoginOpen(false)
    if (userData.id) {
      fetchUserProfile(userData.id)
      fetchUserProjects() // Fetch projects on auth success
    }
    if (userData.email) {
      fetchUserSettings()
    }
    toast({
      title: t("messages.welcomeBack"),
      description: `${t("messages.loginSuccess")} ${userData.user_metadata?.name || userData.email}`,
    })
  }

  const handleAudioGenerated = (audioUrl: string, transcriptUrl: string, dialogue?: any[]) => {
    console.log('🎵 handleAudioGenerated called with:', { audioUrl, transcriptUrl, dialogue })
    // Store the generated audio to be processed by TimelineEditor when it mounts
    setPendingAudio({ audioUrl, transcriptUrl, dialogue, addedToTimeline: false })
    // Also store the audio URL and dialogue for use in video generation
    setGeneratedAudioUrl(audioUrl)
    setGeneratedDialogue(dialogue || null)
    console.log('🎵 pendingAudio state set:', { audioUrl, transcriptUrl, dialogue, addedToTimeline: false })
    console.log('🎵 generatedAudioUrl set to:', audioUrl)
    console.log('🎵 generatedDialogue set to:', dialogue)
    
    // Update project with audio URL if we have an active project
    if (activeProject && audioUrl) {
      updateProject(activeProject, { audio_url: audioUrl })
    }
  }

  const handleFileUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.doc,.docx,.txt"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploadedFile(file)
        setIsUploading(true)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append("file", file)

        // Generate a simple CSRF token (in a real app, this would be more secure)
        const csrfToken = btoa(`${user?.id || 'anonymous'}:${Date.now()}`)

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 5, 90))
        }, 300)

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "include", // This ensures cookies are sent with the request
            headers: {
              'X-CSRF-Token': csrfToken,
            },
          })

          clearInterval(progressInterval)
          setUploadProgress(100)

          const result = await response.json()

          if (result.success) {
              await fetchUserProjects()

              setUploadResult(result.data)

              setProjectData((prev) => ({
                ...prev,
                uploadedFile: file.name,
                lastModified: new Date().toISOString(),
                projectId: result.data.projectId,
              }))

              toast({
                title: t("messages.welcomeBack"),
                description: `${file.name} ${t("messages.fileProcessedSuccessfully")}`,
              })
            } else {
             toast({
               title: t("messages.uploadFailed"),
               description: result.error || t("messages.uploadError"),
               variant: "destructive",
             })
           }
         } catch (error) {
           clearInterval(progressInterval)
           setUploadProgress(0)
          toast({
            title: t("messages.uploadError"),
            description: t("messages.uploadError"),
            variant: "destructive",
          })
         } finally {
           setTimeout(() => {
             setIsUploading(false)
             setUploadProgress(0)
           }, 1000)
         }
      }
    }
    input.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Video className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading PIB Platform...</p>
          <p className="text-xs text-muted-foreground mt-2">Please wait while we initialize the application</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} onAuthSuccess={handleAuthSuccess} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">{t("header.title")}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {t("header.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSelector variant="select" />
              <Badge variant="outline" className="text-xs hidden sm:flex">
                <Globe className="w-3 h-3 mr-1" />
                {userSettings?.enabledLanguages?.length || 14} {t("common.languages")}
              </Badge>
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t("common.welcome")}, {userProfile?.full_name || user.user_metadata?.name || user.email}</span>
                  <Badge variant="secondary">{userProfile?.role || user.user_metadata?.role || "User"}</Badge>
                </div>
              )}
              {userSettings?.autoSave && (
                <Badge variant="outline" className="text-xs hidden lg:flex">
                  {t("header.autoSaveOn")}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSettings}
                className="hidden sm:flex bg-transparent"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("common.settings")}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenSettings} className="sm:hidden bg-transparent">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex bg-transparent">
                {t("common.logout")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden bg-transparent">
                <span className="sr-only">{t("common.logout")}</span>⏻
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto">
              <TabsList className="flex w-max">
                <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("dashboard.title")}</span>
                  <span className="sm:hidden">Dash</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  {t("common.upload")}
                </TabsTrigger>
                <TabsTrigger value="document-analyzer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("documentAnalyzer.title")}</span>
                  <span className="sm:hidden">Analyzer</span>
                </TabsTrigger>
                <TabsTrigger value="script-editor" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("scriptEditor.title")}</span>
                  <span className="sm:hidden">Script</span>
                </TabsTrigger>
                <TabsTrigger value="gen-audio" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("audioGen.title")}</span>
                  <span className="sm:hidden">Audio</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                 <span className="hidden sm:inline">{t("timelineEditor.title")}</span>
                 <span className="sm:hidden">Audio</span>
               </TabsTrigger>
                <TabsTrigger value="video-gen" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t("videoGen.title")}</span>
                  <span className="sm:hidden">Video</span>
                </TabsTrigger>
                <TabsTrigger value="scenes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                   <Clapperboard className="w-3 h-3 sm:w-4 sm:h-4" />
                   {t("sceneManager.title")}
                 </TabsTrigger>
               <TabsTrigger value="export" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                 {t("common.download")}
               </TabsTrigger>
             </TabsList>
           </div>

          <TabsContent value="dashboard" className="space-y-6">
            <ProjectDashboard onTabChange={setActiveTab} onTextExtracted={setExtractedText} onFileUpload={handleFileUpload} />
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Upload Press Release</CardTitle>
                <CardDescription className="text-sm">
                  Securely import PIB press releases for AI-powered multilingual video creation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-12 text-center">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Drop your press release here</h3>
                  <p className="text-sm text-muted-foreground mb-4">Support for PDF, DOC, DOCX, and TXT files</p>
                  {uploadedFile && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">✓ {uploadedFile.name} uploaded successfully</p>
                    </div>
                  )}
                  <Button onClick={handleFileUpload} disabled={isUploading} className="w-full sm:w-auto">
                    <FileText className="w-4 h-4 mr-2" />
                    {isUploading ? "Processing..." : "Choose File"}
                  </Button>
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Processing your file...</span>
                        <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </div>

                {uploadResult && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Extracted Content</CardTitle>
                        <CardDescription>Preview of the extracted text from your uploaded file.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea value={uploadResult.extractedText} readOnly className="min-h-[200px]" />
                        <Button
                          onClick={() => {
                            setExtractedText(uploadResult.extractedText)
                            setActiveTab("script-editor")
                            setUploadResult(null)
                          }}
                          className="mt-4"
                        >
                          Edit in Script Editor
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {userProjects.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Your Uploaded Files</h3>
                    <div className="space-y-3">
                      {userProjects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded {new Date(project.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={project.status === "draft" ? "secondary" : "default"}>
                              {project.status}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActiveProject(project.id)
                                setProjectData({ projectId: project.id })
                                const scenesTab = document.querySelector('[value="scenes"]') as HTMLElement
                                scenesTab?.click()
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="document-analyzer">
            <Card>
              <CardHeader>
                <CardTitle>Document Analyzer</CardTitle>
                <CardDescription>
                  Analyze documents to extract actors/characters, generate conversations, and identify keywords for slide decks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentAnalyzer 
                  onAnalysisComplete={(result) => {
                    // Set the extracted text to be used in other components
                    setExtractedText(result.extractedText)
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script-editor">
            <ScriptEditor
              extractedText={extractedText}
              onTextChange={setExtractedText}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="gen-audio">
            <GeminiGenerator
              scriptText={extractedText}
              projectId={projectData.projectId} // Pass project ID
              onAudioGenerated={handleAudioGenerated}
              onNavigateToTimeline={() => setActiveTab("timeline")}
            />
          </TabsContent>

          <TabsContent value="scenes">
            <Card className="h-[calc(100vh-120px)]">
              <CardHeader>
                <CardTitle>Scene Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage individual scenes for your multilingual videos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <SceneManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Audio Timeline Editor</CardTitle>
                <CardDescription>
                  Arrange audio tracks, manage voiceovers, change languages, and fine-tune your multilingual audio content with precision timeline controls
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TimelineEditor pendingAudio={pendingAudio} onPendingAudioProcessed={() => setPendingAudio(null)} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video-gen">
            <Card>
              <CardContent className="p-0">
                <VideoGenerator
                  scriptText={extractedText}
                  audioUrl={generatedAudioUrl || undefined}
                  dialogue={generatedDialogue ? JSON.stringify(generatedDialogue) : undefined}
                  projectId={projectData.projectId} // Pass project ID
                  onVideoGenerated={(videoUrl: string, thumbnailUrl: string) => {
                    // Update project with video URL if we have an active project
                    if (activeProject) {
                      updateProject(activeProject, { video_url: videoUrl })
                    }
                  }}
                  onNavigateToTimeline={() => setActiveTab("timeline")}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export & Processing Pipeline</CardTitle>
                <CardDescription>
                  AI-powered multilingual video generation with real-time progress tracking and queue management
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ExportPipeline />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        onLogout={handleLogout}
        userSettings={userSettings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
}