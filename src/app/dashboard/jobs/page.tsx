
"use client"

import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, addDoc, getDocs } from "firebase/firestore"
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
  MapPin
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { cn } from "@/lib/utils"

export default function MyJobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [allJobs, setAllJobs] = useState<any[]>([])
  const [allApps, setAllApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);
  const activeRole = profile?.activeRole || profile?.role || 'client';

  useEffect(() => {
    async function fetchData() {
      if (!db || !user?.uid) return
      setLoading(true)
      try {
        const jobsRef = collection(db, 'jobs')
        const appsRef = collection(db, 'applications')
        
        const [jobsSnap, appsSnap] = await Promise.all([
          getDocs(jobsRef),
          getDocs(appsRef)
        ])
        
        setAllJobs(jobsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setAllApps(appsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [db, user?.uid])

  const postedJobs = useMemo(() => {
    if (!allJobs || !user?.uid) return []
    return allJobs
      .filter((j: any) => j.clientId === user.uid)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [allJobs, user?.uid])

  const applications = useMemo(() => {
    if (!allApps || !user?.uid) return []
    return allApps
      .filter((a: any) => a.freelancerId === user.uid)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  }, [allApps, user?.uid])

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
      setAllJobs(prev => prev.map(j => j.id === job.id ? { ...j, status } : j))
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

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">My Projects</h1>
          <p className="text-muted-foreground text-lg font-medium">
            {isClient ? "Manage your job postings and active contracts." : "Track your submitted proposals and active work."}
          </p>
        </div>
        {isClient && (
          <Link href="/dashboard/jobs/post">
            <Button className="font-black text-sm uppercase tracking-widest rounded-2xl h-16 px-10 gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <PlusCircle className="h-6 w-6" /> Post New Gig
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue={isFreelancer ? "applications" : "postings"} className="w-full">
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
          <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto">
            {isClient && (
              <TabsTrigger value="postings" className="rounded-xl px-8 py-3.5 font-black text-xs uppercase tracking-widest data-[state=active]:shadow-xl transition-all">My Postings</TabsTrigger>
            )}
            {isFreelancer && (
              <TabsTrigger value="applications" className="rounded-xl px-8 py-3.5 font-black text-xs uppercase tracking-widest data-[state=active]:shadow-xl transition-all">My Proposals</TabsTrigger>
            )}
            <TabsTrigger value="contracts" className="rounded-xl px-8 py-3.5 font-black text-xs uppercase tracking-widest data-[state=active]:shadow-xl transition-all">Active Work</TabsTrigger>
          </TabsList>
        </div>

        {isClient && (
          <TabsContent value="postings" className="space-y-8">
            {loading ? (
              <div className="flex justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-10" /></div>
            ) : postedJobs?.length ? (
              <div className="grid gap-8">
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
        )}

        {isFreelancer && (
          <TabsContent value="applications" className="space-y-8">
            {loading ? (
              <div className="flex justify-center py-32"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-10" /></div>
            ) : applications?.length ? (
              <div className="grid gap-8">
                {applications.map((app: any) => (
                  <ApplicationTrackCard key={app.id} application={app} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={FileText} 
                title="No active proposals" 
                description="Start earning by finding the right project for your unique skills on campus." 
                actionUrl="/jobs" 
                actionText="Browse Job Board" 
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="contracts" className="space-y-8">
          <div className="text-center py-40 bg-card rounded-[3rem] border-2 border-dashed border-muted shadow-inner">
            <div className="w-24 h-24 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <UserCheck className="h-12 w-12 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-3xl font-black tracking-tight mb-4">Active Contracts</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium text-lg leading-relaxed">Agreed project milestones and active timers will appear here once hiring is finalized.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobManagementCard({ job, onUpdateStatus }: { job: any, onUpdateStatus: (job: any, s: string) => void }) {
  const statusConfig: any = {
    'open': { color: 'bg-green-500/10 text-green-700', label: 'Seeking Talent' },
    'in-progress': { color: 'bg-blue-500/10 text-blue-700', label: 'In Progress' },
    'completed': { color: 'bg-slate-500/10 text-slate-700', label: 'Finished' },
    'cancelled': { color: 'bg-red-500/10 text-red-700', label: 'Cancelled' }
  }

  const current = statusConfig[job.status] || { color: 'bg-muted', label: job.status }

  return (
    <Card className="border-none shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-card border border-muted/30">
      <CardContent className="p-0">
        <div className="p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4">
                <Badge className={cn("px-5 py-2 border-none font-black text-[10px] uppercase tracking-widest rounded-full", current.color)}>
                  {current.label}
                </Badge>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Posted {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {job.location || 'Remote'}
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black group-hover:text-primary transition-colors tracking-tighter leading-tight">{job.title}</h3>
                <p className="text-muted-foreground font-medium line-clamp-2 leading-relaxed max-w-2xl">{job.description}</p>
              </div>
            </div>
            <div className="md:text-right shrink-0">
              <p className="text-4xl font-black text-primary flex items-center gap-1 md:justify-end">
                {job.budget && job.budget > 0 ? (
                  <>
                    <span className="text-2xl font-bold opacity-50">₦</span>{job.budget.toLocaleString()}
                  </>
                ) : (
                  "Negotiable"
                )}
              </p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                {job.budget && job.budget > 0 ? "Project Budget" : "Budget: Negotiable"}
              </p>
            </div>
          </div>
        </div>
        <div className="px-10 py-8 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-4">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="ghost" className="font-black text-xs uppercase tracking-widest text-primary gap-3 hover:bg-primary/5 rounded-xl h-12">
                Review Listing <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-4">
            {job.status === 'in-progress' && (
              <Button variant="outline" className="font-black text-xs uppercase tracking-widest border-muted-foreground/20 rounded-xl px-8 h-12 hover:bg-primary/5" onClick={() => onUpdateStatus(job, 'completed')}>
                Complete Milestone
              </Button>
            )}
            {job.status === 'open' && (
              <Link href={`/dashboard/jobs/manage/${job.id}`}>
                <Button className="font-black text-xs uppercase tracking-widest rounded-xl px-10 h-12 shadow-xl shadow-primary/20">Manage Proposals</Button>
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
    <Card className="border-none shadow-sm group hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-card border border-muted/30">
      <CardContent className="p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-4">
              <Badge className={cn("border-none text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full", statusColors[application.status])}>
                {application.status}
              </Badge>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applied {application.createdAt ? new Date(application.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black leading-tight tracking-tight">Proposal for: {application.jobTitle}</h3>
              <p className="text-muted-foreground font-medium italic line-clamp-2 leading-relaxed">"{application.coverLetter}"</p>
            </div>
          </div>
          <div className="flex items-center gap-12 shrink-0">
            <div className="text-right">
              <p className="text-4xl font-black text-primary flex items-center gap-1 md:justify-end">
                <span className="text-2xl font-bold opacity-50">₦</span>{application.bidAmount?.toLocaleString() || '0'}
              </p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Your Proposed Bid</p>
            </div>
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="outline" size="icon" className="rounded-2xl h-16 w-16 border-muted-foreground/20 hover:border-primary hover:text-primary transition-all">
                <ArrowUpRight className="h-7 w-7" />
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
    <div className="text-center py-48 bg-card rounded-[4rem] border-2 border-dashed border-muted shadow-inner px-8">
      <div className="w-28 h-28 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 transition-transform hover:scale-105 duration-500">
        <Icon className="h-12 w-12 text-muted-foreground opacity-20" />
      </div>
      <h3 className="text-4xl font-black tracking-tight mb-4">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed text-lg font-medium mb-12">{description}</p>
      <Link href={actionUrl}>
        <Button className="rounded-2xl px-14 h-16 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.98]">
          {actionText}
        </Button>
      </Link>
    </div>
  )
}
