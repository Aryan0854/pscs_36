"use client"

import { useState, useEffect } from "react"
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
import GeminiGenerator from "@/components/gemini-generator"
import { useToast } from "@/hooks/use-toast"
import { SettingsModal } from "@/components/settings-modal"
import { LoginModal } from "@/components/login-modal"
import { useAutoSave } from "@/hooks/use-auto-save"
import { supabase } from "@/lib/supabase/client"

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
  const { toast } = useToast()

  useAutoSave({
    data: projectData,
    onSave: async (data) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId: user?.id }),
      })
      if (!response.ok) throw new Error("Failed to save project")
    },
    enabled: userSettings?.autoSave || false,
    interval: 30000,
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get("auth_success")
    const authError = urlParams.get("auth_error")

    if (authSuccess) {
      toast({
        title: "Email Confirmed Successfully",
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
      try {
        console.log("Getting initial session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()
        console.log("Session result:", session ? "found" : "none")
        if (session?.user) {
          setUser(session.user)
          setIsAuthenticated(true)
          await fetchUserProfile(session.user.id)
          await fetchUserSettings()
          await fetchUserProjects()
        } else {
          setLoginOpen(true)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setLoginOpen(true)
      }
      setLoading(false)
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsAuthenticated(true)
        setLoginOpen(false)
        await fetchUserProfile(session.user.id)
        await fetchUserSettings()
        await fetchUserProjects()
      } else {
        setUser(null)
        setUserProfile(null)
        setUserSettings(null)
        setIsAuthenticated(false)
        setLoginOpen(true)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [toast])

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
      const response = await fetch(`/api/projects?userId=${user.id}`)
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
    await supabase.auth.signOut()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const handleAuthSuccess = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
    setLoginOpen(false)
    if (userData.id) {
      fetchUserProfile(userData.id)
      fetchUserProjects()
    }
    if (userData.email) {
      fetchUserSettings()
    }
    toast({
      title: "Welcome!",
      description: `Successfully logged in as ${userData.user_metadata?.name || userData.email}`,
    })
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

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 5, 90))
        }, 300)

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "include", // This ensures cookies are sent with the request
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
                title: "File Processed Successfully",
                description: `${file.name} has been analyzed and is ready for editing.`,
              })
            } else {
             toast({
               title: "Upload Failed",
               description: result.error || "Failed to process the file.",
               variant: "destructive",
             })
           }
         } catch (error) {
           clearInterval(progressInterval)
           setUploadProgress(0)
           toast({
             title: "Upload Error",
             description: "Network error occurred while uploading the file.",
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
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">PIB Multilingual Video Platform</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    Gemini AI-Powered Press Release Video Generation
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs hidden sm:flex">
                <Globe className="w-3 h-3 mr-1" />
                {userSettings?.enabledLanguages?.length || 14} Languages
              </Badge>
              {user && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Welcome, {userProfile?.full_name || user.user_metadata?.name || user.email}</span>
                  <Badge variant="secondary">{userProfile?.role || user.user_metadata?.role || "User"}</Badge>
                </div>
              )}
              {userSettings?.autoSave && (
                <Badge variant="outline" className="text-xs hidden lg:flex">
                  Auto-save ON
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSettings}
                className="hidden sm:flex bg-transparent"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenSettings} className="sm:hidden bg-transparent">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex bg-transparent">
                Logout
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="sm:hidden bg-transparent">
                <span className="sr-only">Logout</span>⏻
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
           <div className="overflow-x-auto">
             <TabsList className="grid grid-cols-8 w-full min-w-[700px] sm:min-w-0 lg:w-[1000px]">
               <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                 <span className="hidden sm:inline">Dashboard</span>
                 <span className="sm:hidden">Dash</span>
               </TabsTrigger>
               <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                 Upload
               </TabsTrigger>
               <TabsTrigger value="script-editor" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                 <span className="hidden sm:inline">Script Editor</span>
                 <span className="sm:hidden">Script</span>
               </TabsTrigger>
               <TabsTrigger value="gen-audio" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                 <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
                 <span className="hidden sm:inline">Gen Audio</span>
                 <span className="sm:hidden">Audio</span>
               </TabsTrigger>
               <TabsTrigger value="scenes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Clapperboard className="w-3 h-3 sm:w-4 sm:h-4" />
                  Scenes
                </TabsTrigger>
               <TabsTrigger value="timeline" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Timeline</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                Export
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

          <TabsContent value="script-editor">
            <ScriptEditor
              extractedText={extractedText}
              onTextChange={setExtractedText}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="gen-audio">
            <GeminiGenerator scriptText={extractedText} />
          </TabsContent>

          <TabsContent value="scenes">
            <Card>
              <CardHeader>
                <CardTitle>Scene Management</CardTitle>
                <CardDescription>
                  Create, edit, and manage individual scenes for your multilingual videos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SceneManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Timeline Editor</CardTitle>
                <CardDescription>
                  Arrange scenes, manage voiceovers, and fine-tune your multilingual videos with precision timeline
                  controls
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TimelineEditor />
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