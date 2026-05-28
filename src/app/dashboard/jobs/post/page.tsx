
'use client';

import { useState } from "react"
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, Briefcase, Landmark } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function PostJobPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    deadline: "",
    location: "Remote"
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
      clientFirstName: user.displayName?.split(' ')[0] || "User",
      status: "open",
      createdAt: serverTimestamp(),
      skillsRequired: [formData.category] 
    }

    addDoc(collection(db, "jobs"), jobData)
      .then(() => {
        // Use window.location.replace with a delay for clean redirection
        setTimeout(() => {
          window.location.replace("/dashboard/jobs");
        }, 500);
      })
      .catch(async (error) => {
        setIsLoading(false)
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "jobs",
          operation: "create",
          requestResourceData: jobData
        }))
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: "We couldn't post your project. Please try again."
        })
      })
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8 space-y-2 text-center md:text-left">
        <h1 className="text-4xl font-bold tracking-tight">Post a New Project</h1>
        <p className="text-muted-foreground text-lg">Detailed descriptions help you find the best matching talent.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
              <CardContent className="pt-8 space-y-6">
                <div className="grid gap-2.5">
                  <Label htmlFor="title" className="text-sm font-bold">Project Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Need a professional plumber for kitchen remodel" 
                    required 
                    className="h-14 rounded-2xl bg-muted/30 border-none px-6"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2.5">
                  <Label htmlFor="category" className="text-sm font-bold">Project Category</Label>
                  <SearchableSelect 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                    placeholder="Select or type category..."
                  />
                </div>

                <div className="grid gap-2.5">
                  <Label className="text-sm font-bold">Location Type</Label>
                  <RadioGroup 
                    defaultValue="Remote" 
                    className="flex gap-4"
                    onValueChange={(val) => setFormData({...formData, location: val})}
                  >
                    <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                      <RadioGroupItem value="Remote" id="remote" />
                      <Label htmlFor="remote" className="cursor-pointer">Remote</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                      <RadioGroupItem value="On-campus" id="oncampus" />
                      <Label htmlFor="oncampus" className="cursor-pointer">On-campus</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2.5">
                  <Label htmlFor="description" className="text-sm font-bold">Project Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the scope, goals, and any specific requirements..." 
                    rows={8}
                    required
                    className="rounded-2xl bg-muted/30 border-none p-6 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl flex items-center gap-2"><Landmark className="h-5 w-5" /> Budget & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="grid gap-2.5">
                  <Label htmlFor="budget" className="text-white/80 font-bold">Estimated Budget (₦)</Label>
                  <Input 
                    id="budget" 
                    type="number" 
                    placeholder="5000" 
                    required 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-14 rounded-2xl px-6 font-bold text-lg"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="deadline" className="text-white/80 font-bold">Expected Deadline</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    required 
                    className="bg-white/10 border-white/20 text-white h-14 rounded-2xl px-6"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-2">
                <Button type="submit" disabled={isLoading} className="w-full h-14 bg-white text-primary hover:bg-white/90 rounded-2xl font-bold text-lg gap-2 shadow-xl">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Post Project
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-muted rounded-2xl shrink-0">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Quality Checklist</h4>
                    <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4 font-medium">
                      <li>Be clear about deliverables</li>
                      <li>Specify required tools or equipment</li>
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
