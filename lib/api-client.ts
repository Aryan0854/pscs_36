// API client utility for frontend components
class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Projects API
  async getProjects(params?: { status?: string; userId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append("status", params.status)
    if (params?.userId) searchParams.append("userId", params.userId)

    const query = searchParams.toString()
    return this.request(`/projects${query ? `?${query}` : ""}`)
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`)
  }

  async createProject(data: { title: string; description: string; languages: string[] }) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: Partial<{ title: string; description: string; status: string }>) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: "DELETE",
    })
  }

  // Scenes API
  async getScenes(projectId?: string) {
    const query = projectId ? `?projectId=${projectId}` : ""
    return this.request(`/scenes${query}`)
  }

  async createScene(data: {
    projectId: string
    title: string
    description?: string
    template: string
    duration?: number
    language?: string
  }) {
    return this.request("/scenes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Export API
  async getExportJobs(params?: { status?: string; projectId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append("status", params.status)
    if (params?.projectId) searchParams.append("projectId", params.projectId)

    const query = searchParams.toString()
    return this.request(`/export${query ? `?${query}` : ""}`)
  }

  async createExportJob(data: {
    projectId: string
    projectName: string
    languages: string[]
    format?: string
    quality?: string
    includeSubtitles?: boolean
    includeThumbnails?: boolean
  }) {
    return this.request("/export", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Analytics API
  async getAnalytics(timeRange?: string) {
    const query = timeRange ? `?timeRange=${timeRange}` : ""
    return this.request(`/analytics${query}`)
  }

  // Upload API
  async uploadFile(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      body: formData,
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
  }
}

export const apiClient = new ApiClient()
