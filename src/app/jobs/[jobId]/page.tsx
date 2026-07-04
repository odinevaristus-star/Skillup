"use client"

import { useState, useEffect, useMemo } from "react"
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
  MapPin, 
  Briefcase, 
  Clock, 
  User, 
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Landmark,
  ShieldCheck,
  Zap
} from "lucide-react"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, collection, addDoc, serverTimestamp, query, where } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

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

  const currentUserRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: currentUserProfile } = useDoc(currentUserRef)

  const existingAppsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !jobId) return null
    return query(
      collection(db, "applications"),
      where("jobId", "==", jobId),
      where("freelancerId", "==", user.uid)
    )
  }, [db, user?.uid, jobId])

  const { data: existingApps, loading: appsLoading } = useCollection(existingAppsQuery)
  const hasApplied = existingApps && existingApps.length > 0

  useEffect(() => {
    if (job && !bidAmount) {
      setBidAmount(job.budget && job.budget > 0 ? job.budget.toString() : "")
    }
  }, [job])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !jobId || !job) return

    setIsApplying(true)
    const finalBid = parseFloat(bidAmount) || job.budget || 0
    
    const applicationData = {
      jobId,
      jobTitle: job.title,
      freelancerId: user.uid,
      freelancerName: currentUserProfile?.fullName || user.displayName || "Freelancer",
      coverLetter: coverLetter.trim() || "Applied via Quick Apply",
      bidAmount: finalBid,
      status: "pending",
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, "applications"), applicationData)
      .then(() => {
        addDoc(collection(db, "notifications"), {
          userId: job.clientId,
          title: "New Job Application",
          message: `${currentUserProfile?.fullName || user.displayName || 'A freelancer'} applied for your job: ${job.title}`,
          link: `/dashboard/jobs/manage/${jobId}`,
          type: "job",
          read: false,
          createdAt: serverTimestamp()
        })

        toast({
          title: "Application Sent!",
          description: "Your proposal has been submitted successfully."
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

  if (loading || appsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl rounded-[3rem]">
          <Briefcase className="h-16 w-16 text-muted-foreground opacity-10 mx-auto mb-8" />
          <h2 className="text-3xl font-bold mb-4">Job not found</h2>
          <Button onClick={() => router.push("/jobs")} className="w-full h-14 rounded-2xl font-bold text-lg">Back to Job Board</Button>
        </Card>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch(job.status) {
      case 'open':
        return <Badge className="bg-green-500/10 text-green-600 border-none px-3 py-1 rounded-full uppercase text-[10px] font-black">Active Listing</Badge>
      case 'hired':
      case 'in-progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-none px-3 py-1 rounded-full uppercase text-[10px] font-black">Work in Progress</Badge>
      case 'completed':
        return <Badge className="bg-slate-500/10 text-slate-600 border-none px-3 py-1 rounded-full uppercase text-[10px] font-black">Project Completed</Badge>
      default:
        return <Badge variant="outline" className="px-3 py-1 rounded-full uppercase text-[10px] font-black">Closed</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-16 flex-1 max-w-6xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 md:mb-10 gap-2 text-primary font-bold rounded-xl hover:bg-primary/5 h-10 md:h-12">
          <ChevronLeft className="h-5 w-5" /> Back to Search
        </Button>

        <div className="grid lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-8 md:space-y-12">
            <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] bg-card">
              <CardHeader className="p-6 md:p-10 border-b">
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  <Badge className="bg-primary/5 text-primary border-none text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 rounded-full">
                    {job.category}
                  </Badge>
                  {getStatusBadge()}
                </div>
                <CardTitle className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">{job.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {job.createdAt ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true }) : 'Recent'}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {job.location || 'Remote'}</span>
                  <span className="flex items-center gap-1.5 text-primary">
                    <Landmark className="h-3.5 w-3.5" /> 
                    {job.budget && job.budget > 0 ? `NGN ${job.budget.toLocaleString()}` : "Negotiable"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-8 md:space-y-10">
                <div>
                  <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs md:text-sm font-bold">01</span>
                    Description
                  </h3>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line font-medium">{job.description}</p>
                </div>
                
                <div className="pt-8 md:pt-10 border-t">
                  <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3">
                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs md:text-sm font-bold">02</span>
                    Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {job.skillsRequired?.length ? job.skillsRequired.map((s: string) => (
                      <Badge key={s} variant="secondary" className="px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-bold rounded-xl">{s}</Badge>
                    )) : (
                      <span className="text-sm md:text-base text-muted-foreground font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" /> Open to all qualified professionals
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-8">
            <Card className="border-none shadow-2xl bg-primary text-primary-foreground rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden sticky top-28">
              <CardHeader className="p-6 md:p-10 pb-4">
                <CardTitle className="text-xl md:text-2xl font-black">
                  {hasApplied ? "Applied ✓" : "Join Project"}
                </CardTitle>
                <CardDescription className="text-primary-foreground/70 font-medium text-sm md:text-base">
                  {hasApplied 
                    ? "Your proposal is being reviewed by the client." 
                    : "Submit your professional proposal to begin this collaboration."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-4 md:pt-6">
                {!showApplyForm ? (
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90 h-14 md:h-16 text-lg md:text-xl font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setShowApplyForm(true)}
                    disabled={hasApplied || job.status !== 'open'}
                  >
                    {hasApplied ? "Application Submitted" : (job.status === 'open' ? "Quick Apply" : "Project Closed")}
                  </Button>
                ) : (
                  <form onSubmit={handleApply} className="space-y-4 md:space-y-6">
                    <div className="grid gap-2">
                      <Label htmlFor="bid" className="text-white font-bold text-[10px] md:text-sm uppercase tracking-widest">Your Bid (NGN)</Label>
                      <Input 
                        id="bid" 
                        type="number" 
                        placeholder={job.budget && job.budget > 0 ? job.budget.toString() : "Enter your bid"} 
                        className="bg-primary-foreground/10 border-white/20 text-white placeholder:text-white/40 h-12 md:h-14 rounded-xl px-4 md:px-6 font-bold text-base md:text-lg"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="letter" className="text-white font-bold text-[10px] md:text-sm uppercase tracking-widest">Cover Letter (Optional)</Label>
                      <Textarea 
                        id="letter" 
                        placeholder="Detail your relevant experience (optional)..." 
                        className="bg-primary-foreground/10 border-white/20 text-white placeholder:text-white/40 rounded-xl p-4 md:p-6 resize-none text-sm md:text-base"
                        rows={5}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:gap-3">
                      <Button 
                        type="submit" 
                        className="w-full bg-white text-primary hover:bg-white/90 h-12 md:h-14 text-base md:text-lg font-black rounded-2xl shadow-xl"
                        disabled={isApplying}
                      >
                        {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Proposal"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full text-white hover:bg-white/10 h-10 md:h-12 font-bold text-xs md:text-sm"
                        onClick={() => setShowApplyForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[1.5rem] md:rounded-[2.5rem] bg-card overflow-hidden">
              <CardHeader className="p-6 md:p-10 pb-4">
                <CardTitle className="text-lg md:text-xl font-black">About Client</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-2 md:pt-4 space-y-6 md:space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-muted flex items-center justify-center border-2 border-background shadow-sm shrink-0">
                    <User className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground/40" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-base md:text-lg truncate">{job.clientName}</p>
                    <p className="text-[9px] md:text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5" /> Verified Account
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
