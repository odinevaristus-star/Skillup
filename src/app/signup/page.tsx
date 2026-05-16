
"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Checkbox } from "@/components/ui/checkbox"
import { Briefcase, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter, FirestorePermissionError, useAuth, useFirestore } from "@/firebase"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SKILL_CATEGORIES = {
  "Digital Skills": [
    "Programming",
    "Graphic Design",
    "Video Editing",
    "Writing",
    "UI/UX Design",
    "Tutoring"
  ],
  "Hand & Artisan Skills": [
    "Electrician",
    "Plumbing",
    "Mechanic",
    "Painting",
    "Barbering",
    "Hair Styling",
    "Tailoring",
    "Phone Repair"
  ]
}

export default function SignupPage() {
  const [role, setRole] = useState<'customer' | 'freelancer' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [primarySkill, setPrimarySkill] = useState("")
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    
    setIsLoading(true)
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const fullName = `${firstName} ${lastName}`
      
      await updateProfile(user, { displayName: fullName })
      
      // Determine skill category for freelancers
      let skillType = ""
      if (role === 'freelancer') {
        skillType = SKILL_CATEGORIES["Digital Skills"].includes(primarySkill) ? "Digital" : "Artisan"
      }
      
      const userData = {
        firstName,
        lastName,
        fullName,
        email,
        role,
        skills: primarySkill ? [primarySkill] : [],
        skillType, // Save Digital or Artisan
        bio: "",
        title: role === 'freelancer' ? (primarySkill || "Professional Freelancer") : "Project Client",
        avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/128/128`,
        createdAt: serverTimestamp(),
        rating: 5.0,
        completedJobs: 0,
        hourlyRate: role === 'freelancer' ? 45 : 0
      };

      setDoc(doc(db, "users", user.uid), userData)
        .then(() => {
          window.location.href = '/dashboard'
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'create',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
          setIsLoading(false)
        });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-2xl shadow-xl border-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
            <CardDescription>Join SkillUp as a client or freelancer</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                onClick={() => setRole('customer')}
                className={cn(
                  "p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 group",
                  role === 'customer' ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">I'm a Client</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">I want to hire top talent for my projects and businesses.</p>
              </div>
              <div 
                onClick={() => setRole('freelancer')}
                className={cn(
                  "p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 group",
                  role === 'freelancer' ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-bold mb-2">I'm a Freelancer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">I'm a professional looking to work on exciting new projects.</p>
              </div>
            </div>

            {role && (
              <form onSubmit={handleSignup} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {role === 'freelancer' && (
                  <div className="grid gap-2">
                    <Label htmlFor="primarySkill">Primary Skill / Category</Label>
                    <Select value={primarySkill} onValueChange={setPrimarySkill} required>
                      <SelectTrigger id="primarySkill" className="h-11">
                        <SelectValue placeholder="Select your expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Digital Skills</SelectLabel>
                          {SKILL_CATEGORIES["Digital Skills"].map((skill) => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Hand & Artisan Skills</SelectLabel>
                          {SKILL_CATEGORIES["Hand & Artisan Skills"].map((skill) => (
                            <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox id="terms" required />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                    By creating an account, you agree to our <Link href="#" className="text-primary hover:underline font-medium">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
                  </label>
                </div>
                <Button className="w-full h-11 text-base font-semibold mt-4" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-1">
            <span className="text-sm text-muted-foreground">Already have an account?</span>
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Log in</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
