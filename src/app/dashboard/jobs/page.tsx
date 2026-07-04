"use client"

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, addDoc, query, where, or } from "firebase/firestore"
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
  User,
  CheckCircle2,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"

export default function MyJobsPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, loading: profileLoading } = useDoc(userDocRef);
  const activeRole = profile?.activeRole || profile?.role || 'client';

  // Reactive listeners for jobs and applications
  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, 'jobs'),
      or(where('clientId', '==', user.uid), where('freelancerId', '==', user.uid))
    )
  }, [db, user?.uid])

  const { data: allJobs, loading: jobsLoading } = useCollection(jobsQuery)

  const appsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, 'applications'),
      or(where('freelancerId', '==', user.uid), where('clientId', '==', user.uid))
    )
  }, [db, user?.uid])

  const { data: allApps, loading: appsLoading } = useCollection(appsQuery)

  const [activeTab, setActiveTab] = useState(tabFromUrl || (activeRole === 'freelancer' ? 'applications' : 'postings'))

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Postings: Only show "Open" jobs for clients
  const postedJobs = useMemo(() => {
    if (!allJobs || !user?.uid) return []
    return allJobs
      .filter((j: any) => j.clientId === user.uid && j.status === 'open')
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [allJobs, user?.uid])

  // Applications: Show all applications sent by the freelancer
  const applications = useMemo(() => {
    if (!allApps || !user?.uid) return []
    return allApps
      .filter((a: any) => a.freelancerId === user.uid)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [allApps, user?.uid])

  // Active Work: Everything currently contracted or finished (Hired, In-Progress, Completed)
  const activeWork = useMemo(() => {
    if (!allJobs || !user?.uid) return []
    return allJobs
      .filter((j: any) => 
        (j.clientId === user.uid || j.freelancerId === user.uid) && 
        ['hired', 'in-progress', 'completed'].includes(j.status)
      )
      .sort((a: any, b: any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  }, [allJobs, user?.uid])

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

  const isFreelancer = activeRole === 'freelancer'
  const isClient = activeRole === 'client'
  
  // Ensure we don't show EmptyState while still resolving user or querying Firestore
  const pageLoading = authLoading || profileLoading || jobsLoading || appsLoading || !user?.uid

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground">My Projects</h1>
          <p className="text-muted-foreground text-sm font-medium">
            {isClient ? "Manage postings and contracts." : "Track proposals and active work."}
          </p>
        </div>
        {isClient && (
          <Link href="/dashboard/jobs/post">
            <Button size="sm" className="font-bold text-xs uppercase tracking-widest rounded-xl h-10 px-6 gap-2 shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]">
              <PlusCircle className="h-4 w-4" /> Post New
            </Button>
          </Link>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-1">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-auto">
            {isClient && (
              <TabsTrigger value="postings" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-md transition-all">My Postings</TabsTrigger>
            )}
            {isFreelancer && (
              <TabsTrigger value="applications" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-md transition-all">My Proposals</TabsTrigger>
            )}
            <TabsTrigger value="contracts" className="rounded-lg px-4 py-2 font-bold text-[10px] uppercase tracking-widest data-[state=active]:shadow-md transition-all">
              Active Work
              {activeWork.length > 0 && <span className="ml-2 bg-primary/20 text-primary px-1.5 py-0.5 rounded-md text-[8px]">{activeWork.length}</span>}
            </TabsTrigger>
          </TabsList>
        </div>

        {isClient && (
          <TabsContent value="postings" className="space-y-4">
            {pageLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-10" /></div>
            ) : postedJobs?.length ? (
              <div className="grid gap-4">
                {postedJobs.map((job: any) => (
                  <JobManagementCard key={job.id} job={job} onUpdateStatus={handleUpdateJobStatus} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Briefcase} 
                title="No active postings" 
                description="Ready to hire? Start by creating a job post." 
                actionUrl="/dashboard/jobs/post" 
                actionText="Create Post" 
              />
            )}
          </TabsContent>
        )}

        {isFreelancer && (
          <TabsContent value="applications" className="space-y-4">
            {pageLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-10" /></div>
            ) : applications?.length ? (
              <div className="grid gap-4">
                {applications.map((app: any) => (
                  <ApplicationTrackCard key={app.id} application={app} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={FileText} 
                title="No active proposals" 
                description="Find the right project for your skills." 
                actionUrl="/jobs" 
                actionText="Browse Jobs" 
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="contracts" className="space-y-4">
          {pageLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-10" /></div>
          ) : activeWork?.length ? (
            <div className="grid gap-4">
              {activeWork.map((job: any) => (
                <ActiveContractCard key={job.id} job={job} onUpdateStatus={handleUpdateJobStatus} currentUserId={user?.uid} router={router} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={UserCheck} 
              title="No active work" 
              description="Hired projects and ongoing contracts will appear here after hiring." 
              actionUrl={activeRole === 'client' ? "/freelancers" : "/jobs"} 
              actionText={activeRole === 'client' ? "Hire Talent" : "Find Work"} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ActiveContractCard({ job, onUpdateStatus, currentUserId, router }: { job: any, onUpdateStatus: (j: any, s: string) => void, currentUserId?: string, router: any }) {
  const isClient = job.clientId === currentUserId
  const partnerName = isClient ? job.freelancerName : (job.clientName || 'The Client')
  const partnerId = isClient ? job.freelancerId : job.clientId

  const isCompleted = job.status === 'completed'

  return (
    <Card className={cn(
      "border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 rounded-2xl bg-card border border-muted/50",
      isCompleted && "opacity-70"
    )}>
      <CardContent className="p-0">
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "px-2 py-0.5 border-none font-bold text-[9px] uppercase tracking-widest rounded-full",
                  isCompleted ? "bg-slate-500/10 text-slate-700" : "bg-blue-500/10 text-blue-700"
                )}>
                  {isCompleted ? 'Finished' : (job.status === 'hired' ? 'Awaiting Start' : 'In Progress')}
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Updated {job.updatedAt ? new Date(job.updatedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold group-hover:text-primary transition-colors tracking-tight leading-snug">{job.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground">
                    {isClient ? "Hired: " : "Client: "} <span className="text-foreground font-bold">{partnerName}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
                onClick={() => router.push(`/dashboard/messages?userId=${partnerId}`)}
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </Button>
              {isClient && !isCompleted && (
                <Button 
                  size="sm" 
                  className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2 bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => onUpdateStatus(job, 'completed')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 md:px-6 py-3 bg-muted/20 border-t flex items-center justify-between">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="ghost" className="font-bold text-[9px] uppercase tracking-widest text-primary gap-1.5 hover:bg-primary/5 h-8 px-2 rounded-lg">
              Project Details <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-sm font-black text-primary">
              {job.budget && job.budget > 0 ? `NGN ${job.budget.toLocaleString()}` : "Negotiable"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JobManagementCard({ job, onUpdateStatus }: { job: any, onUpdateStatus: (job: any, s: string) => void }) {
  const statusConfig: any = {
    'open': { color: 'bg-green-500/10 text-green-700', label: 'Open' },
    'hired': { color: 'bg-blue-500/10 text-blue-700', label: 'Hired' },
    'in-progress': { color: 'bg-blue-500/10 text-blue-700', label: 'In Progress' },
    'completed': { color: 'bg-slate-500/10 text-slate-700', label: 'Finished' },
    'cancelled': { color: 'bg-red-500/10 text-red-700', label: 'Cancelled' }
  }

  const current = statusConfig[job.status] || { color: 'bg-muted', label: job.status }

  return (
    <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 rounded-2xl bg-card border border-muted/50">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={cn("px-2 py-0.5 border-none font-bold text-[9px] uppercase tracking-widest rounded-full", current.color)}>
                  {current.label}
                </Badge>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors tracking-tight leading-snug">{job.title}</h3>
                <p className="text-muted-foreground text-xs font-medium line-clamp-1 leading-relaxed max-w-xl">{job.description}</p>
              </div>
            </div>
            <div className="md:text-right shrink-0">
              <p className="text-xl font-black text-primary flex items-center gap-1 md:justify-end">
                {job.budget && job.budget > 0 ? (
                  <>
                    <span className="text-xs font-bold opacity-50">NGN </span>{job.budget.toLocaleString()}
                  </>
                ) : (
                  "Negotiable"
                )}
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                Budget
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-4">
          <Link href={`/jobs/${job.id}`}>
            <Button variant="ghost" className="font-bold text-[10px] uppercase tracking-widest text-primary gap-2 hover:bg-primary/5 h-9 px-3 rounded-lg">
              Listing <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            {job.status === 'open' && (
              <Link href={`/dashboard/jobs/manage/${job.id}`}>
                <Button size="sm" className="font-bold text-[10px] uppercase tracking-widest rounded-lg px-4 h-9">Manage Applicants</Button>
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
    <Card className="border-none shadow-sm group hover:shadow-md transition-all duration-300 rounded-2xl bg-card border border-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Badge className={cn("border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", statusColors[application.status])}>
                {application.status}
              </Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Applied {application.createdAt ? new Date(application.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold leading-tight tracking-tight">{application.jobTitle}</h3>
              <p className="text-muted-foreground text-xs font-medium italic line-clamp-1">"{application.coverLetter}"</p>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-xl font-black text-primary flex items-center gap-1 md:justify-end">
                <span className="text-xs font-bold opacity-50">NGN </span>{application.bidAmount?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Bid</p>
            </div>
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 hover:border-primary hover:text-primary transition-all">
                <ArrowUpRight className="h-4 w-4" />
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
    <div className="text-center py-16 bg-card rounded-[2rem] border border-dashed shadow-sm px-6">
      <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon className="h-8 w-8 text-muted-foreground opacity-20" />
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-[280px] mx-auto text-xs font-medium mb-6">{description}</p>
      <Link href={actionUrl}>
        <Button size="sm" className="rounded-xl px-8 h-10 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10">
          {actionText}
        </Button>
      </Link>
    </div>
  )
}
