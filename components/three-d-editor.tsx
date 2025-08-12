"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, Box, Sphere, Plane } from "@react-three/drei"
import { useState, useRef } from "react"
import { Color } from "three"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Play, RotateCcw, ZoomIn, ZoomOut, Move3D } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SceneNode {
  id: string
  title: string
  position: [number, number, number]
  status: "draft" | "processing" | "ready"
  language: string
  duration: number
}

export function ThreeDEditor() {
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 10])
  const [cameraZoom, setCameraZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedScene, setDraggedScene] = useState<string | null>(null)
  const controlsRef = useRef<any>(null)
  const { toast } = useToast()

  const [sceneNodes, setSceneNodes] = useState<SceneNode[]>([
    {
      id: "scene-1",
      title: "Introduction",
      position: [-4, 2, 0],
      status: "ready",
      language: "Hindi",
      duration: 30,
    },
    {
      id: "scene-2",
      title: "Key Points",
      position: [0, 2, -2],
      status: "processing",
      language: "English",
      duration: 45,
    },
    {
      id: "scene-3",
      title: "Statistics",
      position: [4, 2, 0],
      status: "draft",
      language: "Bengali",
      duration: 60,
    },
    {
      id: "scene-4",
      title: "Conclusion",
      position: [0, -2, 2],
      status: "ready",
      language: "Tamil",
      duration: 25,
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "#22c55e"
      case "processing":
        return "#f59e0b"
      case "draft":
        return "#6b7280"
      default:
        return "#6b7280"
    }
  }

  const handleResetCamera = () => {
    setCameraPosition([0, 0, 10])
    setCameraZoom(1)
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    toast({
      title: "Camera Reset",
      description: "3D camera view has been reset to default position.",
    })
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(cameraZoom * 1.2, 3)
    setCameraZoom(newZoom)
    toast({
      title: "Zoomed In",
      description: `Camera zoom level: ${newZoom.toFixed(1)}x`,
    })
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(cameraZoom * 0.8, 0.3)
    setCameraZoom(newZoom)
    toast({
      title: "Zoomed Out",
      description: `Camera zoom level: ${newZoom.toFixed(1)}x`,
    })
  }

  const handleMoveMode = () => {
    toast({
      title: "Move Mode Activated",
      description: "Click and drag to move scenes in 3D space.",
    })
  }

  const handlePreviewScene = (sceneId: string) => {
    const scene = sceneNodes.find((s) => s.id === sceneId)
    if (scene) {
      toast({
        title: "Scene Preview",
        description: `Previewing "${scene.title}" in ${scene.language}`,
      })
    }
  }

  const handleEditScene = (sceneId: string) => {
    const scene = sceneNodes.find((s) => s.id === sceneId)
    if (scene) {
      toast({
        title: "Edit Scene",
        description: `Opening scene editor for "${scene.title}"`,
      })
    }
  }

  const handleCreateNewScene = () => {
    const newScene: SceneNode = {
      id: `scene-${Date.now()}`,
      title: "New Scene",
      position: [Math.random() * 6 - 3, Math.random() * 4 - 2, Math.random() * 4 - 2],
      status: "draft",
      language: "Hindi",
      duration: 30,
    }

    setSceneNodes([...sceneNodes, newScene])
    setSelectedScene(newScene.id)

    toast({
      title: "Scene Created",
      description: `New scene "${newScene.title}" added to the 3D workspace.`,
    })
  }

  const handleDuplicateScene = (sceneId: string) => {
    const originalScene = sceneNodes.find((s) => s.id === sceneId)
    if (originalScene) {
      const duplicatedScene: SceneNode = {
        ...originalScene,
        id: `scene-${Date.now()}`,
        title: `${originalScene.title} (Copy)`,
        position: [originalScene.position[0] + 1, originalScene.position[1], originalScene.position[2]],
        status: "draft",
      }

      setSceneNodes([...sceneNodes, duplicatedScene])
      setSelectedScene(duplicatedScene.id)

      toast({
        title: "Scene Duplicated",
        description: `Created a copy of "${originalScene.title}".`,
      })
    }
  }

  const handleDeleteScene = (sceneId: string) => {
    const sceneIndex = sceneNodes.findIndex((s) => s.id === sceneId)
    if (sceneIndex !== -1) {
      const scene = sceneNodes[sceneIndex]
      const newScenes = sceneNodes.filter((s) => s.id !== sceneId)
      setSceneNodes(newScenes)

      if (selectedScene === sceneId) {
        setSelectedScene(null)
      }

      toast({
        title: "Scene Deleted",
        description: `"${scene.title}" has been removed from the workspace.`,
      })
    }
  }

  const updateScene = (sceneId: string, updates: Partial<SceneNode>) => {
    setSceneNodes(sceneNodes.map((scene) => (scene.id === sceneId ? { ...scene, ...updates } : scene)))

    toast({
      title: "Scene Updated",
      description: "Scene properties have been updated.",
    })
  }

  return (
    <div className="h-[600px] w-full relative bg-slate-50 rounded-lg overflow-hidden">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 60, zoom: cameraZoom }}
        style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* India Map Base */}
        <Plane args={[12, 8]} position={[0, 0, -5]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} />
        </Plane>

        {/* Scene Nodes */}
        {sceneNodes.map((scene) => (
          <group key={scene.id} position={scene.position}>
            {/* Scene Card */}
            <Box
              args={[2, 1.5, 0.2]}
              onClick={() => setSelectedScene(scene.id)}
              onPointerOver={(e) => {
                e.object.material.emissive = new Color(0x444444)
                document.body.style.cursor = "pointer"
              }}
              onPointerOut={(e) => {
                e.object.material.emissive = new Color(0x000000)
                document.body.style.cursor = "default"
              }}
            >
              <meshStandardMaterial
                color={selectedScene === scene.id ? "#2563eb" : "#ffffff"}
                transparent
                opacity={0.9}
              />
            </Box>

            {/* Status Indicator */}
            <Sphere args={[0.1]} position={[0.8, 0.6, 0.2]}>
              <meshStandardMaterial color={getStatusColor(scene.status)} />
            </Sphere>

            {/* Scene Title */}
            <Text
              position={[0, 0, 0.2]}
              fontSize={0.2}
              color="#1f2937"
              anchorX="center"
              anchorY="middle"
              font="/fonts/WorkSans-Bold.woff"
            >
              {scene.title}
            </Text>

            {/* Language Badge */}
            <Text position={[0, -0.4, 0.2]} fontSize={0.12} color="#6b7280" anchorX="center" anchorY="middle">
              {scene.language} • {scene.duration}s
            </Text>

            {/* Connection Lines */}
            {scene.id !== "scene-4" && (
              <mesh>
                <cylinderGeometry args={[0.02, 0.02, 2]} />
                <meshStandardMaterial color="#94a3b8" />
              </mesh>
            )}
          </group>
        ))}

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={20}
          minDistance={5}
        />
      </Canvas>

      {/* Enhanced 3D Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetCamera}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleMoveMode}>
              <Move3D className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-2">
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateNewScene} className="w-full bg-transparent">
              + New Scene
            </Button>
            {selectedScene && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateScene(selectedScene)}
                  className="w-full"
                >
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteScene(selectedScene)}
                  className="w-full text-red-600"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Enhanced Scene Inspector Panel */}
      {selectedScene && (
        <div className="absolute top-4 right-4 w-80">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Scene Inspector</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedScene(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const scene = sceneNodes.find((s) => s.id === selectedScene)
                if (!scene) return null

                return (
                  <>
                    <div>
                      <Label htmlFor="scene-title">Scene Title</Label>
                      <Input
                        id="scene-title"
                        value={scene.title}
                        onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="scene-duration">Duration (seconds)</Label>
                      <Input
                        id="scene-duration"
                        type="number"
                        value={scene.duration}
                        onChange={(e) => updateScene(scene.id, { duration: Number.parseInt(e.target.value) || 30 })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="scene-language">Language</Label>
                      <Select
                        value={scene.language}
                        onValueChange={(value) => updateScene(scene.id, { language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Bengali">Bengali</SelectItem>
                          <SelectItem value="Tamil">Tamil</SelectItem>
                          <SelectItem value="Telugu">Telugu</SelectItem>
                          <SelectItem value="Marathi">Marathi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{scene.language}</Badge>
                      <Badge
                        variant={scene.status === "ready" ? "default" : "secondary"}
                        className={scene.status === "processing" ? "bg-yellow-100 text-yellow-800" : ""}
                      >
                        {scene.status}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handlePreviewScene(scene.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleEditScene(scene.id)}
                      >
                        Edit
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Position: [{scene.position.map((n) => n.toFixed(1)).join(", ")}]
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scene Status Legend */}
      <div className="absolute bottom-4 left-4">
        <Card className="p-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Draft</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
