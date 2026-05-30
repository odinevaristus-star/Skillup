
"use client"

import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, updateDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ArrowLeft, User, MessageSquare, DollarSign, Calendar, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function ManageJobApplicantsPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isHiring, setIsHiring] = useState(false)

  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null
    return doc(db, "jobs", jobId as string)
  }, [db, jobId])

  const { data: job, loading: jobLoading } = useDoc(jobRef)

  const applicantsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null
    return query(
      collection(db, "applications"),
      where("jobId", "==", jobId)
    )
  }, [db, jobId])

  const { data: applicants, loading: appsLoading } = useCollection(applicantsQuery)

  const handleHire = async (app: any) => {
    if (!db || !jobId || !job) return

    setIsHiring(true)
    const jobUpdate = {
      status: 'in-progress',
      freelancerId: app.freelancerId,
      freelancerName: app.freelancerName,
      hiredAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    const appUpdate = {
      status: 'accepted'
    }

    // Update job to in-progress
    updateDoc(doc(db, "jobs", jobId as string), jobUpdate)
      .then(() => {
        // Update application to accepted
        updateDoc(doc(db, "applications", app.id), appUpdate)
        
        // Notify freelancer
        addDoc(collection(db, "notifications"), {
          userId: app.freelancerId,
          title: "Offer Accepted!",
          message: `Congratulations! ${job.clientName} hired you for: ${job.title}`,
          link: `/dashboard/jobs`,
          type: "hire",
          read: false,
          createdAt: serverTimestamp()
        })

        toast({ title: "Freelancer Hired!", description: `${app.freelancerName} is now assigned to this project.` })
        
        setTimeout(() => {
          window.location.replace("/dashboard/jobs");
        }, 500);
      })
      .catch(async (error) => {
        setIsHiring(false)
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: `jobs/${jobId}`,
          operation: "update",
          requestResourceData: jobUpdate
        }))
        toast({
          variant: "destructive",
          title: "Hiring failed",
          description: "Something went wrong. Please try again."
        })
      })
  }

  if (jobLoading || appsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold">Retrieving applicants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/5">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Review Applicants</h1>
            <p className="text-muted-foreground font-medium">Select the best professional for "{job?.title}"</p>
          </div>
        </div>
        <Badge variant={job?.status === 'open' ? 'secondary' : 'default'} className="capitalize h-8 px-4 text-sm font-bold">
          {job?.status.replace('-', ' ')}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Proposals <span className="bg-muted px-2 py-0.5 rounded text-xs">{applicants?.length || 0}</span>
          </h2>

          {applicants?.length ? applicants.map((app: any) => (
            <Card key={app.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-card">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-muted rounded-2xl shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${app.freelancerId}/128/128`} />
                      <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{app.freelancerName}</h3>
                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">Verified Freelancer</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-primary">₦{app.bidAmount?.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proposal Bid</p>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-muted/30 rounded-[1.5rem] border border-dashed border-muted">
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground italic">
                        "{app.coverLetter}"
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button 
                        variant="ghost" 
                        className="font-bold text-primary hover:bg-primary/5 h-12 px-6 rounded-xl" 
                        onClick={() => router.push(`/dashboard/messages?userId=${app.freelancerId}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Message & Interview
                      </Button>
                      <Button 
                        className="font-bold px-10 h-12 rounded-xl shadow-xl shadow-primary/20" 
                        onClick={() => handleHire(app)} 
                        disabled={job?.status !== 'open' || isHiring}
                      >
                        {isHiring ? <Loader2 className="h-4 w-4 animate-spin" /> : (job?.status === 'open' ? 'Accept & Hire' : 'Hired')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-40 bg-card rounded-[2.5rem] border-2 border-dashed border-muted shadow-inner">
              <Loader2 className="h-16 w-16 mx-auto mb-6 opacity-5 opacity-spin" />
              <h3 className="text-2xl font-bold">No applications yet</h3>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Your project is visible to our professional community. Proposals will appear here soon.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
            <CardHeader className="p-8">
              <CardTitle className="text-xl flex items-center gap-2"><Briefcase className="h-5 w-5" /> Project Specs</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="opacity-70 text-sm flex items-center gap-2 font-medium"><DollarSign className="h-4 w-4" /> Fixed Budget</span>
                  <span className="font-bold text-lg">₦{job?.budget ? job.budget.toLocaleString() : 'Negotiable'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-70 text-sm flex items-center gap-2 font-medium"><Calendar className="h-4 w-4" /> Due Date</span>
                  <span className="font-bold text-lg">{job?.deadline || 'Flexible'}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <div className="p-4 bg-white/10 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Selected Category</h4>
                  <p className="font-bold">{job?.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
