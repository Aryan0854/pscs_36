"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Globe, Palette, Download, Settings, LogIn, UserPlus, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [userSettings, setUserSettings] = useState({
    defaultLanguage: "hindi",
    theme: "light",
    notifications: true,
    autoSave: true,
    exportQuality: "high",
  })
  const { toast } = useToast()

  const handleLogin = () => {
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true)
      toast({
        title: "Login Successful",
        description: `Welcome back! Logged in as ${loginForm.email}`,
      })
      setLoginForm({ email: "", password: "" })
    } else {
      toast({
        title: "Login Failed",
        description: "Please enter both email and password.",
        variant: "destructive",
      })
    }
  }

  const handleSignup = () => {
    if (signupForm.name && signupForm.email && signupForm.password && signupForm.confirmPassword) {
      if (signupForm.password !== signupForm.confirmPassword) {
        toast({
          title: "Signup Failed",
          description: "Passwords do not match.",
          variant: "destructive",
        })
        return
      }
      setIsLoggedIn(true)
      toast({
        title: "Account Created",
        description: `Welcome ${signupForm.name}! Your account has been created successfully.`,
      })
      setSignupForm({ name: "", email: "", password: "", confirmPassword: "" })
    } else {
      toast({
        title: "Signup Failed",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const handleSettingChange = (key: string, value: any) => {
    setUserSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Settings Updated",
      description: `${key} has been updated successfully.`,
    })
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

        <Tabs defaultValue={isLoggedIn ? "account" : "auth"} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="account" disabled={!isLoggedIn}>
              Account
            </TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="auth" className="space-y-4">
            {!isLoggedIn ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <LogIn className="w-5 h-5" />
                        Login to Your Account
                      </CardTitle>
                      <CardDescription>Access your projects and settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your.email@gov.in"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={loginForm.password}
                            onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button onClick={handleLogin} className="w-full">
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="signup">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Create New Account
                      </CardTitle>
                      <CardDescription>Join the PIB multilingual video platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="Your full name"
                          value={signupForm.name}
                          onChange={(e) => setSignupForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your.email@gov.in"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a strong password"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleSignup} className="w-full">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Logged in as: {loginForm.email || signupForm.email}</p>
                      <Badge variant="default" className="mt-1">
                        Active Session
                      </Badge>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input id="display-name" defaultValue={signupForm.name || "Government User"} />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={loginForm.email || signupForm.email} />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue="pib">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pib">Press Information Bureau</SelectItem>
                      <SelectItem value="mib">Ministry of Information & Broadcasting</SelectItem>
                      <SelectItem value="dit">Department of Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select value={userSettings.theme} onValueChange={(value) => handleSettingChange("theme", value)}>
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
                    checked={userSettings.notifications}
                    onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save project changes</p>
                  </div>
                  <Switch
                    checked={userSettings.autoSave}
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
                    value={userSettings.defaultLanguage}
                    onValueChange={(value) => handleSettingChange("defaultLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="english">English</SelectItem>
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
                        <Switch defaultChecked />
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
                    value={userSettings.exportQuality}
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
                  <Select defaultValue="mp4">
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
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-download on Completion</Label>
                      <Switch defaultChecked />
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
