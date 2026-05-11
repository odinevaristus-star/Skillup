
"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Camera, X, Plus, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfileManagement() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  const [fullName, setFullName] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "")
      setTitle(profile.title || "")
      setBio(profile.bio || "")
      setSkills(profile.skills || [])
    }
  }, [profile])

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSave = () => {
    if (!user?.uid || !db) return
    setIsSaving(true)
    
    const data = {
      fullName,
      title,
      bio,
      skills,
      role: profile?.role || "freelancer"
    };

    setDoc(doc(db, "users", user.uid), data, { merge: true })
      .then(() => {
        toast({
          title: "Profile updated",
          description: "Your professional details have been saved successfully."
        })
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}`,
          operation: 'write',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const profileStrength = [
    !!fullName,
    !!title,
    !!bio,
    skills.length > 0
  ].filter(Boolean).length * 25

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-muted-foreground">Manage your public presence and professional details.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>This information will be displayed on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/128/128`} />
                    <AvatarFallback>{fullName?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Professional Title</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Full Stack Engineer"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      rows={5} 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell clients about your expertise..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button className="ml-auto gap-2" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Add the skills you want to be discovered for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1 flex items-center gap-1 group">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {skills.length === 0 && <p className="text-sm text-muted-foreground italic">No skills added yet.</p>}
              </div>
              <form onSubmit={addSkill} className="flex gap-2">
                <Input 
                  placeholder="e.g. Python, Figma, Marketing" 
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
                <Button type="submit" variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="text-lg">Profile Strength</CardTitle>
              <CardDescription className="text-primary-foreground/70">Complete your profile to get more jobs.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{profileStrength}% Complete</span>
                </div>
                <Progress value={profileStrength} className="h-2" />
              </div>
              <ul className="space-y-3">
                <li className={`flex items-center gap-2 text-sm font-medium ${fullName ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {fullName ? <Save className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Name added
                </li>
                <li className={`flex items-center gap-2 text-sm font-medium ${title ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {title ? <Save className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Title added
                </li>
                <li className={`flex items-center gap-2 text-sm font-medium ${bio ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {bio ? <Save className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Bio added
                </li>
                <li className={`flex items-center gap-2 text-sm font-medium ${skills.length > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {skills.length > 0 ? <Save className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Skills listed
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Available for work</p>
                  <p className="text-xs text-muted-foreground">Allow clients to message you.</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Public profile</p>
                  <p className="text-xs text-muted-foreground">Show your profile in search results.</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
