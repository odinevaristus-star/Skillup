
"use client"

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, limit, orderBy } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Briefcase, 
  MessageSquare, 
  Star, 
  Zap, 
  Clock, 
  ArrowRight,
  PlusCircle,
  Search,
  Loader2,
  Mail,
  CheckCircle2,
  FileText
} from "lucide-react"
import Link from "next/link"

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  // Fetch jobs where user is either client or assigned freelancer
  const activeJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !profile?.role) return null
    const roleField = profile.role === 'freelancer' ? 'freelancerId' : 'clientId'
    return query(
      collection(db, "jobs"),
      where(roleField, "==", user.uid),
      where("status", "in", ["open", "in-progress"]),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [db, user?.uid, profile?.role])

  const { data: activeJobs, loading: jobsLoading } = useCollection(activeJobsQuery)

  // Fetch applications if user is a freelancer
  const myApplicationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || profile?.role !== 'freelancer') return null
    return query(
      collection(db, "applications"),
      where("freelancerId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [db, user?.uid, profile?.role])

  const { data: myApplications } = useCollection(myApplicationsQuery)

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isFreelancer = profile?.role === 'freelancer'
  const firstName = profile?.firstName || user?.displayName?.split(' ')[0] || "User"

  const stats = isFreelancer ? [
    { label: "Active Projects", value: activeJobs?.filter(j => j.status === 'in-progress').length.toString() || "0", icon: Briefcase, color: "text-blue-500" },
    { label: "Submitted Proposals", value: myApplications?.length.toString() || "0", icon: FileText, color: "text-purple-500" },
    { label: "Completed Jobs", value: profile?.completedJobs?.toString() || "0", icon: CheckCircle2, color: "text-green-500" },
    { label: "Average Rating", value: profile?.rating?.toString() || "5.0", icon: Star, color: "text-yellow-500" },
  ] : [
    { label: "Open Postings", value: activeJobs?.filter(j => j.status === 'open').length.toString() || "0", icon: Zap, color: "text-orange-500" },
    { label: "Active Contracts", value: activeJobs?.filter(j => j.status === 'in-progress').length.toString() || "0", icon: Briefcase, color: "text-blue-500" },
    { label: "Total Hires", value: profile?.totalHires?.toString() || "0", icon: Users, color: "text-cyan-500" },
    { label: "Messages", value: "0", icon: MessageSquare, color: "text-indigo-500" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Hello, {firstName}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex gap-3">
          {isFreelancer ? (
            <Link href="/jobs">
              <Button className="h-11 px-6 rounded-xl font-bold gap-2">
                <Search className="h-4 w-4" /> Find Work
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/jobs/post">
              <Button className="h-11 px-6 rounded-xl font-bold gap-2">
                <PlusCircle className="h-4 w-4" /> Post a Job
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">LIVE</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-bold tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Projects Card */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Recent Projects</CardTitle>
                <CardDescription>Monitor your current progress</CardDescription>
              </div>
              <Link href="/dashboard/jobs">
                <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-6">
              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeJobs?.length ? (
                <div className="space-y-6">
                  {activeJobs.map((job: any) => (
                    <div key={job.id} className="group p-4 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{job.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due {job.deadline || 'Flexible'}</span>
                            <Badge variant="secondary" className="capitalize text-[10px]">{job.status.replace('-', ' ')}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">${job.budget}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <Progress value={job.progress || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No active projects</h3>
                  <p className="text-sm max-w-xs mx-auto mt-2">
                    {isFreelancer ? "Browse available jobs to start earning." : "Post a new job to find talented freelancers."}
                  </p>
                  <Link href={isFreelancer ? "/jobs" : "/dashboard/jobs/post"}>
                    <Button variant="outline" className="mt-6 rounded-xl font-bold">
                      {isFreelancer ? "Explore Job Board" : "Post First Job"}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="h-32 w-32 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">Smart Matches</h2>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our AI matched your profile with these high-potential opportunities.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Senior Full Stack Dev", budget: "$120/hr", match: "99% Match" },
                  { title: "Visual Brand Designer", budget: "$3,500", match: "96% Match" },
                ].map((rec, i) => (
                  <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border hover:border-primary transition-all cursor-pointer group shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold">{rec.match}</Badge>
                      <span className="font-bold text-primary">{rec.budget}</span>
                    </div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors mb-2">{rec.title}</h3>
                    <p className="text-xs text-muted-foreground">Tailored for your {profile?.skills?.[0]} expertise.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-card">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2">
              <Link href={isFreelancer ? "/jobs" : "/dashboard/jobs/post"}>
                <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-dashed hover:border-primary hover:bg-primary/5 transition-all">
                  {isFreelancer ? <Search className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                  <span className="font-bold">{isFreelancer ? 'Find Work' : 'Create Project'}</span>
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-dashed hover:border-primary hover:bg-primary/5 transition-all">
                  <Star className="h-5 w-5" />
                  <span className="font-bold">Boost Profile</span>
                </Button>
              </Link>
              <Link href="/dashboard/messages">
                <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-xl border-dashed hover:border-primary hover:bg-primary/5 transition-all">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-bold">Messenger</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-primary text-primary-foreground p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle className="text-lg">Weekly Outlook</CardTitle>
              </div>
              <CardDescription className="text-primary-foreground/80">Your activity is up 12% this week</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Proposal Views</span>
                  </div>
                  <span className="font-bold">48</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Interviews</span>
                  </div>
                  <span className="font-bold">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">Invitees</span>
                  </div>
                  <span className="font-bold">12</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/5">Detailed Reports</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
