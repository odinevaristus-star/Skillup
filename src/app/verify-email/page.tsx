"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, CheckCircle, RefreshCw, LogOut } from "lucide-react"
import { useAuth, useUser } from "@/firebase"
import { sendEmailVerification, signOut } from "firebase/auth"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function VerifyEmailPage() {
  const { user } = useUser()
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)

  const handleResendEmail = async () => {
    if (!auth.currentUser) return
    setIsResending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast({
        title: "Verification email sent!",
        description: "Please check your inbox for the new link."
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not resend email",
        description: error.message
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/")
  }

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
            <CardTitle className="text-3xl font-black tracking-tight">Check your inbox</CardTitle>
            <CardDescription className="text-base font-medium">
              We've sent a verification link to <span className="text-foreground font-bold">{user?.email || "your email"}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once you've verified your email, you'll be able to access the full SkillUp marketplace and start hiring or working.
            </p>
            <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-2xl border border-muted-foreground/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Click the link in the email to continue</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 p-8 border-t bg-muted/10">
            <Button 
              className="w-full h-12 rounded-xl font-bold gap-2" 
              variant="outline" 
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Resend verification email
            </Button>
            <Button 
              className="w-full h-12 rounded-xl font-bold gap-2" 
              variant="ghost" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout and use a different email
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
