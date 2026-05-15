
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, addDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  Clock, 
  Loader2, 
  ArrowUpRight,
  PlusCircle,
  FileText,
  UserCheck,
  CheckCircle2,
  Trash2,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { cn } from "@/lib/utils"

export default function MyJobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // Profile to determine role-specific defaults
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])
  const { data: profile } = useDoc(profileRef)

  // Fetch jobs for this user (as client)
  const userJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "jobs"),
      where("clientId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: postedJobs, loading: postedLoading } = useCollection(userJobsQuery)

  // Fetch applications if user is a freelancer
  const freelancerAppsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "applications"),
      where("freelancerId", "==", user.uid),
      orderBy("createdAt", "desc")
    )
  }, [db, user?.uid])

  const { data: applications, loading: appsLoading } = useCollection(freelancerAppsQuery)

  const handleUpdateJobStatus = async (job: any, status: string) => {
    if (!db || !user) return
    const jobRef = doc(db, "jobs", job.id)
    
    updateDoc(jobRef, { 
      status,
      updatedAt: serverTimestamp()
    })
    .then(() => {
      if (status === 'completed' && job.freelancerId) {
        addDoc(collection(db, "notifications"), {
          userId: job.freelancerId,
          title: "Milestone Completed!",
          message: `${user.displayName || 'The client'} has marked "${job.title}" as completed.`,
          link: `/dashboard/jobs`,
          type: "status",
          read: false,
          createdAt: serverTimestamp()
        })
      }
      toast({ title: "Project Status Updated", description: `The status is now set to ${status}.` })
    })
    .catch(async (error) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `jobs/${job.id}`,
        operation: "update",
        requestResourceData: { status }
      }))
    })
  }

  const isFreelancer = profile?.role === 'freelancer'

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Project Management</h1>
          <p className="text-muted-foreground text-lg mt-1 font-medium">Track your active contracts, postings, and proposals.</p>
        </div>
        {!isFreelancer && (
          <Link href="/dashboard/jobs/post">
            <Button className="font-bold rounded-2xl h-12 px-8 gap-2 shadow-xl shadow-primary/20">
              <PlusCircle className="h-5 w-5" /> Post New Project
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue={isFreelancer ? "applications" : "postings"} className="w-full">
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto">
            <TabsTrigger value="postings" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:shadow-lg">Client Postings</TabsTrigger>
            <TabsTrigger value="applications" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:shadow-lg">Freelancer Proposals</TabsTrigger>
            <TabsTrigger value="contracts" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:shadow-lg">Active Contracts</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="postings" className="space-y-6 animate-in fade-in duration-500">
          {postedLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
          ) : postedJobs?.length ? (
            <div className="grid gap-6">
              {postedJobs.map((job: any) => (
                <JobManagementCard key={job.id} job={job} onUpdateStatus={handleUpdateJobStatus} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={Briefcase} 
              title="No active postings" 
              description="Ready to hire talent? Start by describing your project and publishing a job post." 
              actionUrl="/dashboard/jobs/post" 
              actionText="Create New Post" 
            />
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6 animate-in fade-in duration-500">
          {appsLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
          ) : applications?.length ? (
            <div className="grid gap-6">
              {applications.map((app: any) => (
                <ApplicationTrackCard key={app.id} application={app} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FileText} 
              title="No active proposals" 
              description="Start earning by finding the right project for your unique skills." 
              actionUrl="/jobs" 
              actionText="Browse Open Jobs" 
            />
          )}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6 animate-in fade-in duration-500">
          <div className="text-center py-32 bg-card rounded-[2.5rem] border-2 border-dashed border-muted shadow-inner">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCheck className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-2xl font-bold">Manage Contracts</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Active agreements will appear here once a hiring decision is finalized.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobManagementCard({ job, onUpdateStatus }: { job: any, onUpdateStatus: (job: any, s: string) => void }) {
  const statusConfig: any = {
    'open': { color: 'bg-green-500/10 text-green-700 border-green-200', label: 'Finding Talent' },
    'in-progress': { color: 'bg-blue-500/10 text-blue-700 border-blue-200', label: 'Active Work' },
    'completed': { color: 'bg-slate-500/10 text-slate-700 border-slate-200', label: 'Archived' },
    'cancelled': { color: 'bg-red-500/10 text-red-700 border-red-200', label: 'Cancelled' }
  }

  const current = statusConfig[job.status] || { color: 'bg-muted', label: job.status }

  return (
    <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all rounded-3xl bg-card">
      <CardContent className="p-0">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={cn("capitalize px-4 py-1 border-none font-bold text-[10px] tracking-widest", current.color)}>
                  {current.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5" /> Published {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed max-w-2xl">{job.description}</p>
              </div>
            </div>
            <div className="md:text-right shrink-0">
              <p className="text-3xl font-bold text-primary">${job.budget}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Fixed Budget</p>
            </div>
          </div>
        </div>
        <div className="px-8 py-5 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="ghost" size="sm" className="font-bold text-primary gap-2 hover:bg-primary/5 rounded-xl">
                View Listing <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-3">
            {job.status === 'in-progress' && (
              <Button variant="outline" size="sm" className="font-bold border-muted-foreground/20 rounded-xl px-6" onClick={() => onUpdateStatus(job, 'completed')}>
                Finish Project
              </Button>
            )}
            {job.status === 'open' && (
              <Link href={`/dashboard/jobs/manage/${job.id}`}>
                <Button size="sm" className="font-bold rounded-xl px-8 h-10 shadow-lg shadow-primary/10">Manage Proposals</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationTrackCard({ application }: { application: any }) {
  const statusColors: any = {
    'pending': 'bg-yellow-500/10 text-yellow-700',
    'accepted': 'bg-green-500/10 text-green-700',
    'rejected': 'bg-red-500/10 text-red-700'
  }

  return (
    <Card className="border-none shadow-sm group hover:shadow-md transition-all rounded-3xl bg-card">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <Badge className={cn("border-none text-[10px] font-bold px-3 py-1 capitalize", statusColors[application.status])}>
                {application.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Applied {application.createdAt ? new Date(application.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight">Proposal for: {application.jobTitle}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-1 italic italic">"{application.coverLetter}"</p>
            </div>
          </div>
          <div className="flex items-center gap-10 shrink-0">
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${application.bidAmount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Your Bid</p>
            </div>
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="outline" size="icon" className="rounded-2xl h-14 w-14 border-muted hover:bg-primary/5 hover:text-primary transition-all">
                <ArrowUpRight className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, title, description, actionUrl, actionText }: any) {
  return (
    <div className="text-center py-40 bg-card rounded-[3rem] border-2 border-dashed border-muted shadow-inner">
      <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8">
        <Icon className="h-10 w-10 text-muted-foreground opacity-20" />
      </div>
      <h3 className="text-3xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-lg">{description}</p>
      <Link href={actionUrl}>
        <Button className="mt-10 rounded-2xl px-12 h-14 font-bold text-lg shadow-2xl shadow-primary/20">
          {actionText}
        </Button>
      </Link>
    </div>
  )
}
