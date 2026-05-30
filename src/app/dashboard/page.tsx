
'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc, collection, query, where, limit, orderBy, getDocs } from 'firebase/firestore'
import { 
  Loader2, 
  Briefcase, 
  Users, 
  Star, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  Search, 
  FileText, 
  Landmark, 
  MessageSquare, 
  Bell,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    activeJobs: 0,
    totalProposals: 0,
    activeContracts: 0,
    unreadMessages: 0
  })

  useEffect(() => {
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
        
        if (snap.exists()) {
          const profileData = snap.data()
          setUserData(profileData)
          
          // Fetch context-specific stats
          if (profileData.role === 'client') {
            const jobsQuery = query(collection(db, 'jobs'), where('clientId', '==', user.uid))
            const jobsSnap = await getDocs(jobsQuery)
            setStats(prev => ({ ...prev, activeJobs: jobsSnap.size }))
          } else {
            const appsQuery = query(collection(db, 'applications'), where('freelancerId', '==', user.uid))
            const appsSnap = await getDocs(appsQuery)
            setStats(prev => ({ ...prev, totalProposals: appsSnap.size }))
          }
        } else {
          // Fallback if document is missing
          setUserData({ 
            firstName: user.email?.split('@')[0] || 'User', 
            role: 'PENDING' 
          })
        }
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
        <p className="font-bold text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Synchronizing Workspace...</p>
      </div>
    )
  }

  const isFreelancer = userData?.role === 'freelancer'
  const displayName = userData?.firstName || 'User'

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Welcome Section */}
      <div className="bg-card p-10 md:p-14 rounded-[3rem] border border-muted/50 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <LayoutDashboard className="h-40 w-40 -mr-10 -mt-10" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
              {userData?.role || 'Campus Member'}
            </Badge>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Last login: Today
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            Welcome back, <span className="text-primary">{displayName}!</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
            {isFreelancer 
              ? "You have 3 active contracts and 2 new project invites waiting for your review."
              : "Your recent job posting for 'Logo Design' has received 5 new high-quality proposals."}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {isFreelancer ? (
              <>
                <Link href="/jobs">
                  <Button className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-primary/20">
                    <Search className="h-5 w-5" /> Find Work
                  </Button>
                </Link>
                <Link href="/dashboard/profile">
                  <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-muted-foreground/20 hover:bg-primary/5">
                    Update Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/jobs/post">
                  <Button className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl shadow-primary/20">
                    <PlusCircle className="h-5 w-5" /> Post a Job
                  </Button>
                </Link>
                <Link href="/freelancers">
                  <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-muted-foreground/20 hover:bg-primary/5">
                    Browse Experts
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isFreelancer ? (
          <>
            <StatsCard icon={Star} label="Avg Rating" value={userData?.rating?.toFixed(1) || "4.9"} sub="Top 5% Expert" color="text-yellow-500" />
            <StatsCard icon={Briefcase} label="Active Work" value="3" sub="2 nearing deadline" color="text-blue-500" />
            <StatsCard icon={FileText} label="Proposals" value={stats.totalProposals} sub="8 pending review" color="text-purple-500" />
            <StatsCard icon={CheckCircle2} label="Job Success" value="98%" sub="Highly Reliable" color="text-green-500" />
          </>
        ) : (
          <>
            <StatsCard icon={Briefcase} label="Active Jobs" value={stats.activeJobs} sub="2 open listings" color="text-blue-500" />
            <StatsCard icon={Landmark} label="Total Spent" value="₦45,000" sub="All-time billing" color="text-green-500" />
            <StatsCard icon={Users} label="Experts Hired" value="12" sub="Verified network" color="text-purple-500" />
            <StatsCard icon={FileText} label="New Proposals" value="5" sub="Review needed" color="text-orange-500" />
          </>
        )}
      </div>

      {/* Secondary Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
            <Button variant="link" className="text-primary font-black text-xs uppercase tracking-widest">View History</Button>
          </div>
          
          <div className="grid gap-4">
            <ActivityItem 
              icon={MessageSquare} 
              title="New message from Sarah" 
              time="12 minutes ago" 
              desc="Regarding the website redesign project milestones..."
              isNew
            />
            <ActivityItem 
              icon={Briefcase} 
              title="Proposal Accepted" 
              time="2 hours ago" 
              desc="The client for 'Mobile App Prototype' has accepted your bid."
            />
            <ActivityItem 
              icon={Bell} 
              title="Payment Processed" 
              time="Yesterday" 
              desc="₦12,000 has been released to your digital wallet."
            />
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="text-2xl font-black tracking-tight px-2">Quick Access</h2>
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-card">
            <CardContent className="p-8 space-y-6">
              <div className="flex flex-col gap-4">
                <QuickLink icon={Users} label="Manage Contacts" href="/dashboard/messages" />
                <QuickLink icon={Landmark} label="Earnings & Billing" href="/dashboard" />
                <QuickLink icon={MessageSquare} label="Support Center" href="/dashboard" />
              </div>
              <div className="pt-6 border-t">
                <div className="p-6 bg-primary/5 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Campus Tip</p>
                  <p className="text-sm font-medium leading-relaxed">
                    Always use the internal messaging system to maintain payment protection for all contracts.
                  </p>
                </div>
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

function LayoutDashboard({ className }: { className?: string }) {
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
