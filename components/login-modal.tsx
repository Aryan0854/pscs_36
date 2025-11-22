"use client"

import type React from "react"
import { useState, useTransition, useEffect, useRef } from "react"
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

declare global {
  interface Window {
    hcaptcha: {
      render: (container: string | HTMLElement, options: any) => string
      execute: (widgetId: string) => Promise<{ response: string }>
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

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
  const [loginCaptchaToken, setLoginCaptchaToken] = useState("")
  const [signupCaptchaToken, setSignupCaptchaToken] = useState("")
  const [hCaptchaLoaded, setHCaptchaLoaded] = useState(false)
  const [captchaLoadError, setCaptchaLoadError] = useState(false)
  const [allowCaptchaBypass, setAllowCaptchaBypass] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [captchaRetryCount, setCaptchaRetryCount] = useState(0)
  const loginCaptchaRef = useRef<HTMLDivElement>(null)
  const signupCaptchaRef = useRef<HTMLDivElement>(null)
  const loginWidgetId = useRef<string>("")
  const signupWidgetId = useRef<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const loadHCaptcha = () => {
      // If already loaded, don't try again
      if (window.hcaptcha) {
        setHCaptchaLoaded(true)
        return
      }

      // Prevent infinite retries
      if (captchaRetryCount > 3) {
        console.error("[v0] hCaptcha failed to load after multiple attempts")
        setCaptchaLoadError(true)
        setAllowCaptchaBypass(true)
        toast({
          title: "Captcha Temporarily Unavailable",
          description: "Security verification is temporarily unavailable. You can proceed without it.",
          variant: "destructive",
          duration: 8000,
        })
        return
      }

      const script = document.createElement("script")
      script.src = "https://js.hcaptcha.com/1/api.js"
      script.async = true
      script.defer = true
      script.onload = () => {
        setHCaptchaLoaded(true)
        setCaptchaRetryCount(0) // Reset retry count on success
        console.log("[v0] hCaptcha script loaded successfully")
      }
      script.onerror = () => {
        console.error("[v0] Failed to load hCaptcha script - attempt", captchaRetryCount + 1)
        // Retry after a delay
        setTimeout(() => {
          setCaptchaRetryCount(prev => prev + 1)
          loadHCaptcha()
        }, 2000)
      }
      
      // Add timeout to handle cases where onload/onerror don't fire
      setTimeout(() => {
        if (!window.hcaptcha && !hCaptchaLoaded && captchaRetryCount <= 3) {
          console.error("[v0] hCaptcha script timeout - attempt", captchaRetryCount + 1)
          setTimeout(() => {
            setCaptchaRetryCount(prev => prev + 1)
            loadHCaptcha()
          }, 2000)
        }
      }, 5000)
      
      document.head.appendChild(script)
    }

    loadHCaptcha()
  }, [captchaRetryCount])

  useEffect(() => {
    if (open && hCaptchaLoaded && window.hcaptcha) {
      const initializeCaptcha = () => {
        if (activeTab === "login") {
          const loginDisplayContainer = document.getElementById("login-captcha-display")
          if (loginDisplayContainer && loginDisplayContainer.children.length === 0) {
            if (loginWidgetId.current) {
              try {
                window.hcaptcha.remove(loginWidgetId.current)
                console.log("[v0] Removed existing login captcha widget")
              } catch (error) {
                console.error("[v0] Error removing existing login captcha widget:", error)
              }
              loginWidgetId.current = ""
            }

            try {
              loginWidgetId.current = window.hcaptcha.render(loginDisplayContainer, {
                sitekey: "0444df0c-67b4-4d7c-8aca-b2e662ce1e6c",
                size: "normal",
                theme: "light",
                callback: (token: string) => {
                  console.log("[v0] Login captcha completed, token length:", token.length)
                  setLoginCaptchaToken(token)
                },
                "expired-callback": () => {
                  console.log("[v0] Login captcha expired")
                  setLoginCaptchaToken("")
                },
                "error-callback": (error: any) => {
                  console.error("[v0] Login captcha error:", error)
                  setLoginCaptchaToken("")
                  // Don't set captcha error here, just reset the token
                },
              })
              console.log("[v0] Login captcha widget created with ID:", loginWidgetId.current)
            } catch (error) {
              console.error("[v0] Failed to create login captcha widget:", error)
              // We still allow bypass since the main issue is loading
            }
          }
        }

        if (activeTab === "signup") {
          const signupDisplayContainer = document.getElementById("signup-captcha-display")
          if (signupDisplayContainer && signupDisplayContainer.children.length === 0) {
            if (signupWidgetId.current) {
              try {
                window.hcaptcha.remove(signupWidgetId.current)
                console.log("[v0] Removed existing signup captcha widget")
              } catch (error) {
                console.error("[v0] Error removing existing signup captcha widget:", error)
              }
              signupWidgetId.current = ""
            }

            try {
              signupWidgetId.current = window.hcaptcha.render(signupDisplayContainer, {
                sitekey: "0444df0c-67b4-4d7c-8aca-b2e662ce1e6c",
                size: "normal",
                theme: "light",
                callback: (token: string) => {
                  console.log("[v0] Signup captcha completed, token length:", token.length)
                  setSignupCaptchaToken(token)
                },
                "expired-callback": () => {
                  console.log("[v0] Signup captcha expired")
                  setSignupCaptchaToken("")
                },
                "error-callback": (error: any) => {
                  console.error("[v0] Signup captcha error:", error)
                  setSignupCaptchaToken("")
                  // Don't set captcha error here, just reset the token
                },
              })
              console.log("[v0] Signup captcha widget created with ID:", signupWidgetId.current)
            } catch (error) {
              console.error("[v0] Failed to create signup captcha widget:", error)
              // We still allow bypass since the main issue is loading
            }
          }
        }
      }

      setTimeout(initializeCaptcha, 100)
    }

    // Cleanup when modal closes
    return () => {
      if (!open && window.hcaptcha) {
        if (loginWidgetId.current) {
          try {
            window.hcaptcha.remove(loginWidgetId.current)
            console.log("[v0] Removed login captcha widget")
          } catch (error) {
            console.error("[v0] Error removing login captcha widget:", error)
          }
          loginWidgetId.current = ""
        }
        if (signupWidgetId.current) {
          try {
            window.hcaptcha.remove(signupWidgetId.current)
            console.log("[v0] Removed signup captcha widget")
          } catch (error) {
            console.error("[v0] Error removing signup captcha widget:", error)
          }
          signupWidgetId.current = ""
        }
        setLoginCaptchaToken("")
        setSignupCaptchaToken("")
      }
    }
  }, [open, hCaptchaLoaded, activeTab])

  useEffect(() => {
    setRedirectUrl("https://v0-make-this-psi.vercel.app/auth/callback")
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
            scope: "openid email profile",
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
          description:
            "Unable to connect to authentication service. Please check your internet connection and try again.",
          variant: "destructive",
          duration: 8000,
        })
      } else if (error.message?.includes("OAuth")) {
        toast({
          title: "OAuth Configuration Error",
          description: "Google OAuth is not properly configured. Please contact your administrator.",
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

    // Only require captcha if it's actually loaded and not in bypass mode
    if (!loginCaptchaToken && hCaptchaLoaded && !allowCaptchaBypass) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        console.log("[v0] Login attempt for domain:", window.location.hostname)
        console.log("[v0] Using redirect URL:", redirectUrl)
        console.log("[v0] Captcha token (first 20 chars):", loginCaptchaToken?.substring(0, 20) + "...")
        console.log("[v0] Captcha token length:", loginCaptchaToken?.length || 0)

        const authOptions: any = {
          email: loginData.email.trim(),
          password: loginData.password,
        }

        // Only add captcha token if available and loaded
        if (loginCaptchaToken && hCaptchaLoaded) {
          authOptions.options = { captchaToken: loginCaptchaToken }
        }

        const { data, error } = await supabase.auth.signInWithPassword(authOptions)

        if (error) {
          throw error
        }

        if (data.user) {
          console.log("[v0] Login successful")
          toast({
            title: "Login Successful",
            description: `Welcome back, ${data.user.user_metadata?.name || data.user.email}!`,
          })
          onAuthSuccess(data.user)
          onOpenChange(false)
          setLoginData({ email: "", password: "" })
          setNeedsConfirmation(false)
          setConfirmationEmail("")
          if (window.hcaptcha && loginWidgetId.current) {
            window.hcaptcha.reset(loginWidgetId.current)
            setLoginCaptchaToken("")
          }
        }
      } catch (error: any) {
        console.error("[v0] Login error details:", {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status,
        })

        if (window.hcaptcha && loginWidgetId.current) {
          window.hcaptcha.reset(loginWidgetId.current)
          setLoginCaptchaToken("")
        }

        if (error.message?.includes("sitekey-secret-mismatch")) {
          toast({
            title: "Captcha Configuration Error",
            description: `The captcha is not configured for domain: ${window.location.hostname}. Please contact your administrator.`,
            variant: "destructive",
            duration: 10000,
          })
        } else if (error.message?.includes("captcha protection")) {
          toast({
            title: "Captcha Verification Error",
            description: `Captcha verification failed for domain: ${window.location.hostname}. Please refresh and try again.`,
            variant: "destructive",
            duration: 8000,
          })
        } else if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
          toast({
            title: "Connection Error",
            description:
              "Unable to connect to authentication service. Please check your internet connection and try again.",
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
        } else if (error.message?.includes("captcha") && hCaptchaLoaded) {
          toast({
            title: "Captcha Verification Failed",
            description: "Please complete the captcha verification and try again.",
            variant: "destructive",
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

    // Only require captcha if it's actually loaded and not in bypass mode
    if (!signupCaptchaToken && hCaptchaLoaded && !allowCaptchaBypass) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        if (!redirectUrl) return // Wait for redirect URL to be set

        console.log("[v0] Signup attempt with captcha token:", signupCaptchaToken?.substring(0, 20) + "...")

        const signupOptions: any = {
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
        }

        // Only add captcha token if available and loaded
        if (signupCaptchaToken && hCaptchaLoaded) {
          signupOptions.options.captchaToken = signupCaptchaToken
        }

        const { data, error } = await supabase.auth.signUp(signupOptions)

        if (error) {
          throw error
        }

        if (data.user) {
          console.log("[v0] Signup successful")
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
          if (window.hcaptcha && signupWidgetId.current) {
            window.hcaptcha.reset(signupWidgetId.current)
            setSignupCaptchaToken("")
          }
        }
      } catch (error: any) {
        console.error("[v0] Signup error:", error)

        if (window.hcaptcha && signupWidgetId.current) {
          window.hcaptcha.reset(signupWidgetId.current)
          setSignupCaptchaToken("")
        }

        if (
          error.message?.includes("User already registered") ||
          error.message?.includes("email address is already registered") ||
          error.message?.includes("already exists") ||
          error.code === "user_already_exists"
        ) {
          toast({
            title: "Account Already Exists",
            description: `An account with email ${signupData.email} already exists. Please try logging in instead or use a different email address.`,
            variant: "destructive",
            duration: 10000,
          })
        } else if (error.message?.includes("sitekey-secret-mismatch")) {
          toast({
            title: "Captcha Configuration Error",
            description:
              "The captcha verification system is not properly configured. Please contact your administrator or try again later.",
            variant: "destructive",
            duration: 10000,
          })
        } else if (error.message?.includes("captcha protection")) {
          toast({
            title: "Captcha Verification Error",
            description: "There was an issue with captcha verification. Please refresh the page and try again.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
          toast({
            title: "Connection Error",
            description:
              "Unable to connect to authentication service. Please check your internet connection and try again.",
            variant: "destructive",
            duration: 8000,
          })
        } else if (error.message?.includes("captcha") && hCaptchaLoaded) {
          toast({
            title: "Captcha Verification Failed",
            description: "Please complete the captcha verification and try again.",
            variant: "destructive",
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
        description: `Please check your email (${email}) including spam folder and click the confirmation link to activate your account. The link will redirect you back to this site.`,
        duration: 10000,
      })
    } catch (error: any) {
      console.error("Resend confirmation error:", error)

      if (error.message?.includes("Failed to fetch") || error.name === "AuthRetryableFetchError") {
        toast({
          title: "Connection Error",
          description:
            "Unable to connect to authentication service. Please check your internet connection and try again.",
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
      <DialogContent className="w-[95vw] max-w-[500px] sm:w-full">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg sm:text-xl">PIB Multilingual Video Platform</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Secure access to AI-powered press release video generation
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Welcome Back</CardTitle>
                <CardDescription className="text-sm">Enter your credentials to access the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                  <div className="space-y-2">
                    <Label className="text-sm">Security Verification</Label>
                    <div className="min-h-[78px] flex items-center justify-center border rounded-md bg-gray-50 p-2">
                      <div
                        id="login-captcha-display"
                        className="flex justify-center w-full scale-90 sm:scale-100 origin-center"
                      ></div>
                      {!hCaptchaLoaded && !captchaLoadError && (
                        <div className="text-xs sm:text-sm text-muted-foreground text-center p-4">
                          Loading security verification...
                        </div>
                      )}
                      {captchaLoadError && (
                        <div className="text-xs sm:text-sm text-orange-600 text-center p-4">
                          ⚠️ Captcha temporarily unavailable - you can proceed without it
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || (hCaptchaLoaded && !loginCaptchaToken && !allowCaptchaBypass)}
                  >
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
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Create Account</CardTitle>
                <CardDescription className="text-sm">Register for authorized access to the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        required
                        disabled={isPending}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@gov.in"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        disabled={isPending}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm">
                        Role
                      </Label>
                      <Select
                        value={signupData.role}
                        onValueChange={(value) => setSignupData({ ...signupData, role: value })}
                        disabled={isPending}
                      >
                        <SelectTrigger className="text-sm">
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
                      <Label htmlFor="department" className="text-sm">
                        Department
                      </Label>
                      <Input
                        id="department"
                        placeholder="Ministry/Department"
                        value={signupData.department}
                        onChange={(e) => setSignupData({ ...signupData, department: e.target.value })}
                        disabled={isPending}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password (min 6 characters)"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      disabled={isPending}
                      minLength={6}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                      disabled={isPending}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Security Verification</Label>
                    <div className="min-h-[78px] flex items-center justify-center border rounded-md bg-gray-50 p-2">
                      <div
                        id="signup-captcha-display"
                        className="flex justify-center w-full scale-90 sm:scale-100 origin-center"
                      ></div>
                      {!hCaptchaLoaded && !captchaLoadError && (
                        <div className="text-xs sm:text-sm text-muted-foreground text-center p-4">
                          Loading security verification...
                        </div>
                      )}
                      {captchaLoadError && (
                        <div className="text-xs sm:text-sm text-orange-600 text-center p-4">
                          ⚠️ Captcha temporarily unavailable - you can proceed without it
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending || (hCaptchaLoaded && !signupCaptchaToken && !allowCaptchaBypass)}
                  >
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
