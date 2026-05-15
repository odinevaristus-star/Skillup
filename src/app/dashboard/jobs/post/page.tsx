
"use client"

import { useState } from "react"
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

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
      skillsRequired: [] // Could be expanded to a multi-select
    }

    addDoc(collection(db, "jobs"), jobData)
      .then(() => {
        toast({
          title: "Job Posted!",
          description: "Your project is now live and freelancers can apply."
        })
        router.push("/dashboard")
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "jobs",
          operation: "create",
          requestResourceData: jobData
        })
        errorEmitter.emit("permission-error", permissionError)
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Card className="border-none shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Post a new job</CardTitle>
          <CardDescription>Tell the community about your project and find the right talent.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Build a mobile app for my restaurant" 
                required 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                onValueChange={(val) => setFormData({...formData, category: val})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                  <SelectItem value="Electrician">Electrician</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea 
                id="description" 
                placeholder="Explain the scope, deliverables, and requirements..." 
                rows={6}
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  placeholder="500" 
                  required 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline">Project Deadline</Label>
                <Input 
                  id="deadline" 
                  type="date" 
                  required 
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Job
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
