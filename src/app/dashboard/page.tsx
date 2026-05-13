"use client"

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, limit } from "firebase/firestore"
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
  LogOut,
  Search,
  Loader2
} from "lucide-react"
import { getAuth, signOut } from "firebase/auth"
import Link from "next/link"

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  const activeJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !profile?.role) return null
    const field = profile.role === 'freelancer' ? 'freelancerId' : 'clientId'
    return query(
      collection(db, "jobs"),
      where(field, "==", user.uid),
      where("status", "==", "in-progress"),
      limit(5)
    )
  }, [db, user?.uid, profile?.role])

  const { data: activeJobs, loading: jobsLoading } = useCollection(activeJobsQuery)

  const displayName = profile?.fullName || user?.displayName || user?.email?.split('@')[0] || "User"
  
  const memberSince = profile?.createdAt 
    ? new Date(profile.createdAt.seconds * 1000).getFullYear().toString()
    : user?.metadata.creationTime 
      ? new Date(user.metadata.creationTime).getFullYear().toString() 
      : "2024"

  const handleSignOut = async () => {
    const auth = getAuth()
    await signOut(auth)
    window.location.href = '/'
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stats = [
    { label: "Active Jobs", value: activeJobs?.length.toString() || "0", icon: Briefcase, color: "text-blue-500" },
    { label: "Account Type", value: profile?.role?.toUpperCase() || "USER", icon: MessageSquare, color: "text-cyan-500" },
    { label: "Member Since", value: memberSince, icon: TrendingUp, color: "text-green-500" },
    { label: "Average Rating", value: "N/A", icon: Star, color: "text-yellow-500" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {displayName}!</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-bold">{profile?.role === 'freelancer' ? 'Freelancer' : 'Client'}</Badge>
            <p className="text-muted-foreground text-sm">
              {profile?.title || (profile?.role === 'freelancer' ? "Professional Freelancer" : "Project Manager")} • {profile?.email || user?.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/profile">
            <Button variant="outline">Edit Profile</Button>
          </Link>
          <Button>Explore {profile?.role === 'freelancer' ? 'Jobs' : 'Talent'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">REAL-TIME</Badge>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">My Active Projects</CardTitle>
                <CardDescription>Track your ongoing work progress</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="pt-6">
              {jobsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeJobs?.length ? (
                <div className="space-y-6">
                  {activeJobs.map((job: any) => (
                    <div key={job.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.clientId === user?.uid ? 'Hiring' : 'Contracted'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {job.deadline || 'No deadline'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>Progress</span>
                          <span>{job.progress || 0}%</span>
                        </div>
                        <Progress value={job.progress || 0} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No active projects found.</p>
                  <Button variant="link" className="mt-2">Browse listings</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary fill-primary/20" />
              <h2 className="text-xl font-bold">AI Recommended for You</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Based on your expertise in {profile?.skills?.[0] || 'your field'}, we found some high-paying opportunities you might like.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Senior Project Architect", budget: "$150/hr", match: "98% Match" },
                { title: "Product Designer", budget: "$4,000", match: "94% Match" },
              ].map((rec, i) => (
                <div key={i} className="bg-card p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-primary border-primary/20">{rec.match}</Badge>
                    <span className="text-sm font-bold">{rec.budget}</span>
                  </div>
                  <h3 className="font-bold group-hover:text-primary transition-colors">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2">Personalized recommendation for {displayName}.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start gap-3 h-11">
                <PlusCircle className="h-4 w-4" /> {profile?.role === 'freelancer' ? 'Browse Work' : 'Post a Job'}
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-11">
                <Search className="h-4 w-4" /> {profile?.role === 'freelancer' ? 'Find Peers' : 'Find Talent'}
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-11 text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Messages & Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4 text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-sm">No new notifications</p>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/5">
                  View Messenger <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
