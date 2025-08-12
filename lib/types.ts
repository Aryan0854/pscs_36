// Shared TypeScript types for the application
export interface Project {
  id: string
  title: string
  description: string
  status: "draft" | "processing" | "ready"
  languages: string[]
  scenes: string[]
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Scene {
  id: string
  projectId: string
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

export interface SceneAsset {
  id: string
  type: "image" | "video" | "audio" | "text"
  name: string
  url: string
  duration?: number
}

export interface SceneSettings {
  backgroundColor: string
  textColor: string
  fontSize: number
  animation: string
  transition: string
}

export interface ExportJob {
  id: string
  projectId: string
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

export interface OutputFile {
  id: string
  language: string
  format: string
  size: string
  url: string
  duration: string
}

export interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  duration?: string
}

export interface AnalyticsData {
  projectStats: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalLanguages: number
    totalDuration: string
    processingTime: string
  }
  systemMetrics: {
    cpuUsage: number
    memoryUsage: number
    storageUsage: number
    activeJobs: number
  }
  languageUsage: Array<{
    name: string
    value: number
    color: string
  }>
  projectTrends: Array<{
    month: string
    projects: number
    exports: number
  }>
  processingTimes: Array<{
    day: string
    time: number
  }>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total?: number
}
