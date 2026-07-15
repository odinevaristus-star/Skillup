"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, CheckCircle, RefreshCw, LogOut, SearchCheck } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { sendEmailVerification, signOut, reload } from "firebase/auth"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const { user, loading: authLoading } = useUser()
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // Auto-redirect if they manage to verify while on this page
  useEffect(() => {
    if (user?.emailVerified) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleCheckStatus = async () => {
    if (!auth.currentUser) return
    setIsChecking(true)
    try {
      // Reload the user object to get the latest emailVerified status
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        toast({ title: "Email verified!", description: "Welcome to SkillUp." })
        router.replace("/dashboard")
      } else {
        toast({ 
          variant: "outline",
          title: "Still unverified", 
          description: "Please click the link in your email, then check again." 
        })
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Status check failed", description: error.message })
    } finally {
      setIsChecking(false)
    }
  }

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to resend the email." })
      return
    }

    setIsResending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast({
        title: "Verification email sent!",
        description: "Please check your inbox (and spam folder) for the new link."
      })
    } catch (error: any) {
      console.error("Verification error:", error)
      let message = "Could not send verification email."
      if (error.code === 'auth/too-many-requests') {
        message = "Too many requests. Please wait a moment before trying again."
      }
      toast({
        variant: "destructive",
        title: "Email delivery failed",
        description: message
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/")
  }

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none rounded-[2rem] text-center overflow-hidden">
          <div className="bg-primary p-8 flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center">
              <Mail className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardHeader className="pt-8">
            <CardTitle className="text-3xl font-black tracking-tight">Verify Your Email</CardTitle>
            <CardDescription className="text-base font-medium">
              We've sent a link to <span className="text-foreground font-bold">{user?.email || "your email"}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              To keep the campus community safe, we need you to confirm your email address before you can hire or apply for jobs.
            </p>
            
            <div className="space-y-3">
              <Button 
                className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" 
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <SearchCheck className="h-5 w-5 mr-2" />}
                I've clicked the link
              </Button>
              
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-2xl border border-muted-foreground/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Link expires in 24 hours</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-8 border-t bg-muted/10">
            <Button 
              className="w-full h-12 rounded-xl font-bold gap-2" 
              variant="outline" 
              onClick={handleResendEmail}
              disabled={isResending}
            >
              <RefreshCw className={isResending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Resend verification email
            </Button>
            <Button 
              className="w-full h-12 rounded-xl font-bold gap-2" 
              variant="ghost" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Use a different email
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
