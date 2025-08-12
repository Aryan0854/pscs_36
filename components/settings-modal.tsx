"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Globe, Palette, Download, Settings, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { name: string; email: string; role: string } | null
  onLogout: () => void
}

interface UserSettings {
  theme: "light" | "dark" | "system"
  defaultLanguage: string
  enabledLanguages: string[]
  notifications: boolean
  autoSave: boolean
  exportQuality: "high" | "medium" | "low"
  exportFormat: "mp4" | "mov" | "avi"
  parallelProcessing: boolean
  autoDownload: boolean
}

export function SettingsModal({ open, onOpenChange, user, onLogout }: SettingsModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    defaultLanguage: "english",
    enabledLanguages: ["english", "hindi"],
    notifications: true,
    autoSave: true,
    exportQuality: "high",
    exportFormat: "mp4",
    parallelProcessing: true,
    autoDownload: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    if (user && open) {
      loadUserSettings()
    }
  }, [user, open])

  const loadUserSettings = async () => {
    try {
      const response = await fetch(`/api/settings?userId=${user?.email}`)
      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
        applyTheme(result.data.theme)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const applyTheme = (theme: string) => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      // System theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }

  const handleSettingChange = async (key: keyof UserSettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.email, ...updatedSettings }),
      })

      const result = await response.json()

      if (result.success) {
        if (key === "theme") {
          applyTheme(value)
        }

        toast({
          title: "Settings Updated",
          description: `${key} has been updated successfully.`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Settings Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
      // Revert the change
      setSettings(settings)
    }
  }

  const handleLanguageToggle = (language: string, enabled: boolean) => {
    const updatedLanguages = enabled
      ? [...settings.enabledLanguages, language.toLowerCase()]
      : settings.enabledLanguages.filter((lang) => lang !== language.toLowerCase())

    handleSettingChange("enabledLanguages", updatedLanguages)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "mock_google_credential" }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Google Login Successful",
          description: "Successfully authenticated with Google",
        })
        window.location.reload()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Google Login Failed",
        description: "Failed to authenticate with Google",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Platform Settings
          </DialogTitle>
          <DialogDescription>Manage your account, preferences, and platform configuration</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                    <Button variant="outline" onClick={onLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Alternative Login Methods</h4>
                  <Button
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-transparent"
                  >
                    {isLoading ? "Connecting..." : "Connect with Google"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Interface Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred interface theme</p>
                  </div>
                  <Select value={settings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive processing and export notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save project changes</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => handleSettingChange("autoSave", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Language</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) => handleSettingChange("defaultLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="bengali">Bengali</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="telugu">Telugu</SelectItem>
                      <SelectItem value="marathi">Marathi</SelectItem>
                      <SelectItem value="gujarati">Gujarati</SelectItem>
                      <SelectItem value="urdu">Urdu</SelectItem>
                      <SelectItem value="kannada">Kannada</SelectItem>
                      <SelectItem value="odia">Odia</SelectItem>
                      <SelectItem value="malayalam">Malayalam</SelectItem>
                      <SelectItem value="punjabi">Punjabi</SelectItem>
                      <SelectItem value="assamese">Assamese</SelectItem>
                      <SelectItem value="maithili">Maithili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Enabled Languages</Label>
                  <p className="text-sm text-muted-foreground mb-2">Select languages for video generation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Hindi",
                      "English",
                      "Bengali",
                      "Tamil",
                      "Telugu",
                      "Marathi",
                      "Gujarati",
                      "Urdu",
                      "Kannada",
                      "Odia",
                      "Malayalam",
                      "Punjabi",
                      "Assamese",
                      "Maithili",
                    ].map((lang) => (
                      <div key={lang} className="flex items-center space-x-2">
                        <Switch
                          checked={settings.enabledLanguages.includes(lang.toLowerCase())}
                          onCheckedChange={(checked) => handleLanguageToggle(lang, checked)}
                        />
                        <Label className="text-sm">{lang}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Default Export Quality</Label>
                  <Select
                    value={settings.exportQuality}
                    onValueChange={(value) => handleSettingChange("exportQuality", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High (1080p)</SelectItem>
                      <SelectItem value="medium">Medium (720p)</SelectItem>
                      <SelectItem value="low">Low (480p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Export Format</Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(value) => handleSettingChange("exportFormat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                      <SelectItem value="avi">AVI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Batch Processing</Label>
                  <p className="text-sm text-muted-foreground mb-2">Configure batch export settings</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Parallel Processing</Label>
                      <Switch
                        checked={settings.parallelProcessing}
                        onCheckedChange={(checked) => handleSettingChange("parallelProcessing", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-download on Completion</Label>
                      <Switch
                        checked={settings.autoDownload}
                        onCheckedChange={(checked) => handleSettingChange("autoDownload", checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
