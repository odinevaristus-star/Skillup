
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs,
  setDoc,
  serverTimestamp 
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
  LayoutDashboard,
  RefreshCw
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
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
        router.replace('/login')
        return
      }

      try {
        const docRef = doc(db, 'users', user.uid)
        const snap = await getDoc(docRef)
        
        let profile: any = null
        if (snap.exists()) {
          profile = { id: snap.id, ...snap.data() }
          if (!profile.roles || !Array.isArray(profile.roles)) profile.roles = ['client', 'freelancer']
          if (!profile.activeRole) profile.activeRole = profile.role || 'freelancer'
          setUserData(profile)
        } else {
          profile = { 
            id: user.uid, 
            firstName: user.email?.split('@')[0] || 'User', 
            roles: ['client', 'freelancer'],
            activeRole: 'client',
            skills: []
          }
          setUserData(profile)
        }

        const activeRole = profile.activeRole

        const jobsSnap = await getDocs(collection(db, 'jobs'))
        const allJobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        const appsSnap = await getDocs(collection(db, 'applications'))
        const allApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        if (activeRole === 'client') {
          const myJobs = allJobs.filter((j: any) => j.clientId === user.uid)
          const openJobs = myJobs.filter((j: any) => j.status === 'open')
          const hiredJobs = myJobs.filter((j: any) => ['in-progress', 'completed'].includes(j.status))

          const openJobIds = openJobs.map(j => j.id)
          const pendingCount = allApps.filter((a: any) => openJobIds.includes(a.jobId) && a.status === 'pending').length
          
          setStats({
            activeJobs: openJobs.length,
            expertsHired: hiredJobs.length,
            pendingProposals: pendingCount,
            activeProjects: 0,
            myProposals: 0
          })
        } else {
          const myApps = allApps.filter((a: any) => a.freelancerId === user.uid)
          const workCount = allJobs.filter((j: any) => j.freelancerId === user.uid && j.status === 'in-progress').length
          
          setStats({
            activeJobs: 0,
            expertsHired: 0,
            pendingProposals: 0,
            myProposals: myApps.length,
            activeProjects: workCount
          })
        }

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
  }, [router])

  const handleSwitchRole = async () => {
    if (!userData || switching) return
    setSwitching(true)
    const db = getFirestore()
    const newRole = userData.activeRole === 'client' ? 'freelancer' : 'client'
    
    try {
      const updates: any = {
        activeRole: newRole,
        roles: ['client', 'freelancer'],
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'users', userData.id), updates, { merge: true })
      
      toast({
        title: `Switched to ${newRole === 'client' ? 'Client' : 'Freelancer'} Mode`,
        description: `Your workspace has been updated.`
      })
      
      setTimeout(() => {
        if (newRole === 'freelancer' && (!userData.skills || userData.skills.length === 0)) {
          router.push('/dashboard/profile?complete=true')
        } else {
          window.location.reload()
        }
      }, 500)
    } catch (e: any) {
      console.error("AutoSwitch failed:", e)
      toast({
        variant: "destructive",
        title: "Switch failed",
        description: "Could not change role at this time."
      })
      setSwitching(false)
    }
  }

  if (loading || !mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="font-bold text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Loading Workspace...</p>
      </div>
    )
  }

  const activeRole = userData?.activeRole || 'freelancer'
  const isFreelancer = activeRole === 'freelancer'
  const firstName = userData?.firstName || userData?.fullName?.split(' ')[0] || 'User'

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-card p-10 md:p-14 rounded-[3rem] border border-muted/50 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <LayoutDashboard className="h-40 w-40 -mr-10 -mt-10" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
              {activeRole.toUpperCase()} MODE
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSwitchRole} 
              disabled={switching}
              className="rounded-full font-bold text-[10px] uppercase tracking-widest h-10 px-6 gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all"
            >
              {switching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Switch to {isFreelancer ? 'Client' : 'Freelancer'}
            </Button>
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
