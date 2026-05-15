
"use client"

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  MapPin, 
  MessageSquare, 
  Briefcase, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Share2,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"

export default function FreelancerProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  const { user: currentUser } = useUser()
  const db = useFirestore()

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null
    return doc(db, "users", userId as string)
  }, [db, userId])

  const { data: profile, loading } = useDoc(userRef)

  const handleMessage = () => {
    if (!currentUser) {
      router.push("/login")
      return
    }
    router.push(`/dashboard/messages?userId=${userId}`)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold text-lg">Loading expert profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl rounded-[3rem]">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8">
            <Briefcase className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Profile not found</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">The expert you are looking for might have moved or is currently unavailable.</p>
          <Button onClick={() => router.push("/freelancers")} className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20">
            Back to Talent Search
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-card border-b pt-16 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Zap className="h-[30rem] w-[30rem] text-primary" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-primary/5 text-primary font-bold rounded-xl h-12">
              <ArrowLeft className="h-4 w-4" /> Back to Search
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-muted-foreground/20 hover:border-primary transition-colors"><Share2 className="h-5 w-5" /></Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="relative shrink-0">
              <Avatar className="w-40 h-40 md:w-56 md:h-56 border-8 border-background shadow-2xl rounded-[3rem]">
                <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${userId}/256/256`} />
                <AvatarFallback className="text-5xl font-bold">{profile.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 border-8 border-card rounded-full shadow-2xl flex items-center justify-center">
                 <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{profile.fullName}</h1>
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Pro Expert</Badge>
                  </div>
                  <p className="text-2xl md:text-3xl text-muted-foreground font-bold tracking-tight">{profile.title}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleMessage}
                    className="flex-1 md:flex-none gap-3 h-16 px-10 border-muted-foreground/20 text-foreground hover:bg-muted/50 rounded-[1.25rem] font-bold text-lg"
                  >
                    <MessageSquare className="h-6 w-6" /> Message
                  </Button>
                  <Button className="flex-1 md:flex-none h-16 px-14 font-bold text-lg rounded-[1.25rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.03] active:scale-[0.98]">
                    Hire Now
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl">
                    <Star className="h-6 w-6 text-yellow-500 fill-current" />
                  </div>
                  <div>
                    <p className="text-xl font-black">{profile.rating || '5.0'}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{profile.completedJobs || 0} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Remote</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Availability</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Verified</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID & Payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-16">
            <section className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight">Professional Biography</h2>
              <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-card">
                <CardContent className="p-10">
                  <p className="text-muted-foreground text-xl leading-relaxed whitespace-pre-line font-medium">
                    {profile.bio || `Specialized professional with extensive experience in ${profile.title}. Focused on delivering high-impact solutions that combine technical precision with creative problem-solving. Committed to transparency, punctuality, and exceeding client expectations through iterative collaboration.`}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight">Expertise & Specialized Skills</h2>
              <div className="flex flex-wrap gap-4">
                {profile.skills?.map((skill: string) => (
                  <div key={skill} className="px-8 py-4 text-base font-bold bg-white border-2 border-muted hover:border-primary transition-all rounded-[1.25rem] shadow-sm flex items-center gap-3 group">
                    <CheckCircle2 className="h-5 w-5 text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                    {skill}
                  </div>
                ))}
                {!profile.skills?.length && <p className="text-muted-foreground italic text-lg">Detailed skills list coming soon.</p>}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black tracking-tight">Case Studies & Portfolio</h2>
                <Button variant="ghost" className="text-primary font-bold h-12 px-6 rounded-xl gap-2">Explore All <ExternalLink className="h-4 w-4" /></Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="group relative overflow-hidden rounded-[2.5rem] bg-card shadow-lg aspect-video cursor-pointer">
                    <Image 
                      src={`https://picsum.photos/seed/portfolio-${i}-${userId}/1200/800`} 
                      alt="Portfolio project" 
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-10">
                      <Badge className="w-fit mb-4 bg-primary text-white border-none font-bold uppercase tracking-widest text-[10px]">Case Study {i}</Badge>
                      <h4 className="text-2xl font-black text-white leading-tight">Complex Project Implementation & Strategy</h4>
                      <p className="text-white/70 text-sm mt-2 font-medium">Full-cycle project management for enterprise client.</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden sticky top-28 bg-white border border-muted/50">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-70">Professional Rate</p>
                  <CardTitle className="text-6xl font-black">${profile.hourlyRate || 45}<span className="text-xl font-medium opacity-70"> / hr</span></CardTitle>
                </div>
                <p className="mt-4 text-primary-foreground/80 font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Typically replies in 2 hours</p>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-primary" /> Active Contracts
                    </span>
                    <span className="font-black text-lg">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Lifetime Reviews
                    </span>
                    <span className="font-black text-lg">{profile.completedJobs || 12}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-3">
                      <Star className="h-4 w-4 text-primary" /> Success Rate
                    </span>
                    <span className="font-black text-lg">99%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Start Project</Button>
                  <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-muted-foreground/20 hover:border-primary transition-all">Download Portfolio (PDF)</Button>
                </div>

                <div className="pt-8 border-t">
                  <div className="p-5 bg-muted/20 rounded-2xl flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                      All projects are protected by <span className="text-foreground font-bold">SkillUp SecurePay</span>. Funds are only released upon your approval of the deliverables.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-card border overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-lg font-black tracking-tight">Trust Verification</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reliability Score</span>
                    <span className="text-xl font-black text-green-500">100%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full rounded-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Response Rate</span>
                    <span className="text-xl font-black text-primary">98%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[98%] rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
