import { NextResponse } from "next/server"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function GET(request: Request) {
  console.time("dashboard-api-total")
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured - returning empty analytics data")
    return NextResponse.json({
      projectStats: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalLanguages: 0,
        totalDuration: "0m",
        processingTime: "0m",
      },
      languageUsage: [],
      projectTrends: [],
      processingTimeData: [],
      systemMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        storageUsage: 0,
        activeJobs: 0,
      },
      recentActivity: [],
    })
  }
  
  try {
    const supabase = await createServerClient(request)

    console.time("db-queries")
    // Parallelize database queries to reduce sequential execution time
    const [
      projectsResult,
      exportsResult,
      allExportsResult,
      languageDataResult,
      projectTrendsResult,
      processingTimesResult,
      systemMetricsResult,
      recentActivityResult
    ] = await Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("project_exports").select("*").eq("status", "completed"),
      supabase.from("project_exports").select("id, status, language, project_id").in("status", ["pending", "processing"]),
      supabase.from("language_usage").select("language, usage_count, project_id"),
      supabase
        .from("projects")
        .select("id, created_at")
        .gte("created_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("project_exports")
        .select("processing_time_minutes, completed_at, project_id")
        .not("completed_at", "is", null)
        .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("system_metrics")
        .select("*")
        .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("recorded_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)
    ])

    const { data: projects } = projectsResult
    const { data: exports } = exportsResult
    const { data: allExports } = allExportsResult
    const { data: languageData } = languageDataResult
    const { data: projectTrends } = projectTrendsResult
    const { data: processingTimes } = processingTimesResult
    const { data: systemMetrics } = systemMetricsResult
    const { data: recentActivity } = recentActivityResult

    console.timeEnd("db-queries")

    // Identify sample project titles to exclude
    const sampleProjectTitles = [
      'Healthcare Policy Announcement',
      'Economic Survey Highlights',
      'Digital India Initiative',
      'Education Reform Update',
      'Infrastructure Development'
    ]
    
    // Get IDs of sample projects to exclude
    const sampleProjectIds = new Set(
      projects?.filter((p: any) => sampleProjectTitles.includes(p.title))?.map((p: any) => p.id) || []
    )

    // Aggregate language usage from multiple sources - EXCLUDE SAMPLE DATA
    console.time("language-aggregation")
    const languageUsageMap: { [key: string]: number } = {}
    
    // Count from language_usage table - EXCLUDE entries linked to sample projects
    languageData?.forEach((item: any) => {
      if (item.language && item.project_id && !sampleProjectIds.has(item.project_id)) {
        languageUsageMap[item.language] = (languageUsageMap[item.language] || 0) + (item.usage_count || 0)
      }
    })
    
    // Count from completed exports - EXCLUDE exports linked to sample projects
    exports?.forEach((exp: any) => {
      if (exp.language && exp.project_id && !sampleProjectIds.has(exp.project_id)) {
        languageUsageMap[exp.language] = (languageUsageMap[exp.language] || 0) + 1
      }
    })
    
    // Count from pending/processing exports - EXCLUDE exports linked to sample projects
    allExports?.forEach((exp: any) => {
      if (exp.language && exp.status !== "completed" && exp.project_id && !sampleProjectIds.has(exp.project_id)) {
        languageUsageMap[exp.language] = (languageUsageMap[exp.language] || 0) + 1
      }
    })
    
    // Convert to array format
    const languageUsage = Object.entries(languageUsageMap).map(([language, count]) => ({
      language,
      count
    }))
    console.timeEnd("language-aggregation")

    console.time("data-processing")
    // Process the data for charts
    console.time("project-stats-calc")
    
    // Calculate unique languages from actual data
    const uniqueLanguages = new Set<string>()
    languageUsage.forEach((item: any) => {
      if (item.language) uniqueLanguages.add(item.language)
    })
    exports?.forEach((exp: any) => {
      if (exp.language) uniqueLanguages.add(exp.language)
    })
    allExports?.forEach((exp: any) => {
      if (exp.language) uniqueLanguages.add(exp.language)
    })
    
    // Filter out sample projects for stats
    const realProjects = projects?.filter((p: any) => !sampleProjectIds.has(p.id)) || []
    const realExports = exports?.filter((e: any) => !sampleProjectIds.has(e.project_id)) || []
    
    const projectStats = {
      totalProjects: realProjects.length || 0,
      activeProjects: realProjects.filter((p: any) => p.status === "active").length || 0,
      completedProjects: realProjects.filter((p: any) => p.status === "completed").length || 0,
      totalLanguages: uniqueLanguages.size || 0,
      totalDuration: `${realProjects.reduce((sum: number, p: any) => sum + (p.duration_minutes || 0), 0) || 0}m`,
      processingTime: `${realExports.reduce((sum: number, e: any) => sum + (e.processing_time_minutes || 0), 0) || 0}m`,
    }
    console.timeEnd("project-stats-calc")

    // Format language usage for pie chart
    console.time("language-chart-format")
    const languageUsageChart = languageUsage.map((item: any) => ({
      name: getLanguageName(item.language),
      value: item.count,
      color: getLanguageColor(item.language),
    }))
    console.timeEnd("language-chart-format")

    // Format project trends for bar chart - optimized
    console.time("project-trends-format")
    const trendsData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = date.toLocaleDateString("en", { month: "short" })
      const targetMonth = date.getMonth()
      const targetYear = date.getFullYear()

      // Use more efficient filtering - EXCLUDE SAMPLE PROJECTS
      const monthProjects =
        projectTrends?.filter((p: any) => {
          const projectDate = new Date(p.created_at)
          const isCorrectMonth = projectDate.getMonth() === targetMonth && projectDate.getFullYear() === targetYear
          // Exclude sample projects
          const isNotSample = !sampleProjectIds.has(p.id)
          return isCorrectMonth && isNotSample
        }).length || 0

      const monthExports =
        exports?.filter((e: any) => {
          const exportDate = new Date(e.created_at)
          const isCorrectMonth = exportDate.getMonth() === targetMonth && exportDate.getFullYear() === targetYear
          // Exclude exports from sample projects
          const isNotSample = !sampleProjectIds.has(e.project_id)
          return isCorrectMonth && isNotSample
        }).length || 0

      return {
        month: monthName,
        projects: monthProjects,
        exports: monthExports,
      }
    })
    console.timeEnd("project-trends-format")

    // Format processing time trends
    console.time("processing-time-format")
    const processingTimeChart = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dayName = date.toLocaleDateString("en", { weekday: "short" })

      const dayProcessingTimes =
        processingTimes?.filter((pt: any) => {
          const ptDate = new Date(pt.completed_at)
          const isCorrectDay = ptDate.toDateString() === date.toDateString()
          // Exclude processing times from sample projects (if project_id is available)
          // Note: processingTimes might not have project_id, so we check if it exists
          const isNotSample = !pt.project_id || !sampleProjectIds.has(pt.project_id)
          return isCorrectDay && isNotSample
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
    console.timeEnd("processing-time-format")

    // Get latest system metrics
    console.time("system-metrics-format")
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
    console.timeEnd("system-metrics-format")
    console.timeEnd("data-processing")

    console.time("response-build")
    const response = NextResponse.json({
      projectStats,
      languageUsage: languageUsageChart,
      projectTrends: trendsData,
      processingTimeData: processingTimeChart,
      systemMetrics: latestMetrics,
      recentActivity:
        recentActivity?.map((activity) => ({
          id: activity.id,
          type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          timestamp: formatTimeAgo(activity.created_at),
          user: "System User", // This would come from user data
        })) || [],
    })
    console.timeEnd("response-build")
    console.timeEnd("dashboard-api-total")
    return response
  } catch (error) {
    console.error("Dashboard analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
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

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}
