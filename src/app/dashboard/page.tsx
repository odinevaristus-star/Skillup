
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
  serverTimestamp,
  query,
  where
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
  RefreshCw,
  Zap,
  Star,
  Bell,
  UserCheck,
  Sparkles,
  Info
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Modal State
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [setupSkill, setSetupSkill] = useState("")
  const [setupGender, setSetupGender] = useState("")
  const [setupPriceRange, setSetupPriceRange] = useState("")
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false)

  const [stats, setStats] = useState({
    activeJobs: 0,
    expertsHired: 0,
    pendingProposals: 0,
    activeProjects: 0,
    myProposals: 0,
    completedJobs: 0,
    averageRating: 0,
    reviewCount: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  
  // Profile Completion State
  const [completion, setCompletion] = useState({
    percentage: 0,
    missing: [] as string[]
  })

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
          if (profile.gender) setSetupGender(profile.gender)
          
          // Calculate Profile Completion
          if (profile.activeRole === 'freelancer') {
            const items = [
              { label: "Profile photo", exists: !!(profile.avatarUrl || user.photoURL), weight: 20 },
              { label: "Professional bio", exists: !!profile.bio, weight: 20 },
              { label: "Skills", exists: profile.skills && profile.skills.length > 0, weight: 20 },
              { label: "Professional title", exists: !!profile.title, weight: 10 },
              { label: "Portfolio projects", exists: profile.portfolio && profile.portfolio.length > 0, weight: 30 },
            ]
            
            const score = items.reduce((acc, item) => acc + (item.exists ? item.weight : 0), 0)
            const missing = items.filter(i => !i.exists).map(i => i.label)
            
            setCompletion({ percentage: score, missing })
          }
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
            myProposals: 0,
            completedJobs: 0,
            averageRating: 0,
            reviewCount: 0
          })
        } else {
          const myApps = allApps.filter((a: any) => a.freelancerId === user.uid)
          const workCount = allJobs.filter((j: any) => j.freelancerId === user.uid && j.status === 'in-progress').length
          const completedCount = allJobs.filter((j: any) => j.freelancerId === user.uid && j.status === 'completed').length
          
          // Fetch ratings for freelancer
          const reviewsSnap = await getDocs(query(collection(db, 'reviews'), where('freelancerId', '==', user.uid)))
          const reviewsData = reviewsSnap.docs.map(d => d.data())
          const reviewCount = reviewsData.length
          const totalRating = reviewsData.reduce((acc: number, r: any) => acc + (r.rating || 0), 0)
          const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0

          setStats({
            activeJobs: 0,
            expertsHired: 0,
            pendingProposals: 0,
            myProposals: myApps.length,
            activeProjects: workCount,
            completedJobs: completedCount,
            averageRating: averageRating,
            reviewCount: reviewCount
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
    const db = getFirestore()
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) return

    const newRole = userData.activeRole === 'client' ? 'freelancer' : 'client'
    
    if (newRole === 'freelancer' && (!userData.skill || userData.skill.trim() === "" || !userData.gender)) {
      setShowSwitchModal(true)
      return
    }

    setSwitching(true)
    try {
      const updates: any = {
        activeRole: newRole,
        roles: ['client', 'freelancer'],
        updatedAt: serverTimestamp()
      }

      await setDoc(doc(db, 'users', user.uid), updates, { merge: true })
      
      toast({
        title: `Switched to ${newRole === 'client' ? 'Client' : 'Freelancer'} Mode`,
        description: `Your workspace has been updated.`
      })
      
      setTimeout(() => {
        window.location.reload()
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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupSkill.trim() || !setupGender || isSubmittingSetup) return

    setIsSubmittingSetup(true)
    const db = getFirestore()
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) return

    try {
      await setDoc(doc(db, 'users', user.uid), {
        skill: setupSkill,
        gender: setupGender,
        priceRange: setupPriceRange,
        activeRole: 'freelancer',
        roles: ['client', 'freelancer'],
        updatedAt: serverTimestamp()
      }, { merge: true })

      setShowSwitchModal(false)
      toast({
        title: "Welcome!",
        description: "You are now in Freelancer Mode"
      })

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (e: any) {
      console.error("Setup failed:", e)
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: "Setup failed. Please try again."
      })
    } finally {
      setIsSubmittingSetup(false)
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
  const fullName = userData?.fullName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || "User"

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'hire': return UserCheck;
      case 'status': return CheckCircle2;
      case 'job_match': return Zap;
      case 'job': return Briefcase;
      default: return Bell;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <div className="bg-card p-6 md:p-10 rounded-[2rem] border border-muted/50 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <LayoutDashboard className="h-24 w-24 -mr-4 -mt-4" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
              {activeRole.toUpperCase()} MODE
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSwitchRole} 
              disabled={switching}
              className="rounded-full font-bold text-[9px] uppercase tracking-widest h-8 px-4 gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all"
            >
              {switching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Switch
            </Button>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-none">
            Hello, <span className="text-primary">{firstName}!</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium max-w-xl leading-relaxed">
            Manage your campus projects and collaborations from your central command center.
          </p>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      {isFreelancer && completion.percentage < 100 && (
        <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-card overflow-hidden border-2 border-primary/5 animate-in slide-in-from-top-4 duration-1000">
          <CardContent className="p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative shrink-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-8 border-muted flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-black text-primary">{completion.percentage}%</span>
              </div>
              <svg className="absolute w-24 h-24 md:w-32 md:h-32 -rotate-90 pointer-events-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r={typeof window !== 'undefined' && window.innerWidth >= 768 ? "58" : "44"}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-primary"
                  style={{
                    strokeDasharray: typeof window !== 'undefined' && window.innerWidth >= 768 ? "364" : "276",
                    strokeDashoffset: typeof window !== 'undefined' && window.innerWidth >= 768 
                      ? 364 - (364 * completion.percentage) / 100 
                      : 276 - (276 * completion.percentage) / 100,
                    transition: "stroke-dashoffset 1.5s ease-in-out"
                  }}
                />
              </svg>
            </div>
            
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Complete Your Profile
                </h3>
                <p className="text-muted-foreground text-sm md:text-base font-medium mt-1">
                  Complete your professional setup to stand out and win more campus projects.
                </p>
              </div>
              
              {completion.missing.length > 0 && (
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                  {completion.missing.map((item) => (
                    <Badge key={item} variant="secondary" className="bg-muted/50 text-[9px] uppercase font-bold tracking-widest px-2.5 py-1">
                      + {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Link href="/dashboard/profile" className="shrink-0 w-full md:w-auto">
              <Button className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                Finish Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isFreelancer ? (
          <>
            <StatsCard icon={Briefcase} label="Active" value={stats.activeProjects} sub="Current" color="text-blue-500" />
            <StatsCard icon={FileText} label="Bids" value={stats.myProposals} sub="Total" color="text-purple-500" />
            <StatsCard icon={CheckCircle2} label="Done" value={stats.completedJobs} sub="Finished" color="text-green-500" />
            <StatsCard 
              icon={Star} 
              label="Rating" 
              value={stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : "N/A"} 
              sub={stats.reviewCount > 0 ? `${stats.reviewCount} rev.` : "New"} 
              color="text-yellow-500" 
            />
          </>
        ) : (
          <>
            <StatsCard icon={Briefcase} label="Listings" value={stats.activeJobs} sub="Open" color="text-blue-500" />
            <StatsCard icon={Users} label="Hired" value={stats.expertsHired} sub="Pros" color="text-purple-500" />
            <StatsCard icon={FileText} label="Pending" value={stats.pendingProposals} sub="Reviews" color="text-orange-500" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black tracking-tight">Recent Activity</h2>
            <Link href="/dashboard/notifications">
              <Button variant="link" className="text-primary font-black text-[10px] uppercase tracking-widest p-0 h-auto">View All</Button>
            </Link>
          </div>
          
          <div className="grid gap-3">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <ActivityItem 
                key={activity.id}
                icon={getActivityIcon(activity.type)} 
                title={activity.title} 
                time={activity.createdAt ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'} 
                desc={activity.message}
                isNew={!activity.read}
                href={activity.link}
              />
            )) : (
              <div className="text-center py-12 bg-card rounded-2xl border-2 border-dashed border-muted/50">
                <p className="text-xs text-muted-foreground font-medium">No recent activity yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-black tracking-tight px-1">Quick Access</h2>
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex flex-col gap-1">
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

      <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
        <DialogContent className="rounded-[2rem] p-6 max-w-md border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> Setup Profile
            </DialogTitle>
            <DialogDescription className="text-sm font-medium leading-relaxed">
              Complete these few details to start offering your services on campus.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSetupSubmit} className="space-y-4 py-2">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest opacity-60">Professional Name</Label>
                <Input value={fullName} readOnly className="h-10 bg-muted/50 border-none rounded-xl cursor-not-allowed" />
              </div>
              
              <div className="grid gap-3">
                <Label className="font-bold text-[10px] uppercase tracking-widest">Gender</Label>
                <RadioGroup value={setupGender} onValueChange={setSetupGender} className="flex gap-2">
                  <div className="flex items-center space-x-2 bg-muted/30 px-4 py-2 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                    <RadioGroupItem value="male" id="setup-male" />
                    <Label htmlFor="setup-male" className="cursor-pointer font-bold text-xs">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted/30 px-4 py-2 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors flex-1">
                    <RadioGroupItem value="female" id="setup-female" />
                    <Label htmlFor="setup-female" className="cursor-pointer font-bold text-xs">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="setup-skill" className="font-bold text-[10px] uppercase tracking-widest">Skill / Craft</Label>
                <Input 
                  id="setup-skill"
                  placeholder="e.g. Graphic Designer, Plumber" 
                  value={setupSkill}
                  onChange={(e) => setSetupSkill(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-muted focus-visible:ring-primary px-4 text-sm font-medium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="setup-price" className="font-bold text-[10px] uppercase tracking-widest">Price range (NGN)</Label>
                <Input 
                  id="setup-price"
                  placeholder="NGN 1,000 - 3,000" 
                  value={setupPriceRange}
                  onChange={(e) => setSetupPriceRange(e.target.value)}
                  className="h-12 rounded-xl border-2 border-muted focus-visible:ring-primary px-4 text-sm font-medium"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmittingSetup}
                className="w-full h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
              >
                {isSubmittingSetup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Freelancing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatsCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl bg-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-xl bg-muted transition-colors ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-2xl font-black tracking-tight">{value}</h3>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ icon: Icon, title, time, desc, isNew, href }: any) {
  const content = (
    <Card className={cn(
      "border-none shadow-sm rounded-2xl overflow-hidden transition-all hover:bg-muted/30 group",
      isNew ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-card',
      href && "cursor-pointer"
    )}>
      <CardContent className="p-4 flex gap-4 items-start">
        <div className="p-2 bg-muted rounded-xl shrink-0 group-hover:bg-card transition-colors">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">{title}</h4>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">{time}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
      </CardContent>
    </Card>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function QuickLink({ icon: Icon, label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-all group">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
    </Link>
  )
}
