"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Github, Chrome, Loader2 } from "lucide-react"
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  GithubAuthProvider,
  sendPasswordResetEmail 
} from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/firebase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Password Reset States
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const { toast } = useToast()
  const auth = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message
      })
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Social login failed",
        description: error.message
      })
    }
  }

  const handleOpenResetModal = () => {
    setResetEmail(email)
    setShowResetModal(true)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return

    setIsResetting(true)
    try {
      await sendPasswordResetEmail(auth, resetEmail)
      toast({
        title: "Password reset email sent!",
        description: "Please check your inbox for instructions to reset your password.",
      })
      setShowResetModal(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Could not send reset email. Please check the email address and try again.",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-md shadow-xl border-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            <CardDescription>Enter your email and password to log in</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button 
                      type="button"
                      onClick={handleOpenResetModal}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Remember me
                  </label>
                </div>
                <Button className="w-full h-11 text-base font-semibold" type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </div>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-11" onClick={() => handleSocialLogin('github')}>
                <Github className="mr-2 h-4 w-4" /> Github
              </Button>
              <Button variant="outline" className="h-11" onClick={() => handleSocialLogin('google')}>
                <Chrome className="mr-2 h-4 w-4" /> Google
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1">
            <span className="text-sm text-muted-foreground">Don't have an account?</span>
            <Link href="/signup" className="text-sm font-semibold text-primary hover:underline">Sign up</Link>
          </CardFooter>
        </Card>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@example.com"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <DialogFooter className="sm:justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResetModal(false)}
                className="font-semibold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isResetting}
                className="font-semibold"
              >
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
