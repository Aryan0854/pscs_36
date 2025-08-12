"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Activity,
  Video,
  Globe,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  Upload,
  FileText,
  Layers,
  Cpu,
  HardDrive,
  Zap,
  BarChart3,
  PieChartIcon,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DashboardData {
  projectStats: any
  languageUsage: any[]
  projectTrends: any[]
  processingTimeData: any[]
  systemMetrics: any
  recentActivity: any[]
}

export function ProjectDashboard() {
  const [timeRange, setTimeRange] = useState("7d")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/analytics/dashboard")
      if (!response.ok) throw new Error("Failed to fetch dashboard data")
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = () => {
    fetchDashboardData()
    toast({
      title: "Dashboard Refreshed",
      description: "Analytics data has been updated with the latest information.",
    })
  }

  const handleUploadPressRelease = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf,.doc,.docx,.txt"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast({
          title: "Press Release Uploaded",
          description: `${file.name} has been uploaded and is ready for processing.`,
        })
      }
    }
    input.click()
  }

  const handleCreateNewScene = () => {
    toast({
      title: "Creating New Scene",
      description: "Opening scene creation wizard...",
    })
    // Switch to scenes tab
    setTimeout(() => {
      const scenesTab = document.querySelector('[value="scenes"]') as HTMLElement
      scenesTab?.click()
    }, 1000)
  }

  const handleStartBatchExport = () => {
    toast({
      title: "Batch Export Started",
      description: "Processing all ready scenes for multilingual export...",
    })
    // Switch to export tab
    setTimeout(() => {
      const exportTab = document.querySelector('[value="export"]') as HTMLElement
      exportTab?.click()
    }, 1000)
  }

  const handleViewAnalytics = () => {
    toast({
      title: "Analytics Report",
      description: "Generating comprehensive analytics report...",
    })
  }

  const handleLanguageSettings = () => {
    toast({
      title: "Language Settings",
      description: "Opening multilingual configuration panel...",
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "project_created":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "export_completed":
        return <Download className="w-4 h-4 text-green-500" />
      case "scene_updated":
        return <Layers className="w-4 h-4 text-purple-500" />
      case "translation_finished":
        return <Globe className="w-4 h-4 text-orange-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { projectStats, languageUsage, projectTrends, processingTimeData, systemMetrics, recentActivity } =
    dashboardData

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Analytics</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{projectStats.totalProjects}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold">{projectStats.activeProjects}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  In progress
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Languages Supported</p>
                <p className="text-3xl font-bold">{projectStats.totalLanguages}</p>
                <p className="text-sm text-purple-600 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Indian languages
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing Time</p>
                <p className="text-3xl font-bold">{projectStats.processingTime}</p>
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  AI/ML powered
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  CPU Usage
                </span>
                <span>{Math.round(systemMetrics.cpuUsage)}%</span>
              </div>
              <Progress value={systemMetrics.cpuUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Memory
                </span>
                <span>{Math.round(systemMetrics.memoryUsage)}%</span>
              </div>
              <Progress value={systemMetrics.memoryUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Storage
                </span>
                <span>{Math.round(systemMetrics.storageUsage)}%</span>
              </div>
              <Progress value={systemMetrics.storageUsage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Active Jobs
                </span>
                <span>{systemMetrics.activeJobs}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">All systems operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Project Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projects" fill="#2563eb" name="Projects" />
                <Bar dataKey="exports" fill="#059669" name="Exports" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Language Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={languageUsage}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {languageUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Time Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Processing Time Trends (Minutes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={processingTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="time" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{activity.user}</span>
                      <span>•</span>
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full justify-start bg-transparent"
              variant="outline"
              onClick={handleUploadPressRelease}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Press Release
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" onClick={handleCreateNewScene}>
              <Video className="w-4 h-4 mr-2" />
              Create New Scene
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" onClick={handleStartBatchExport}>
              <Download className="w-4 h-4 mr-2" />
              Start Batch Export
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" onClick={handleViewAnalytics}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics Report
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline" onClick={handleLanguageSettings}>
              <Globe className="w-4 h-4 mr-2" />
              Language Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
