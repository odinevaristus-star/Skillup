
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
import { Switch } from "@/components/ui/switch"
import { Camera, X, Plus, Save, Loader2, Landmark } from "lucide-react"
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
  const [department, setDepartment] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || profile.full_name || "")
      setTitle(profile.title || "")
      setBio(profile.bio || "")
      setDepartment(profile.department || "")
      setPriceRange(profile.priceRange || "")
      setIsAvailable(profile.isAvailable !== undefined ? profile.isAvailable : true)
      setSkills(profile.skills || [])
    }
  }, [profile])

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSkill = newSkill.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill])
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
      department,
      priceRange,
      isAvailable,
      skills,
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, "users", user.uid), data, { merge: true })
      .then(() => {
        toast({
          title: "Profile updated",
          description: "Your professional details have been saved successfully."
        })
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 300);
      })
      .catch(async (serverError) => {
        setIsSaving(false)
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${user.uid}`,
          operation: 'write',
          requestResourceData: data,
        }));
        toast({
          variant: "destructive",
          title: "Error saving profile",
          description: "Please check your connectivity and try again."
        })
      });
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Professional Profile</h1>
          <p className="text-muted-foreground text-lg font-medium mt-1">Enhance your visibility and attract top-tier clients.</p>
        </div>
        <div className="flex items-center gap-4 bg-card px-6 py-3 rounded-2xl border shadow-sm">
          <Label htmlFor="availability" className="font-bold text-sm">Active & Available</Label>
          <Switch 
            id="availability" 
            checked={isAvailable} 
            onCheckedChange={setIsAvailable} 
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Personal & Academic Info</CardTitle>
              <CardDescription>How you'll appear to potential clients.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="relative group shrink-0">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-muted shadow-2xl rounded-3xl overflow-hidden">
                    <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/256/256`} />
                    <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                      {fullName?.substring(0, 2).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-xl hover:scale-110 transition-transform">
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 space-y-6 w-full">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="fullName" className="font-bold">Full Name</Label>
                      <Input 
                        id="fullName" 
                        className="h-12 rounded-xl"
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="title" className="font-bold">Professional Headline</Label>
                      <Input 
                        id="title" 
                        className="h-12 rounded-xl"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Lead Brand Designer"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="department" className="font-bold">Department / Course of Study</Label>
                      <div className="relative">
                        <Input 
                          id="department" 
                          className="h-12 rounded-xl"
                          value={department} 
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="priceRange" className="font-bold text-primary flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Price Range (NGN)
                      </Label>
                      <Input 
                        id="priceRange" 
                        className="h-12 rounded-xl font-bold"
                        value={priceRange} 
                        onChange={(e) => setPriceRange(e.target.value)}
                        placeholder="e.g. NGN 500 - NGN 5,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="bio" className="font-bold">Professional Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={6} 
                  className="rounded-2xl resize-none p-4"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detail your experience, tools, and what makes your service unique..."
                />
              </div>
            </CardContent>
            <CardFooter className="p-8 border-t bg-muted/20">
              <Button className="ml-auto h-12 px-10 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Professional Profile
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Skills & Specialized Tools</CardTitle>
              <CardDescription>Add the tags you want to be discovered for.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 group transition-all hover:bg-destructive/10 hover:text-destructive">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="opacity-40 group-hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
                {skills.length === 0 && <p className="text-sm text-muted-foreground italic font-medium">No skills showcased yet.</p>}
              </div>
              <form onSubmit={addSkill} className="flex gap-4">
                <Input 
                  placeholder="Press Enter to add e.g. React, Carpentry, Python..." 
                  className="h-12 rounded-xl flex-1"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                />
                <Button type="submit" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-muted-foreground/20">
                  <Plus className="h-6 w-6" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
