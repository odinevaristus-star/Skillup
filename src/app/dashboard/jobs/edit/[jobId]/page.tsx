'use client';

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Briefcase, Landmark, ArrowLeft } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function EditJobPage() {
  const { jobId } = useParams()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null
    return doc(db, "jobs", jobId as string)
  }, [db, jobId])

  const { data: job, loading: jobLoading } = useDoc(jobRef)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    deadline: "",
    location: "Remote"
  })

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        budget: job.budget?.toString() || "",
        category: job.category || "",
        deadline: job.deadline || "",
        location: job.location || "Remote"
      })
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !jobId) return

    setIsSaving(true)
    
    const budgetValue = formData.budget ? parseFloat(formData.budget) : 0;
    
    const updateData = {
      ...formData,
      budget: budgetValue,
      updatedAt: serverTimestamp(),
      skillsRequired: [formData.category] 
    }

    updateDoc(doc(db, "jobs", jobId as string), updateData)
      .then(() => {
        toast({ title: "Project Updated", description: "Your changes have been saved successfully." })
        router.push("/dashboard/jobs");
      })
      .catch(async (error) => {
        setIsSaving(false)
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: `jobs/${jobId}`,
          operation: "update",
          requestResourceData: updateData
        }))
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "We couldn't save your changes. Please try again."
        })
      })
  }

  if (jobLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" onClick={() => router.back()} className="p-0 hover:bg-transparent text-primary font-bold gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Jobs
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground text-sm md:text-lg">Update your listing details to attract the right talent.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
              <CardContent className="pt-8 space-y-6 p-4 md:p-8">
                <div className="grid gap-2.5">
                  <Label htmlFor="title" className="text-sm font-bold">Project Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Need a professional plumber" 
                    required 
                    className="h-12 md:h-14 rounded-2xl bg-muted/30 border-none px-6"
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
                    className="h-12 md:h-14"
                  />
                </div>

                <div className="grid gap-2.5">
                  <Label className="text-sm font-bold">Location Type</Label>
                  <RadioGroup 
                    value={formData.location} 
                    className="flex gap-4"
                    onValueChange={(val) => setFormData({...formData, location: val})}
                  >
                    <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl cursor-pointer">
                      <RadioGroupItem value="Remote" id="edit-remote" />
                      <Label htmlFor="edit-remote" className="cursor-pointer">Remote</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-muted/30 px-4 py-3 rounded-xl cursor-pointer">
                      <RadioGroupItem value="On-campus" id="edit-oncampus" />
                      <Label htmlFor="edit-oncampus" className="cursor-pointer">On-campus</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-2.5">
                  <Label htmlFor="description" className="text-sm font-bold">Project Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the scope..." 
                    rows={8}
                    required
                    className="rounded-2xl bg-muted/30 border-none p-4 md:p-6 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl rounded-3xl bg-primary text-primary-foreground overflow-hidden">
              <CardHeader className="p-6 md:p-8 pb-4">
                <CardTitle className="text-xl flex items-center gap-2"><Landmark className="h-5 w-5" /> Budget & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                <div className="grid gap-2.5">
                  <Label htmlFor="budget" className="text-white/80 font-bold">Estimated Budget (NGN)</Label>
                  <Input 
                    id="budget" 
                    type="number" 
                    placeholder="Negotiable" 
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12 md:h-14 rounded-2xl px-6 font-bold text-lg"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="deadline" className="text-white/80 font-bold">Expected Deadline</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    className="bg-white/10 border-white/20 text-white h-12 md:h-14 rounded-2xl px-6"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 md:p-8 pt-2">
                <Button type="submit" disabled={isSaving} className="w-full h-12 md:h-14 bg-white text-primary hover:bg-white/90 rounded-2xl font-bold text-lg gap-2 shadow-xl">
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
