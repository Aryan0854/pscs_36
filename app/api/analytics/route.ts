import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

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
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured - returning empty analytics data")
    const emptyAnalyticsData: AnalyticsData = {
      projectStats: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalLanguages: 0,
        totalDuration: "0m",
        processingTime: "0m",
      },
      systemMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        storageUsage: 0,
        activeJobs: 0,
      },
      languageUsage: [],
      projectTrends: [],
      processingTimes: [],
    }
    
    return NextResponse.json({
      success: true,
      data: emptyAnalyticsData,
      timeRange: "7d",
    })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "7d"

    // Create Supabase client
    const supabase = await createServerClient(request)

    // Fetch real data from the database
    const [
      projectsResult,
      exportsResult,
      allExportsResult,
      languageDataResult,
      projectTrendsResult,
      processingTimesResult,
      systemMetricsResult
    ] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("project_exports").select("*").eq("status", "completed"),
      supabase.from("project_exports").select("id, status, language").in("status", ["pending", "processing"]),
      supabase.from("language_usage").select("language, usage_count"),
      supabase
        .from("projects")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("project_exports")
        .select("processing_time_minutes, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("system_metrics")
        .select("*")
        .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("recorded_at", { ascending: false })
    ])

    const { data: projects } = projectsResult
    const { data: exports } = exportsResult
    const { data: allExports } = allExportsResult
    const { data: languageData } = languageDataResult
    const { data: projectTrends } = projectTrendsResult
    const { data: processingTimes } = processingTimesResult
    const { data: systemMetrics } = systemMetricsResult

    // Aggregate language usage from multiple sources
    const languageUsageMap: { [key: string]: number } = {}
    
    // Count from language_usage table
    languageData?.forEach((item) => {
      if (item.language) {
        languageUsageMap[item.language] = (languageUsageMap[item.language] || 0) + (item.usage_count || 0)
      }
    })
    
    // Count from completed exports (real usage data)
    exports?.forEach((exp: any) => {
      if (exp.language) {
        languageUsageMap[exp.language] = (languageUsageMap[exp.language] || 0) + 1
      }
    })
    
    // Count from pending/processing exports (these are separate from completed exports)
    allExports?.forEach((exp: any) => {
      if (exp.language && exp.status !== "completed") {
        languageUsageMap[exp.language] = (languageUsageMap[exp.language] || 0) + 1
      }
    })

    const languageUsage = Object.entries(languageUsageMap).map(([language, count]) => ({
      name: getLanguageName(language),
      value: count,
      color: getLanguageColor(language),
    }))

    // Calculate project stats
    const projectStats = {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter((p) => p.status === "active").length || 0,
      completedProjects: projects?.filter((p) => p.status === "completed").length || 0,
      totalLanguages: Object.keys(languageUsageMap).length,
      totalDuration: `${projects?.reduce((sum, p) => sum + (p.duration_minutes || 0), 0) || 0}m`,
      processingTime: `${exports?.reduce((sum, e) => sum + (e.processing_time_minutes || 0), 0) || 0}m`,
    }

    // Format project trends for bar chart
    const trendsData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = date.toLocaleDateString("en", { month: "short" })
      const targetMonth = date.getMonth()
      const targetYear = date.getFullYear()

      const monthProjects =
        projectTrends?.filter((p) => {
          const projectDate = new Date(p.created_at)
          return projectDate.getMonth() === targetMonth && projectDate.getFullYear() === targetYear
        }).length || 0

      const monthExports =
        exports?.filter((e) => {
          const exportDate = new Date(e.created_at)
          return exportDate.getMonth() === targetMonth && exportDate.getFullYear() === targetYear
        }).length || 0

      return {
        month: monthName,
        projects: monthProjects,
        exports: monthExports,
      }
    })

    // Format processing time trends
    const processingTimeChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayName = date.toLocaleDateString("en", { weekday: "short" })

      const dayProcessingTimes =
        processingTimes?.filter((pt) => {
          const ptDate = new Date(pt.completed_at)
          return ptDate.toDateString() === date.toDateString()
        }) || []

      const avgTime =
        dayProcessingTimes.length > 0
          ? dayProcessingTimes.reduce((sum, pt) => sum + pt.processing_time_minutes, 0) / dayProcessingTimes.length
          : 0

      return {
        day: dayName,
        time: Math.round(avgTime),
      }
    })

    // Get latest system metrics
    // Count active jobs from exports with pending or processing status
    const activeJobsCount = allExports?.filter((exp: any) => 
      exp.status === "pending" || exp.status === "processing"
    ).length || 0
    
    const latestMetrics = {
      cpuUsage: systemMetrics?.find((m) => m.metric_type === "cpu_usage")?.value || 0,
      memoryUsage: systemMetrics?.find((m) => m.metric_type === "memory_usage")?.value || 0,
      storageUsage: systemMetrics?.find((m) => m.metric_type === "storage_usage")?.value || 0,
      activeJobs: activeJobsCount,
    }

    const analyticsData: AnalyticsData = {
      projectStats,
      systemMetrics: latestMetrics,
      languageUsage,
      projectTrends: trendsData,
      processingTimes: processingTimeChart,
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeRange,
    })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
      },
      { status: 500 },
    )
  }
}

function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    hi: "Hindi",
    en: "English",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    gu: "Gujarati",
    mr: "Marathi",
    kn: "Kannada",
    ml: "Malayalam",
    or: "Odia",
    pa: "Punjabi",
    as: "Assamese",
    ur: "Urdu",
    ne: "Nepali",
  }
  return languages[code] || code
}

function getLanguageColor(code: string): string {
  const colors: { [key: string]: string } = {
    hi: "#2563eb",
    en: "#059669",
    bn: "#dc2626",
    ta: "#7c3aed",
    te: "#ea580c",
    gu: "#0891b2",
    mr: "#be123c",
    kn: "#9333ea",
    ml: "#c2410c",
    or: "#0d9488",
    pa: "#7c2d12",
    as: "#1e40af",
    ur: "#991b1b",
    ne: "#6d28d9",
  }
  return colors[code] || "#6b7280"
}