
"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Briefcase, 
  Clock, 
  User, 
  CheckCircle2,
  Loader2,
  ChevronLeft
} from "lucide-react"
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function JobDetailPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState("")
  const [bidAmount, setBidAmount] = useState("")

  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null
    return doc(db, "jobs", jobId as string)
  }, [db, jobId])

  const { data: job, loading } = useDoc(jobRef)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !jobId) return

    setIsApplying(true)
    const applicationData = {
      jobId,
      jobTitle: job?.title,
      freelancerId: user.uid,
      freelancerName: user.displayName || "Freelancer",
      coverLetter,
      bidAmount: parseFloat(bidAmount),
      status: "pending",
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "applications"), applicationData)
      .then(() => {
        toast({
          title: "Application Sent!",
          description: "Good luck! The client will review your proposal."
        })
        setShowApplyForm(false)
      })
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: "applications",
          operation: "create",
          requestResourceData: applicationData
        })
        errorEmitter.emit("permission-error", error)
      })
      .finally(() => setIsApplying(false))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Job not found</h2>
        <Button onClick={() => router.push("/jobs")} className="mt-4">Back to Search</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8 gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Search
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-card">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none">{job.category}</Badge>
                  <Badge variant="outline" className="border-primary/20 text-primary">Open</Badge>
                </div>
                <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-6 mt-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Posted {new Date().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Remote</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> ${job.budget} Fixed Budget</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">Job Description</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
                </div>
                
                <div className="pt-8 border-t">
                  <h3 className="text-lg font-bold mb-4">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skillsRequired?.length ? job.skillsRequired.map((s: string) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    )) : (
                      <span className="text-sm text-muted-foreground">Open to all qualified freelancers</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-xl">Apply Now</CardTitle>
                <CardDescription className="text-primary-foreground/70">
                  Submit your proposal to start working on this project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showApplyForm ? (
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90 h-12 text-lg font-bold"
                    onClick={() => setShowApplyForm(true)}
                  >
                    Send Proposal
                  </Button>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bid" className="text-white">Your Bid (USD)</Label>
                      <Input 
                        id="bid" 
                        type="number" 
                        placeholder={job.budget.toString()} 
                        className="bg-primary-foreground/10 border-white/20 text-white placeholder:text-white/40"
                        required
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="letter" className="text-white">Cover Letter</Label>
                      <Textarea 
                        id="letter" 
                        placeholder="Explain why you're a good fit..." 
                        className="bg-primary-foreground/10 border-white/20 text-white placeholder:text-white/40"
                        rows={5}
                        required
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="flex-1 text-white hover:bg-white/10"
                        onClick={() => setShowApplyForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-white text-primary hover:bg-white/90"
                        disabled={isApplying}
                      >
                        {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">About the Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">{job.clientName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" /> Verified Payment
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>Recent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>Global</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
