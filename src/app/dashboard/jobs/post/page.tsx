
"use client"

import { useState } from "react"
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, Briefcase } from "lucide-react"
import { useRouter } from "next/navigation"

const CATEGORIES = {
  "Digital": ["Programming", "Graphic Design", "Video Editing", "Writing", "Web Development", "Mobile Apps", "Data Science", "Digital Marketing"],
  "Artisan": ["Electrician", "Plumbing", "Mechanic", "Painting", "Carpentry", "Landscaping", "Auto Repair", "Home Repair"]
}

export default function PostJobPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    deadline: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db) return

    setIsLoading(true)
    const jobData = {
      ...formData,
      budget: parseFloat(formData.budget),
      clientId: user.uid,
      clientName: user.displayName || "Client",
      status: "open",
      createdAt: serverTimestamp(),
      skillsRequired: [] 
    }

    addDoc(collection(db, "jobs"), jobData)
      .then(() => {
        toast({
          title: "Project Published!",
          description: "Your job post is now live. Freelancers will be notified shortly."
        })
        router.push("/dashboard/jobs")
      })
      .catch(async (error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "jobs",
          operation: "create",
          requestResourceData: jobData
        }))
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Post a New Project</h1>
        <p className="text-muted-foreground text-lg">Detailed descriptions help you find the best matching talent.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-bold">Project Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Need a professional plumber for kitchen remodel" 
                    required 
                    className="h-12 rounded-xl"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-sm font-bold">Project Category</Label>
                  <Select 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Digital Skills</SelectLabel>
                        {CATEGORIES.Digital.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Artisan Skills</SelectLabel>
                        {CATEGORIES.Artisan.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-bold">Project Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the scope, goals, and any specific requirements..." 
                    rows={8}
                    required
                    className="rounded-xl resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-lg">Budget & Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="budget" className="text-white/80">Estimated Budget (USD)</Label>
                  <Input 
                    id="budget" 
                    type="number" 
                    placeholder="500" 
                    required 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 rounded-xl"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline" className="text-white/80">Expected Deadline</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    required 
                    className="bg-white/10 border-white/20 text-white h-12 rounded-xl"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-white text-primary hover:bg-white/90 rounded-xl font-bold text-lg gap-2">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Post Project
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted rounded-xl">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Quality Checklist</h4>
                    <ul className="mt-2 space-y-2 text-xs text-muted-foreground list-disc pl-4">
                      <li>Be clear about deliverables</li>
                      <li>Specify required tools or tools</li>
                      <li>Be realistic with the budget</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
