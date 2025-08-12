import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Get project stats
    const { data: projects } = await supabase.from("projects").select("*")

    const { data: exports } = await supabase.from("project_exports").select("*").eq("status", "completed")

    // Get language usage
    const { data: languageData } = await supabase.from("language_usage").select("language, usage_count")

    // Aggregate language usage
    const languageUsage =
      languageData?.reduce((acc: any, curr) => {
        const existing = acc.find((item: any) => item.language === curr.language)
        if (existing) {
          existing.count += curr.usage_count
        } else {
          acc.push({ language: curr.language, count: curr.usage_count })
        }
        return acc
      }, []) || []

    // Get project trends (last 6 months)
    const { data: projectTrends } = await supabase
      .from("projects")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get processing time trends (last 7 days)
    const { data: processingTimes } = await supabase
      .from("project_exports")
      .select("processing_time_minutes, completed_at")
      .not("completed_at", "is", null)
      .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Get system metrics
    const { data: systemMetrics } = await supabase
      .from("system_metrics")
      .select("*")
      .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: false })

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    // Process the data for charts
    const projectStats = {
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter((p) => p.status === "active").length || 0,
      completedProjects: projects?.filter((p) => p.status === "completed").length || 0,
      totalLanguages: 14,
      totalDuration: `${projects?.reduce((sum, p) => sum + (p.duration_minutes || 0), 0) || 0}m`,
      processingTime: `${exports?.reduce((sum, e) => sum + (e.processing_time_minutes || 0), 0) || 0}m`,
    }

    // Format language usage for pie chart
    const languageUsageChart = languageUsage.map((item: any) => ({
      name: getLanguageName(item.language),
      value: item.count,
      color: getLanguageColor(item.language),
    }))

    // Format project trends for bar chart
    const trendsData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      const monthName = date.toLocaleDateString("en", { month: "short" })

      const monthProjects =
        projectTrends?.filter((p) => {
          const projectDate = new Date(p.created_at)
          return projectDate.getMonth() === date.getMonth() && projectDate.getFullYear() === date.getFullYear()
        }).length || 0

      const monthExports =
        exports?.filter((e) => {
          const exportDate = new Date(e.created_at)
          return exportDate.getMonth() === date.getMonth() && exportDate.getFullYear() === date.getFullYear()
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
    const latestMetrics = {
      cpuUsage: systemMetrics?.find((m) => m.metric_type === "cpu_usage")?.value || 0,
      memoryUsage: systemMetrics?.find((m) => m.metric_type === "memory_usage")?.value || 0,
      storageUsage: systemMetrics?.find((m) => m.metric_type === "storage_usage")?.value || 0,
      activeJobs: 3, // This would come from a job queue system
    }

    return NextResponse.json({
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
