"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileVideo,
  Zap,
  Cpu,
  HardDrive,
  Monitor,
} from "lucide-react"

interface ExportJob {
  id: string
  projectName: string
  languages: string[]
  format: string
  quality: string
  status: "queued" | "processing" | "completed" | "failed" | "paused"
  progress: number
  startTime: string
  estimatedCompletion?: string
  outputFiles: OutputFile[]
  processingSteps: ProcessingStep[]
}

interface OutputFile {
  id: string
  language: string
  format: string
  size: string
  url: string
  duration: string
}

interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  duration?: string
}

export function ExportPipeline() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: "job-1",
      projectName: "Digital India Initiative Update",
      languages: ["Hindi", "English", "Bengali", "Tamil"],
      format: "MP4",
      quality: "1080p",
      status: "processing",
      progress: 65,
      startTime: "2024-01-15T14:30:00Z",
      estimatedCompletion: "2024-01-15T15:45:00Z",
      outputFiles: [
        {
          id: "file-1",
          language: "Hindi",
          format: "MP4",
          size: "45.2 MB",
          url: "/exports/digital-india-hindi.mp4",
          duration: "2:45",
        },
        {
          id: "file-2",
          language: "English",
          format: "MP4",
          size: "42.8 MB",
          url: "/exports/digital-india-english.mp4",
          duration: "2:45",
        },
      ],
      processingSteps: [
        { id: "step-1", name: "Text Analysis", status: "completed", progress: 100, duration: "2m 15s" },
        { id: "step-2", name: "Translation", status: "completed", progress: 100, duration: "5m 30s" },
        { id: "step-3", name: "Voice Synthesis", status: "processing", progress: 75 },
        { id: "step-4", name: "Scene Rendering", status: "pending", progress: 0 },
        { id: "step-5", name: "Video Compilation", status: "pending", progress: 0 },
      ],
    },
    {
      id: "job-2",
      projectName: "Healthcare Policy Announcement",
      languages: ["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi"],
      format: "MP4",
      quality: "4K",
      status: "completed",
      progress: 100,
      startTime: "2024-01-15T10:00:00Z",
      outputFiles: [
        {
          id: "file-3",
          language: "Hindi",
          format: "MP4",
          size: "125.4 MB",
          url: "/exports/healthcare-hindi.mp4",
          duration: "3:12",
        },
        {
          id: "file-4",
          language: "English",
          format: "MP4",
          size: "118.7 MB",
          url: "/exports/healthcare-english.mp4",
          duration: "3:12",
        },
      ],
      processingSteps: [
        { id: "step-6", name: "Text Analysis", status: "completed", progress: 100, duration: "1m 45s" },
        { id: "step-7", name: "Translation", status: "completed", progress: 100, duration: "8m 20s" },
        { id: "step-8", name: "Voice Synthesis", status: "completed", progress: 100, duration: "12m 15s" },
        { id: "step-9", name: "Scene Rendering", status: "completed", progress: 100, duration: "15m 30s" },
        { id: "step-10", name: "Video Compilation", status: "completed", progress: 100, duration: "6m 45s" },
      ],
    },
  ])

  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportConfig, setExportConfig] = useState({
    languages: [] as string[],
    format: "MP4",
    quality: "1080p",
    includeSubtitles: true,
    includeThumbnails: true,
  })

  const availableLanguages = [
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
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "processing":
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "failed":
        return "bg-red-500"
      case "paused":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString()
  }

  const handleStartExport = () => {
    const newJob: ExportJob = {
      id: `job-${Date.now()}`,
      projectName: "New Export Job",
      languages: exportConfig.languages,
      format: exportConfig.format,
      quality: exportConfig.quality,
      status: "queued",
      progress: 0,
      startTime: new Date().toISOString(),
      outputFiles: [],
      processingSteps: [
        { id: "step-new-1", name: "Text Analysis", status: "pending", progress: 0 },
        { id: "step-new-2", name: "Translation", status: "pending", progress: 0 },
        { id: "step-new-3", name: "Voice Synthesis", status: "pending", progress: 0 },
        { id: "step-new-4", name: "Scene Rendering", status: "pending", progress: 0 },
        { id: "step-new-5", name: "Video Compilation", status: "pending", progress: 0 },
      ],
    }
    setExportJobs([newJob, ...exportJobs])
    setIsExportDialogOpen(false)
  }

  // Simulate progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setExportJobs((jobs) =>
        jobs.map((job) => {
          if (job.status === "processing" && job.progress < 100) {
            return { ...job, progress: Math.min(job.progress + Math.random() * 5, 100) }
          }
          return job
        }),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[700px] w-full flex flex-col bg-background">
      {/* Export Controls */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Export & Processing Pipeline</h2>
            <p className="text-sm text-muted-foreground">AI-powered multilingual video generation and export</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  New Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configure Export Settings</DialogTitle>
                  <DialogDescription>
                    Set up your multilingual video export with AI processing options
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div>
                    <Label className="text-base font-medium">Languages</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select languages for video generation</p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableLanguages.map((language) => (
                        <div key={language} className="flex items-center space-x-2">
                          <Checkbox
                            id={language}
                            checked={exportConfig.languages.includes(language)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setExportConfig((prev) => ({
                                  ...prev,
                                  languages: [...prev.languages, language],
                                }))
                              } else {
                                setExportConfig((prev) => ({
                                  ...prev,
                                  languages: prev.languages.filter((l) => l !== language),
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={language} className="text-sm">
                            {language}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="format">Video Format</Label>
                      <Select
                        value={exportConfig.format}
                        onValueChange={(value) => setExportConfig((prev) => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MP4">MP4 (H.264)</SelectItem>
                          <SelectItem value="WEBM">WebM (VP9)</SelectItem>
                          <SelectItem value="MOV">MOV (ProRes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality">Quality</Label>
                      <Select
                        value={exportConfig.quality}
                        onValueChange={(value) => setExportConfig((prev) => ({ ...prev, quality: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="1080p">1080p Full HD</SelectItem>
                          <SelectItem value="4K">4K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="subtitles"
                        checked={exportConfig.includeSubtitles}
                        onCheckedChange={(checked) =>
                          setExportConfig((prev) => ({ ...prev, includeSubtitles: !!checked }))
                        }
                      />
                      <Label htmlFor="subtitles">Include subtitles/captions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="thumbnails"
                        checked={exportConfig.includeThumbnails}
                        onCheckedChange={(checked) =>
                          setExportConfig((prev) => ({ ...prev, includeThumbnails: !!checked }))
                        }
                      />
                      <Label htmlFor="thumbnails">Generate video thumbnails</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStartExport} disabled={exportConfig.languages.length === 0}>
                    Start Export
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Jobs List */}
        <div className="w-96 border-r bg-card overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-medium">Export Queue</h3>
            <p className="text-sm text-muted-foreground">{exportJobs.length} jobs</p>
          </div>

          <div className="space-y-2 p-4">
            {exportJobs.map((job) => (
              <Card
                key={job.id}
                className={`cursor-pointer transition-all ${
                  selectedJob === job.id ? "ring-2 ring-primary" : "hover:shadow-md"
                }`}
                onClick={() => setSelectedJob(job.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{job.projectName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(job.status)}
                        <span className="text-xs text-muted-foreground capitalize">{job.status}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {job.languages.length} langs
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-1" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>
                      {job.format} • {job.quality}
                    </span>
                    <span>{formatTime(job.startTime)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Job Details */}
        <div className="flex-1 flex flex-col">
          {selectedJob ? (
            <>
              {(() => {
                const job = exportJobs.find((j) => j.id === selectedJob)
                if (!job) return null

                return (
                  <>
                    {/* Job Header */}
                    <div className="p-4 border-b bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{job.projectName}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{job.languages.join(", ")}</span>
                            <span>
                              {job.format} • {job.quality}
                            </span>
                            <span>Started: {formatTime(job.startTime)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={job.status === "completed" ? "default" : "secondary"}
                            className={job.status === "processing" ? "bg-blue-100 text-blue-800" : ""}
                          >
                            {job.status}
                          </Badge>
                          {job.status === "processing" && (
                            <Button variant="outline" size="sm">
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {job.status === "paused" && (
                            <Button variant="outline" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <Tabs defaultValue="progress" className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
                          <TabsTrigger value="progress">Progress</TabsTrigger>
                          <TabsTrigger value="outputs">Outputs</TabsTrigger>
                          <TabsTrigger value="logs">Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="progress" className="flex-1 p-4 space-y-4">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Processing Pipeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {job.processingSteps.map((step) => (
                                <div key={step.id} className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 w-40">
                                    {getStatusIcon(step.status)}
                                    <span className="text-sm font-medium">{step.name}</span>
                                  </div>
                                  <div className="flex-1">
                                    <Progress value={step.progress} className="h-2" />
                                  </div>
                                  <div className="text-sm text-muted-foreground w-16 text-right">
                                    {step.status === "completed" && step.duration ? step.duration : `${step.progress}%`}
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4 text-center">
                                <Cpu className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold">85%</div>
                                <div className="text-sm text-muted-foreground">CPU Usage</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <HardDrive className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold">2.4GB</div>
                                <div className="text-sm text-muted-foreground">Memory</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <Monitor className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                <div className="text-2xl font-bold">12m</div>
                                <div className="text-sm text-muted-foreground">ETA</div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="outputs" className="flex-1 p-4 space-y-4">
                          <div className="grid gap-4">
                            {job.outputFiles.map((file) => (
                              <Card key={file.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FileVideo className="w-8 h-8 text-blue-500" />
                                      <div>
                                        <h4 className="font-medium">
                                          {job.projectName} - {file.language}
                                        </h4>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <span>{file.format}</span>
                                          <span>{file.size}</span>
                                          <span>{file.duration}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm">
                                        <Play className="w-4 h-4 mr-2" />
                                        Preview
                                      </Button>
                                      <Button size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="logs" className="flex-1 p-4">
                          <Card className="h-full">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Processing Logs</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-muted/30 rounded p-4 font-mono text-sm space-y-1 h-64 overflow-y-auto">
                                <div className="text-green-600">[14:30:15] Starting export job: {job.projectName}</div>
                                <div className="text-blue-600">[14:30:16] Analyzing text content...</div>
                                <div className="text-blue-600">[14:32:31] Text analysis completed</div>
                                <div className="text-blue-600">
                                  [14:32:32] Starting translation for {job.languages.length} languages
                                </div>
                                <div className="text-blue-600">[14:38:02] Translation completed</div>
                                <div className="text-yellow-600">[14:38:03] Generating voice synthesis...</div>
                                <div className="text-muted-foreground">[14:40:15] Processing audio for Hindi...</div>
                                <div className="text-muted-foreground">[14:42:30] Processing audio for English...</div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </>
                )
              })()}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Download className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Export & Processing Pipeline</h3>
                <p className="text-muted-foreground">Select an export job to view details and progress</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
