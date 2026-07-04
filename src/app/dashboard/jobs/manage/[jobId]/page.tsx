"use client"

import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, updateDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ArrowLeft, User, MessageSquare, DollarSign, Calendar, Briefcase, Landmark } from "lucide-react"
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

    updateDoc(doc(db, "jobs", jobId as string), jobUpdate)
      .then(() => {
        updateDoc(doc(db, "applications", app.id), appUpdate)
        
        addDoc(collection(db, "notifications"), {
          userId: app.freelancerId,
          title: "Offer Accepted!",
          message: `Congratulations! ${job.clientName} hired you for: ${job.title}. Work is now in progress.`,
          link: `/dashboard/jobs?tab=contracts`,
          type: "hire",
          read: false,
          createdAt: serverTimestamp()
        })

        toast({ title: "Freelancer hired successfully!", description: `${app.freelancerName} is now assigned to this project.` })
        
        setTimeout(() => {
          router.push("/dashboard/jobs?tab=contracts");
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/5">
            <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">Review Applicants</h1>
            <p className="text-xs md:text-base text-muted-foreground font-medium truncate">Select talent for "{job?.title}"</p>
          </div>
        </div>
        <Badge variant={job?.status === 'open' ? 'secondary' : 'default'} className="capitalize h-7 md:h-8 px-3 md:px-4 text-[10px] md:text-sm font-bold w-fit">
          {job?.status.replace('-', ' ')}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8 overflow-hidden">
        <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            Proposals <span className="bg-muted px-2 py-0.5 rounded text-[10px] md:text-xs">{applicants?.length || 0}</span>
          </h2>

          {applicants?.length ? applicants.map((app: any) => (
            <Card key={app.id} className="w-full max-w-full border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-card rounded-2xl md:rounded-[2rem]">
              <CardContent className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                  <div className="shrink-0 flex justify-center md:justify-start">
                    <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 md:border-4 border-muted rounded-xl md:rounded-2xl shadow-sm">
                      <AvatarImage src={`https://picsum.photos/seed/${app.freelancerId}/128/128`} />
                      <AvatarFallback><User className="h-6 w-6 md:h-8 md:w-8" /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 md:gap-4">
                      <div className="text-center md:text-left min-w-0">
                        <h3 className="text-lg md:text-2xl font-bold group-hover:text-primary transition-colors truncate">{app.freelancerName}</h3>
                        <p className="text-[9px] md:text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">Verified Freelancer</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-xl md:text-3xl font-black text-primary">
                          {app.bidAmount ? `NGN ${app.bidAmount.toLocaleString()}` : "Negotiable"}
                        </p>
                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proposal Bid</p>
                      </div>
                    </div>
                    
                    <div className="p-4 md:p-6 bg-muted/30 rounded-xl md:rounded-[1.5rem] border border-dashed border-muted">
                      <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line text-muted-foreground italic break-words">
                        "{app.coverLetter}"
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-end gap-3 pt-2 md:pt-4">
                      <Button 
                        variant="ghost" 
                        className="w-full md:w-auto font-bold text-primary hover:bg-primary/5 h-10 md:h-12 px-6 rounded-xl text-xs md:text-sm" 
                        onClick={() => router.push(`/dashboard/messages?userId=${app.freelancerId}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" /> Message & Interview
                      </Button>
                      <Button 
                        className="w-full md:w-auto font-bold px-8 md:px-10 h-10 md:h-12 rounded-xl shadow-lg md:shadow-xl md:shadow-primary/20 text-xs md:text-sm" 
                        onClick={() => handleHire(app)} 
                        disabled={job?.status !== 'open' || isHiring}
                      >
                        {isHiring ? <Loader2 className="h-4 w-4 animate-spin" /> : (job?.status === 'open' ? 'Accept & Hire' : 'Closed')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-20 md:py-40 bg-card rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-muted shadow-inner px-4">
              <Loader2 className="h-10 w-10 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 opacity-5" />
              <h3 className="text-lg md:text-2xl font-bold">No applications yet</h3>
              <p className="text-xs md:text-base text-muted-foreground mt-2 max-w-xs mx-auto">Your project is visible. Proposals will appear here soon.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6 min-w-0">
          <Card className="w-full max-w-full border-none shadow-sm overflow-hidden rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
            <CardHeader className="p-6 md:p-8">
              <CardTitle className="text-base md:text-xl flex items-center gap-2"><Briefcase className="h-4 w-4 md:h-5 md:w-5" /> Project Specs</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0 space-y-4 md:space-y-6">
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="opacity-70 text-[10px] md:text-sm flex items-center gap-2 font-medium shrink-0"><Landmark className="h-3 w-3 md:h-4 md:w-4" /> Fixed Budget</span>
                  <span className="font-bold text-sm md:text-lg truncate">{job?.budget && job.budget > 0 ? `NGN ${job.budget.toLocaleString()}` : 'Negotiable'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="opacity-70 text-[10px] md:text-sm flex items-center gap-2 font-medium shrink-0"><Calendar className="h-3 w-3 md:h-4 md:w-4" /> Due Date</span>
                  <span className="font-bold text-sm md:text-lg truncate">{job?.deadline || 'Flexible'}</span>
                </div>
              </div>
              <div className="pt-4 md:pt-6 border-t border-white/10">
                <div className="p-3 md:p-4 bg-white/10 rounded-xl space-y-1 md:space-y-2">
                  <h4 className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-white/60">Selected Category</h4>
                  <p className="font-bold text-xs md:text-base truncate">{job?.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
