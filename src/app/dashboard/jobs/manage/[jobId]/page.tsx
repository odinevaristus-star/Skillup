
"use client"

import { useParams, useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, updateDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, ArrowLeft, User, CheckCircle2, MessageSquare, DollarSign, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function ManageJobApplicantsPage() {
  const { jobId } = useParams()
  const router = useRouter()
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

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
    if (!db || !jobId) return

    const jobUpdate = {
      status: 'in-progress',
      freelancerId: app.freelancerId,
      freelancerName: app.freelancerName,
      hiredAt: serverTimestamp()
    }

    const appUpdate = {
      status: 'accepted'
    }

    // Non-blocking update
    updateDoc(doc(db, "jobs", jobId as string), jobUpdate)
      .then(() => {
        updateDoc(doc(db, "applications", app.id), appUpdate)
        toast({ title: "Freelancer Hired!", description: `${app.freelancerName} has been assigned to the project.` })
        router.push("/dashboard/jobs")
      })
      .catch(async (error) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: `jobs/${jobId}`,
          operation: "update",
          requestResourceData: jobUpdate
        }))
      })
  }

  if (jobLoading || appsLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Applicants</h1>
          <p className="text-muted-foreground">Manage proposals for "{job?.title}"</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {applicants?.length ? applicants.map((app: any) => (
            <Card key={app.id} className="border-none shadow-sm group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                      <AvatarImage src={`https://picsum.photos/seed/${app.freelancerId}/128/128`} />
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{app.freelancerName}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 text-green-600 font-bold">
                            <CheckCircle2 className="h-4 w-4" /> 98% Job Success
                          </span>
                          <span>•</span>
                          <span>Top Rated</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${app.bidAmount}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Bid Amount</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {app.coverLetter}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button variant="ghost" className="font-bold text-primary hover:bg-primary/5" onClick={() => router.push(`/dashboard/messages?userId=${app.freelancerId}`)}>
                        <MessageSquare className="h-4 w-4 mr-2" /> Message
                      </Button>
                      <Button className="font-bold px-8 rounded-xl shadow-lg shadow-primary/20" onClick={() => handleHire(app)} disabled={job?.status !== 'open'}>
                        {job?.status === 'open' ? 'Hire Freelancer' : 'Hired'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-32 bg-card rounded-[2rem] border-2 border-dashed">
              <Loader2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <h3 className="text-xl font-bold">Waiting for applicants...</h3>
              <p className="text-muted-foreground mt-2">Your job post is live. Applicants will appear here soon.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-70 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Budget</span>
                  <span className="font-bold">${job?.budget}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-70 flex items-center gap-2"><Calendar className="h-4 w-4" /> Deadline</span>
                  <span className="font-bold">{job?.deadline || 'Flexible'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-70 flex items-center gap-2"><User className="h-4 w-4" /> Status</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none capitalize">{job?.status}</Badge>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs italic opacity-70 leading-relaxed">
                  "Hiring a freelancer will move this project to In Progress and stop new applications."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
