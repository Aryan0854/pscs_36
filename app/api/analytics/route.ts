import { type NextRequest, NextResponse } from "next/server"

interface AnalyticsData {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "7d"

    // Mock analytics data - in production, this would be calculated from real data
    const analyticsData: AnalyticsData = {
      projectStats: {
        totalProjects: 47,
        activeProjects: 8,
        completedProjects: 39,
        totalLanguages: 14,
        totalDuration: "18h 32m",
        processingTime: "142h 15m",
      },
      systemMetrics: {
        cpuUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
        memoryUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
        storageUsage: Math.floor(Math.random() * 15) + 65, // 65-80%
        activeJobs: Math.floor(Math.random() * 5) + 1, // 1-5
      },
      languageUsage: [
        { name: "Hindi", value: 35, color: "#2563eb" },
        { name: "English", value: 28, color: "#059669" },
        { name: "Bengali", value: 15, color: "#dc2626" },
        { name: "Tamil", value: 12, color: "#7c3aed" },
        { name: "Telugu", value: 10, color: "#ea580c" },
      ],
      projectTrends: [
        { month: "Jan", projects: 12, exports: 45 },
        { month: "Feb", projects: 19, exports: 67 },
        { month: "Mar", projects: 15, exports: 52 },
        { month: "Apr", projects: 23, exports: 78 },
        { month: "May", projects: 18, exports: 61 },
        { month: "Jun", projects: 25, exports: 89 },
      ],
      processingTimes: [
        { day: "Mon", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Tue", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Wed", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Thu", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Fri", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Sat", time: Math.floor(Math.random() * 20) + 30 },
        { day: "Sun", time: Math.floor(Math.random() * 20) + 30 },
      ],
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
      },
      { status: 500 },
    )
  }
}
