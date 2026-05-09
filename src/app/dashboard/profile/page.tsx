"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Camera, X, Plus, Save } from "lucide-react"

export default function ProfileManagement() {
  const [skills, setSkills] = useState(["React", "Next.js", "TypeScript", "Tailwind CSS"])
  const [newSkill, setNewSkill] = useState("")

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
                    <AvatarImage src="https://picsum.photos/seed/alex/128/128" />
                    <AvatarFallback>AL</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" defaultValue="Alex Linderman" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Professional Title</Label>
                      <Input id="title" defaultValue="Senior Full Stack Engineer" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      rows={5} 
                      defaultValue="Passionate developer with 8+ years of experience building scalable web applications. Expert in React and Node.js ecosystems."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button className="ml-auto gap-2">
                <Save className="h-4 w-4" /> Save Changes
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
                  <span>85% Complete</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-green-500 font-medium">
                  <Plus className="h-3 w-3 rotate-45" /> Bio added
                </li>
                <li className="flex items-center gap-2 text-sm text-green-500 font-medium">
                  <Plus className="h-3 w-3 rotate-45" /> Skills listed
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Plus className="h-3 w-3" /> Add portfolio project
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

import { Progress } from "@/components/ui/progress"
