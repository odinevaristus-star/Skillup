
'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
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
  const [stats, setStats] = useState({
    activeJobs: 0,
    expertsHired: 0,
    pendingProposals: 0,
    activeProjects: 0,
    myProposals: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const auth = getAuth()
    const db = getFirestore()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/login'
        return
      }

      try {
        // 1. Fetch User Profile
        const docRef = doc(db, 'users', user.uid)
        const snap = await getDoc(docRef)
        
        let profile: any = null
        if (snap.exists()) {
          profile = snap.data()
          setUserData(profile)
        } else {
          // Fallback if doc doesn't exist yet
          profile = { firstName: user.email?.split('@')[0] || 'User', role: 'client' }
          setUserData(profile)
        }

        // 2. Fetch Real Stats based on Role
        if (profile?.role === 'client') {
          // Active Listings
          const openJobsQuery = query(collection(db, 'jobs'), where('clientId', '==', user.uid), where('status', '==', 'open'))
          const openJobsSnap = await getDocs(openJobsQuery)
          
          // Experts Hired (In Progress or Completed)
          const hiredQuery = query(collection(db, 'jobs'), where('clientId', '==', user.uid), where('status', 'in', ['in-progress', 'completed']))
          const hiredSnap = await getDocs(hiredQuery)

          // Pending Proposals (Applications for this client's jobs)
          // We'll get job IDs first
          const jobIds = openJobsSnap.docs.map(d => d.id)
          let pendingCount = 0
          if (jobIds.length > 0) {
            // Firestore 'in' query limit is 30, but this is a campus app MVP
            const appsQuery = query(
              collection(db, 'applications'), 
              where('jobId', 'in', jobIds.slice(0, 30)),
              where('status', '==', 'pending')
            )
            const appsSnap = await getDocs(appsQuery)
            pendingCount = appsSnap.size
          }
          
          setStats(prev => ({
            ...prev,
            activeJobs: openJobsSnap.size,
            expertsHired: hiredSnap.size,
            pendingProposals: pendingCount
          }))
        } else {
          // Freelancer Stats
          const appsQuery = query(collection(db, 'applications'), where('freelancerId', '==', user.uid))
          const appsSnap = await getDocs(appsQuery)
          
          const workQuery = query(collection(db, 'jobs'), where('freelancerId', '==', user.uid), where('status', '==', 'in-progress'))
          const workSnap = await getDocs(workQuery)
          
          setStats(prev => ({
            ...prev,
            myProposals: appsSnap.size,
            activeProjects: workSnap.size
          }))
        }

        // 3. Fetch Recent Activity (Notifications)
        const activityQuery = query(
          collection(db, 'notifications'), 
          where('userId', '==', user.uid), 
          orderBy('createdAt', 'desc'), 
          limit(5)
        )
        const activitySnap = await getDocs(activityQuery)
        setRecentActivity(activitySnap.docs.map(d => ({ id: d.id, ...d.data() })))

      } catch (e) {
        console.error('Error fetching dashboard data:', e)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="font-bold text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Loading Workspace...</p>
      </div>
    )
  }

  const isFreelancer = userData?.role === 'freelancer'
  const firstName = userData?.firstName || userData?.first_name || 'User'

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Welcome Section */}
      <div className="bg-card p-10 md:p-14 rounded-[3rem] border border-muted/50 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <LayoutDashboardIcon className="h-40 w-40 -mr-10 -mt-10" />
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

      {/* Stats Grid */}
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

      {/* Main Content */}
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

function LayoutDashboardIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
