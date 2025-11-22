"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Copy, Play, ImageIcon, FileText, Mic, Settings, Eye, Download, Upload } from "lucide-react"

interface Scene {
  id: string
  title: string
  description: string
  template: string
  duration: number
  language: string
  status: "draft" | "processing" | "ready"
  assets: SceneAsset[]
  settings: SceneSettings
  createdAt: string
  updatedAt: string
}

interface SceneAsset {
  id: string
  type: "image" | "video" | "audio" | "text"
  name: string
  url: string
  duration?: number
}

interface SceneSettings {
  backgroundColor: string
  textColor: string
  fontSize: number
  animation: string
  transition: string
}

interface SceneTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: string
}

export function SceneManager() {
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: "scene-1",
      title: "Introduction",
      description: "Introduction to the topic",
      template: "government-intro",
      duration: 30,
      language: "Hindi",
      status: "ready",
      assets: [
        { id: "asset-1", type: "image", name: "Government Logo", url: "/assets/logo.png" },
        { id: "asset-2", type: "text", name: "Title Text", url: "" },
      ],
      settings: {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        fontSize: 24,
        animation: "fade-in",
        transition: "slide",
      },
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T14:30:00Z",
    },
    {
      id: "scene-2",
      title: "Data Presentation",
      description: "Visual content and information",
      template: "data-visualization",
      duration: 45,
      language: "English",
      status: "processing",
      assets: [
        { id: "asset-3", type: "image", name: "Chart", url: "/assets/chart.png" },
        { id: "asset-4", type: "text", name: "Information", url: "" },
      ],
      settings: {
        backgroundColor: "#f8fafc",
        textColor: "#2563eb",
        fontSize: 20,
        animation: "slide-up",
        transition: "fade",
      },
      createdAt: "2024-01-15T11:00:00Z",
      updatedAt: "2024-01-15T15:00:00Z",
    },
  ])

  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("scenes")

  const sceneTemplates: SceneTemplate[] = [
    {
      id: "intro",
      name: "Introduction",
      description: "Opening scene with title and background",
      preview: "/templates/intro.jpg",
      category: "Introduction",
    },
    {
      id: "content",
      name: "Content",
      description: "Main content with text and media",
      preview: "/templates/content.jpg",
      category: "Content",
    },
    {
      id: "data",
      name: "Data Visualization",
      description: "Charts, graphs, and data displays",
      preview: "/templates/data.jpg",
      category: "Data",
    },
    {
      id: "conclusion",
      name: "Conclusion",
      description: "Closing scene with summary",
      preview: "/templates/conclusion.jpg",
      category: "Conclusion",
    },
  ]

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

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "video":
        return <Play className="w-4 h-4" />
      case "audio":
        return <Mic className="w-4 h-4" />
      case "text":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleCreateScene = () => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: "New Scene",
      description: "",
      template: "intro",
      duration: 30,
      language: "English",
      status: "draft",
      assets: [],
      settings: {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        fontSize: 24,
        animation: "fade-in",
        transition: "slide",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setScenes([...scenes, newScene])
    setSelectedScene(newScene.id)
    setIsCreateDialogOpen(false)
  }

  const handleDeleteScene = (sceneId: string) => {
    setScenes(scenes.filter((scene) => scene.id !== sceneId))
    if (selectedScene === sceneId) {
      setSelectedScene(null)
    }
  }

  const handleDuplicateScene = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId)
    if (scene) {
      const duplicatedScene: Scene = {
        ...scene,
        id: `scene-${Date.now()}`,
        title: `${scene.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setScenes([...scenes, duplicatedScene])
    }
  }

  const updateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates, updatedAt: new Date().toISOString() } : scene,
      ),
    )
  }

  const updateSceneSettings = (sceneId: string, settings: Partial<SceneSettings>) => {
    setScenes(
      scenes.map((scene) =>
        scene.id === sceneId
          ? {
              ...scene,
              settings: { ...scene.settings, ...settings },
              updatedAt: new Date().toISOString(),
            }
          : scene,
      ),
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <div className="flex flex-1 min-h-0 gap-6 p-6">
        {/* Scene List Panel */}
        <div className="w-80 flex flex-col gap-6">
          <Card className="flex flex-col">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Scene Manager</h2>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Scene
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Scene</DialogTitle>
                        <DialogDescription>Choose a template to get started with your new scene.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4 max-h-[50vh] overflow-y-auto">
                        {sceneTemplates.map((template) => (
                          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-sm">{template.name}</h3>
                              <p className="text-xs text-muted-foreground">{template.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateScene}>Create Scene</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="scenes">Scenes</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                {activeTab === "scenes" && (
                  <div className="p-4 space-y-3">
                    {scenes.map((scene) => (
                      <Card
                        key={scene.id}
                        className={`cursor-pointer transition-all ${
                          selectedScene === scene.id ? "ring-2 ring-primary" : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedScene(scene.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{scene.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">{scene.description}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(scene.status)}`}></div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                {scene.language}
                              </Badge>
                              <span>{scene.duration}s</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateScene(scene.id)
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteScene(scene.id)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === "templates" && (
                  <div className="p-4 space-y-3">
                    {sceneTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">{template.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {template.category}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scene Editor Panel */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedScene ? (
            <>
              {(() => {
                const scene = scenes.find((s) => s.id === selectedScene)
                if (!scene) return null

                return (
                  <>
                    {/* Scene Header */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold">{scene.title}</h2>
                            <p className="text-sm text-muted-foreground">{scene.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={scene.status === "ready" ? "default" : "secondary"}
                              className={scene.status === "processing" ? "bg-yellow-100 text-yellow-800" : ""}
                            >
                              {scene.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <div className="flex flex-1 gap-6 min-h-0">
                      {/* Scene Canvas */}
                      <Card className="flex-1">
                        <CardContent className="p-4 h-full">
                          <div className="h-full bg-muted/30 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-xl font-semibold mb-2">Scene Preview</h3>
                              <p className="text-muted-foreground">
                                Interactive scene editor and preview will be rendered here
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Properties Panel */}
                      <Card className="w-80 flex flex-col">
                        <CardContent className="p-0 h-full flex flex-col">
                          <Tabs defaultValue="properties" className="flex flex-col h-full">
                            <TabsList className="grid w-full grid-cols-3 p-0 bg-card rounded-none border-b">
                              <TabsTrigger 
                                value="properties" 
                                className="text-xs py-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground"
                              >
                                Properties
                              </TabsTrigger>
                              <TabsTrigger 
                                value="assets" 
                                className="text-xs py-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground"
                              >
                                Assets
                              </TabsTrigger>
                              <TabsTrigger 
                                value="settings" 
                                className="text-xs py-3 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground"
                              >
                                Settings
                              </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto p-4">
                              <TabsContent value="properties" className="space-y-4 mt-0">
                                <div>
                                  <Label htmlFor="scene-title">Title</Label>
                                  <Input
                                    id="scene-title"
                                    value={scene.title}
                                    onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="scene-description">Description</Label>
                                  <Textarea
                                    id="scene-description"
                                    value={scene.description}
                                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label htmlFor="scene-duration">Duration (s)</Label>
                                    <Input
                                      id="scene-duration"
                                      type="number"
                                      value={scene.duration}
                                      onChange={(e) =>
                                        updateScene(scene.id, { duration: Number.parseInt(e.target.value) || 0 })
                                      }
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="scene-language">Language</Label>
                                    <Select
                                      value={scene.language}
                                      onValueChange={(value) => updateScene(scene.id, { language: value })}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Bengali">Bengali</SelectItem>
                                        <SelectItem value="Tamil">Tamil</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="scene-template">Template</Label>
                                  <Select
                                    value={scene.template}
                                    onValueChange={(value) => updateScene(scene.id, { template: value })}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sceneTemplates.map((template) => (
                                        <SelectItem key={template.id} value={template.id}>
                                          {template.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TabsContent>

                              <TabsContent value="assets" className="space-y-4 mt-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">Scene Assets</h3>
                                  <Button size="sm" variant="outline">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Add Asset
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  {scene.assets.map((asset) => (
                                    <div key={asset.id} className="flex items-center gap-3 p-2 border rounded">
                                      {getAssetIcon(asset.type)}
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                                      </div>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>

                              <TabsContent value="settings" className="space-y-4 mt-0">
                                <div>
                                  <Label htmlFor="bg-color">Background Color</Label>
                                  <Input
                                    id="bg-color"
                                    type="color"
                                    value={scene.settings.backgroundColor}
                                    onChange={(e) => updateSceneSettings(scene.id, { backgroundColor: e.target.value })}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="text-color">Text Color</Label>
                                  <Input
                                    id="text-color"
                                    type="color"
                                    value={scene.settings.textColor}
                                    onChange={(e) => updateSceneSettings(scene.id, { textColor: e.target.value })}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="font-size">Font Size</Label>
                                  <Input
                                    id="font-size"
                                    type="number"
                                    value={scene.settings.fontSize}
                                    onChange={(e) =>
                                      updateSceneSettings(scene.id, { fontSize: Number.parseInt(e.target.value) || 12 })
                                    }
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="animation">Animation</Label>
                                  <Select
                                    value={scene.settings.animation}
                                    onValueChange={(value) => updateSceneSettings(scene.id, { animation: value })}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="fade-in">Fade In</SelectItem>
                                      <SelectItem value="slide-up">Slide Up</SelectItem>
                                      <SelectItem value="zoom-in">Zoom In</SelectItem>
                                      <SelectItem value="none">None</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="transition">Transition</Label>
                                  <Select
                                    value={scene.settings.transition}
                                    onValueChange={(value) => updateSceneSettings(scene.id, { transition: value })}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="slide">Slide</SelectItem>
                                      <SelectItem value="fade">Fade</SelectItem>
                                      <SelectItem value="cut">Cut</SelectItem>
                                      <SelectItem value="dissolve">Dissolve</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TabsContent>
                            </div>
                          </Tabs>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )
              })()}
            </>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="p-8">
                <div className="text-center">
                  <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Scene Manager</h3>
                  <p className="text-muted-foreground">Select a scene from the list to start editing</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}