
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  MoreVertical,
  ArrowUpRight,
  PlusCircle,
  FileText,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function MyJobsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")

  // Fetch jobs for this user
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

  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    if (!db) return
    const jobRef = doc(db, "jobs", jobId)
    updateDoc(jobRef, { 
      status,
      updatedAt: serverTimestamp()
    })
    .then(() => {
      toast({ title: "Status Updated", description: `Job is now ${status}.` })
    })
    .catch(async (error) => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `jobs/${jobId}`,
        operation: "update",
        requestResourceData: { status }
      }))
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="text-muted-foreground">Track your postings, applications, and ongoing work.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/jobs/post">
            <Button className="font-bold rounded-xl gap-2">
              <PlusCircle className="h-4 w-4" /> Post New Job
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg font-bold">Postings</TabsTrigger>
            <TabsTrigger value="applications" className="rounded-lg font-bold">Applications</TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg font-bold">Active Work</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-6">
          {postedLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : postedJobs?.length ? (
            <div className="grid gap-6">
              {postedJobs.map((job: any) => (
                <JobCard key={job.id} job={job} onUpdateStatus={handleUpdateJobStatus} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Briefcase} title="No jobs posted yet" description="Share your project with the community and find the perfect talent." actionUrl="/dashboard/jobs/post" actionText="Create Your First Post" />
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {appsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : applications?.length ? (
            <div className="grid gap-6">
              {applications.map((app: any) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No applications yet" description="Find interesting projects and start submitting your proposals." actionUrl="/jobs" actionText="Browse Jobs" />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-[2rem]">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground">Active contracts display here</h3>
            <p className="max-w-xs mx-auto mt-2">Hire a freelancer or get hired to see your active project tracker.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function JobCard({ job, onUpdateStatus }: { job: any, onUpdateStatus: (id: string, s: string) => void }) {
  const statusColors: any = {
    'open': 'bg-green-100 text-green-700 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'completed': 'bg-slate-100 text-slate-700 border-slate-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <Card className="border-none shadow-sm overflow-hidden group">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("capitalize border px-3", statusColors[job.status])}>
                  {job.status.replace('-', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </span>
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">{job.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-primary">${job.budget}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fixed Budget</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="ghost" size="sm" className="font-bold text-primary gap-2">
                Public View <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            {job.status === 'open' && (
              <Button variant="outline" size="sm" className="font-bold" onClick={() => onUpdateStatus(job.id, 'completed')}>
                Mark Completed
              </Button>
            )}
            <Button size="sm" className="font-bold rounded-lg px-6">Manage Applicants</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationCard({ application }: { application: any }) {
  return (
    <Card className="border-none shadow-sm group">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold capitalize">
                {application.status}
              </Badge>
              <span className="text-xs text-muted-foreground">Applied {new Date(application.createdAt.seconds * 1000).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold">Proposal for: {application.jobTitle || 'Job Post'}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1 italic">"{application.coverLetter}"</p>
          </div>
          <div className="flex items-center gap-8 md:text-right">
            <div>
              <p className="text-xl font-bold text-primary">${application.bidAmount}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">My Bid</p>
            </div>
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 text-primary">
                <ArrowUpRight className="h-5 w-5" />
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
    <div className="text-center py-32 bg-card rounded-[2rem] border-2 border-dashed border-muted shadow-sm">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-10 w-10 text-muted-foreground opacity-30" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">{description}</p>
      <Link href={actionUrl}>
        <Button className="mt-8 rounded-xl px-8 font-bold h-12 shadow-lg shadow-primary/20">
          {actionText}
        </Button>
      </Link>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
