'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore'
import { 
  Loader2, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  Search, 
  FileText, 
  MessageSquare,
  LayoutDashboard
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    activeJobs: 0,
    expertsHired: 0,
    pendingProposals: 0,
    activeProjects: 0,
    myProposals: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    const auth = getAuth()
    const db = getFirestore()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login'
        return
      }

      try {
        const docRef = doc(db, 'users', user.uid)
        const snap = await getDoc(docRef)
        
        let profile: any = null
        if (snap.exists()) {
          profile = { id: snap.id, ...snap.data() }
          setUserData(profile)
        } else {
          profile = { id: user.uid, firstName: user.email?.split('@')[0] || 'User', role: 'client' }
          setUserData(profile)
        }

        // Fetch all jobs and applications to perform client-side filtering/counting
        // This avoids requirements for complex composite indexes which might be missing.
        const jobsSnap = await getDocs(collection(db, 'jobs'))
        const allJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        const appsSnap = await getDocs(collection(db, 'applications'))
        const allApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        if (profile?.role === 'client') {
          const myJobs = allJobs.filter((j: any) => j.clientId === user.uid)
          const openJobs = myJobs.filter((j: any) => j.status === 'open')
          const hiredJobs = myJobs.filter((j: any) => ['in-progress', 'completed'].includes(j.status))

          const openJobIds = openJobs.map(j => j.id)
          const pendingCount = allApps.filter((a: any) => openJobIds.includes(a.jobId) && a.status === 'pending').length
          
          setStats(prev => ({
            ...prev,
            activeJobs: openJobs.length,
            expertsHired: hiredJobs.length,
            pendingProposals: pendingCount
          }))
        } else {
          const myApps = allApps.filter((a: any) => a.freelancerId === user.uid)
          const workCount = allJobs.filter((j: any) => j.freelancerId === user.uid && j.status === 'in-progress').length
          
          setStats(prev => ({
            ...prev,
            myProposals: myApps.length,
            activeProjects: workCount
          }))
        }

        // Fetch all notifications for client-side filtering/sorting
        const notifsSnap = await getDocs(collection(db, 'notifications'))
        const myNotifs = notifsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((n: any) => n.userId === user.uid)
          .sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0
            const dateB = b.createdAt?.seconds || 0
            return dateB - dateA
          })
          .slice(0, 5)

        setRecentActivity(myNotifs)

      } catch (e) {
        console.error('Error fetching dashboard data:', e)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="font-bold text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Loading Workspace...</p>
      </div>
    )
  }

  const isFreelancer = userData?.role === 'freelancer'
  const firstName = userData?.firstName || 'User'

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-card p-10 md:p-14 rounded-[3rem] border border-muted/50 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <LayoutDashboard className="h-40 w-40 -mr-10 -mt-10" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
              {userData?.role?.toUpperCase() || 'MEMBER'}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            Hello, <span className="text-primary">{firstName}!</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            Manage your campus projects and collaborations from your central command center.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isFreelancer ? (
          <>
            <StatsCard icon={Briefcase} label="Active Projects" value={stats.activeProjects} sub="Current Contracts" color="text-blue-500" />
            <StatsCard icon={FileText} label="Proposals" value={stats.myProposals} sub="Submitted Bids" color="text-purple-500" />
            <StatsCard icon={CheckCircle2} label="Job Success" value={userData?.completedJobs > 0 ? "100%" : "0%"} sub="Completed Tasks" color="text-green-500" />
          </>
        ) : (
          <>
            <StatsCard icon={Briefcase} label="Active Listings" value={stats.activeJobs} sub="Open Jobs" color="text-blue-500" />
            <StatsCard icon={Users} label="Experts Hired" value={stats.expertsHired} sub="Contractors" color="text-purple-500" />
            <StatsCard icon={FileText} label="Pending Proposals" value={stats.pendingProposals} sub="Awaiting Review" color="text-orange-500" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
            <Link href="/dashboard/notifications">
              <Button variant="link" className="text-primary font-black text-xs uppercase tracking-widest">View All</Button>
            </Link>
          </div>
          
          <div className="grid gap-4">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <ActivityItem 
                key={activity.id}
                icon={activity.type === 'message' ? MessageSquare : Briefcase} 
                title={activity.title} 
                time={activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'} 
                desc={activity.message}
                isNew={!activity.read}
              />
            )) : (
              <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-muted/50">
                <p className="text-muted-foreground font-medium">No recent activity yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight px-2">Quick Access</h2>
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col gap-4">
                {isFreelancer ? (
                  <>
                    <QuickLink icon={Search} label="Find Work" href="/jobs" />
                    <QuickLink icon={CheckCircle2} label="Edit Profile" href="/dashboard/profile" />
                  </>
                ) : (
                  <>
                    <QuickLink icon={PlusCircle} label="Post a Job" href="/dashboard/jobs/post" />
                    <QuickLink icon={Users} label="Browse Freelancers" href="/freelancers" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-card overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-muted group-hover:bg-primary/5 transition-colors ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-4xl font-black tracking-tight">{value}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em]">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ icon: Icon, title, time, desc, isNew }: any) {
  return (
    <Card className={`border-none shadow-sm rounded-3xl overflow-hidden transition-all hover:bg-muted/30 group ${isNew ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-card'}`}>
      <CardContent className="p-6 flex gap-6 items-start">
        <div className="p-3 bg-muted rounded-2xl shrink-0 group-hover:bg-card transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base">{title}</h4>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{time}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{desc}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Card>
  )
}

function QuickLink({ icon: Icon, label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-all group">
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
    </Link>
  )
}
