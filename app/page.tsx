"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Video, Globe, Layers, Play, Settings, Clapperboard, Download } from "lucide-react"
import { ThreeDEditor } from "@/components/three-d-editor"
import { TimelineEditor } from "@/components/timeline-editor"
import { SceneManager } from "@/components/scene-manager"
import { ExportPipeline } from "@/components/export-pipeline"
import { ProjectDashboard } from "@/components/project-dashboard"
import { useToast } from "@/hooks/use-toast"
import { SettingsModal } from "@/components/settings-modal"

export default function PSCSPlatform() {
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { toast } = useToast()

  const supportedLanguages = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Odia",
    "Malayalam",
    "Punjabi",
    "Assamese",
    "Maithili",
  ]

  const recentProjects = [
    {
      id: "1",
      title: "Digital India Initiative Update",
      status: "Processing",
      languages: 8,
      duration: "2:45",
      created: "2 hours ago",
    },
    {
      id: "2",
      title: "Healthcare Policy Announcement",
      status: "Ready",
      languages: 14,
      duration: "3:12",
      created: "1 day ago",
    },
    {
      id: "3",
      title: "Economic Survey Highlights",
      status: "Draft",
      languages: 6,
      duration: "4:20",
      created: "3 days ago",
    },
  ]

  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const handleFileUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.doc,.docx,.txt"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setUploadedFile(file)

        const formData = new FormData()
        formData.append("file", file)

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          const result = await response.json()

          if (result.success) {
            toast({
              title: "File Processed Successfully",
              description: `${file.name} has been analyzed and scenes are ready for creation.`,
            })

            // Auto-switch to scenes tab after successful processing
            setTimeout(() => {
              const scenesTab = document.querySelector('[value="scenes"]') as HTMLElement
              scenesTab?.click()
            }, 1500)
          } else {
            toast({
              title: "Upload Failed",
              description: result.error || "Failed to process the file.",
              variant: "destructive",
            })
          }
        } catch (error) {
          toast({
            title: "Upload Error",
            description: "Network error occurred while uploading the file.",
            variant: "destructive",
          })
        }
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">PSCS_36</h1>
                  <p className="text-sm text-muted-foreground">PIB Multilingual Video Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                14 Languages
              </Badge>
              <Button variant="outline" size="sm" onClick={handleOpenSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="scenes" className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4" />
              Scenes
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              3D Editor
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ProjectDashboard />
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Press Release</CardTitle>
                <CardDescription>
                  Securely import PIB press releases for AI-powered multilingual video creation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Drop your press release here</h3>
                  <p className="text-muted-foreground mb-4">Support for PDF, DOC, DOCX, and TXT files</p>
                  {uploadedFile && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">✓ {uploadedFile.name} uploaded successfully</p>
                    </div>
                  )}
                  <Button onClick={handleFileUpload}>
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>
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

          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>3D Scene Editor</CardTitle>
                <CardDescription>
                  Design and arrange video scenes in an interactive 3D workspace with React Three Fiber
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThreeDEditor />
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

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
