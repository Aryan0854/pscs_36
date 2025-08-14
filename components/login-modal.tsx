"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Video, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthSuccess: (user: any) => void
}

export function LoginModal({ open, onOpenChange, onAuthSuccess }: LoginModalProps) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
  })
  const [redirectUrl, setRedirectUrl] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    // Set redirect URL only on client side to avoid hydration mismatch
    setRedirectUrl(`${window.location.origin}/auth/callback`)
  }, [])

  const handleGoogleLogin = async () => {
    try {
      if (!redirectUrl) return // Wait for redirect URL to be set

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        throw error
      }

      // OAuth will redirect, so we don't need to handle success here
    } catch (error: any) {
      console.error("Google login error:", error)
      
      if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection and try again.",
          variant: "destructive",
          duration: 8000,
        })
      } else {
        toast({
          title: "Google Login Failed",
          description: error.message || "Failed to authenticate with Google. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!loginData.email || !loginData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email.trim(),
          password: loginData.password,
        })

        if (error) {
          throw error
        }

        if (data.user) {
          toast({
            title: "Login Successful",
            description: `Welcome back, ${data.user.user_metadata?.name || data.user.email}!`,
          })
          onAuthSuccess(data.user)
          onOpenChange(false)
          setLoginData({ email: "", password: "" })
          setNeedsConfirmation(false)
          setConfirmationEmail("")
        }
      } catch (error: any) {
        console.error("Login error:", error)

        // Handle network/connection errors
        if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
          toast({
            title: "Connection Error",
            description: "Unable to connect to authentication service. Please check your internet connection and try again.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (error.message?.includes("Email not confirmed") || error.message?.includes("email_not_confirmed")) {
          setNeedsConfirmation(true)
          setConfirmationEmail(loginData.email)
          toast({
            title: "Email Confirmation Required",
            description:
              "Your account exists but needs email confirmation. Check your email for the confirmation link.",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "Login Failed",
            description: error.message || "Invalid credentials. Please check your email and password.",
            variant: "destructive",
          })
        }
      }
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signupData.name.trim() || !signupData.email.trim() || !signupData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        if (!redirectUrl) return // Wait for redirect URL to be set

        const { data, error } = await supabase.auth.signUp({
          email: signupData.email.trim(),
          password: signupData.password,
          options: {
            data: {
              name: signupData.name.trim(),
              role: signupData.role || "content-creator",
              department: signupData.department.trim(),
              full_name: signupData.name.trim(),
            },
            emailRedirectTo: redirectUrl,
          },
        })

        if (error) {
          throw error
        }

        if (data.user) {
          if (data.user.email_confirmed_at) {
            toast({
              title: "Account Created Successfully",
              description: "Welcome to PIB Multilingual Video Platform!",
            })
            onAuthSuccess(data.user)
            onOpenChange(false)
          } else {
            toast({
              title: "Account Created - Confirmation Required",
              description: `Please check your email (${signupData.email}) and click the confirmation link to activate your account. The link will redirect you back to this site.`,
              duration: 10000,
            })
          }

          setSignupData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "",
            department: "",
          })
        }
      } catch (error: any) {
        console.error("Signup error:", error)
        
        if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
          toast({
            title: "Connection Error",
            description: "Unable to connect to authentication service. Please check your internet connection and try again.",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "Signup Failed",
            description: error.message || "Failed to create account. Please try again.",
            variant: "destructive",
          })
        }
      }
    })
  }

  const handleResendConfirmation = async (email: string) => {
    setIsResending(true)
    try {
      if (!redirectUrl) return // Wait for redirect URL to be set

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Confirmation Email Sent",
        description: `Please check your email (${email}) including spam folder and click the confirmation link. The link will redirect you back to this site.`,
        duration: 10000,
      })
    } catch (error: any) {
      console.error("Resend confirmation error:", error)
      
      if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
        toast({
          title: "Connection Error",
          description: "Unable to connect to authentication service. Please check your internet connection and try again.",
          variant: "destructive",
          duration: 8000,
        })
      } else {
        toast({
          title: "Failed to Resend Email",
          description: error.message || "Could not resend confirmation email. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl">PIB Multilingual Video Platform</DialogTitle>
          </div>
          <DialogDescription>Secure access to AI-powered press release video generation</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to access the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {needsConfirmation && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Email Confirmation Required</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Your account exists but needs email confirmation. Please check your email for the confirmation
                      link.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendConfirmation(confirmationEmail)}
                        disabled={isResending}
                        className="bg-white"
                      >
                        {isResending ? "Sending..." : "Resend Confirmation Email"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNeedsConfirmation(false)
                          setConfirmationEmail("")
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@gov.in"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isPending}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Signing In..." : "Sign In"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleGoogleLogin}
                    disabled={isPending}
                  >
                    {isPending ? "Connecting..." : "Continue with Google"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Register for authorized access to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@gov.in"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={signupData.role}
                        onValueChange={(value) => setSignupData({ ...signupData, role: value })}
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="content-creator">Content Creator</SelectItem>
                          <SelectItem value="editor">Video Editor</SelectItem>
                          <SelectItem value="reviewer">Content Reviewer</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Ministry/Department"
                        value={signupData.department}
                        onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password (min 6 characters)"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      disabled={isPending}
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
