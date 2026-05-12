
"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Github, Chrome } from "lucide-react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, GithubAuthProvider } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/firebase"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  const auth = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.href = '/dashboard'
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
      window.location.href = '/dashboard'
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Social login failed",
        description: error.message
      })
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
                    <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
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
    </div>
  )
}
