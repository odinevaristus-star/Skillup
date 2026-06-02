
'use client';

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Clock,
  Share2
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { doc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function FreelancerProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null
    return doc(db, "users", userId as string)
  }, [db, userId])

  const { data: profile, loading: profileLoading } = useDoc(userRef)

  const handleMessage = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/freelancers/${userId}`)
      return
    }
    router.push(`/dashboard/messages?userId=${userId}`)
  }

  const handleBooking = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/freelancers/${userId}`)
      return
    }
    // Booking logic would go here
  }

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl rounded-[3rem]">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Profile not found</h2>
          <Button onClick={() => router.push("/freelancers")} className="w-full h-14 rounded-2xl font-bold text-lg">
            Back to Search
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      <div className="bg-card border-b pt-16 pb-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-primary/5 text-primary font-bold rounded-xl h-12">
              <ArrowLeft className="h-4 w-4" /> Back to Search
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-muted-foreground/20 hover:border-primary transition-colors">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="relative shrink-0">
              <Avatar className="w-40 h-40 md:w-56 md:h-56 border-8 border-background shadow-2xl rounded-[3rem] overflow-hidden">
                <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${userId}/256/256`} />
                <AvatarFallback className="text-5xl font-bold bg-primary/10 text-primary">
                  {(profile.fullName || "User").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-2 -right-2 w-12 h-12 border-8 border-card rounded-full shadow-2xl flex items-center justify-center",
                profile.isAvailable !== false ? "bg-green-500" : "bg-destructive"
              )}>
                 <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground">{profile.fullName}</h1>
                  <Badge className={cn("border-none font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full", profile.isAvailable !== false ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive")}>
                    {profile.isAvailable !== false ? "Available Now" : "Currently Busy"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xl md:text-2xl text-muted-foreground font-bold tracking-tight">
                  <span>{profile.title || "Professional Expert"}</span>
                  {profile.department && (
                    <span className="flex items-center gap-2 text-primary/70">
                      <GraduationCap className="h-6 w-6" /> {profile.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleMessage}
                  className="flex-1 md:flex-none gap-3 h-16 px-10 border-muted-foreground/20 text-foreground hover:bg-muted/50 rounded-[1.25rem] font-bold text-lg"
                >
                  <MessageSquare className="h-6 w-6" /> Message
                </Button>
                <Button 
                  onClick={handleBooking}
                  className="flex-1 md:flex-none h-16 px-14 font-bold text-lg rounded-[1.25rem] shadow-2xl shadow-primary/30"
                >
                  Book Session
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl"><Star className="h-6 w-6 text-yellow-500 fill-current" /></div>
                  <div><p className="text-xl font-black">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</p><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{profile.completedJobs || 0} reviews</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl"><Clock className="h-6 w-6 text-primary" /></div>
                  <div><p className="text-xl font-black">Top Speed</p><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fast Response</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-2xl"><ShieldCheck className="h-6 w-6 text-green-500" /></div>
                  <div><p className="text-xl font-black">Verified</p><p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Profile Identity</p></div>
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
              <h2 className="text-3xl font-black tracking-tight">Biography</h2>
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-10">
                <p className="text-muted-foreground text-xl leading-relaxed whitespace-pre-line font-medium">
                  {profile.bio || `Passionate professional dedicated to delivering high-quality solutions. Specialized in ${profile.title || 'their craft'}.`}
                </p>
              </Card>
            </section>

            <section className="space-y-6">
              <h2 className="text-3xl font-black tracking-tight">Expertise</h2>
              <div className="flex flex-wrap gap-4">
                {profile.skills?.map((skill: string) => (
                  <div key={skill} className="px-8 py-4 text-base font-bold bg-white border-2 border-muted hover:border-primary transition-all rounded-[1.25rem] shadow-sm flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary opacity-30" />
                    {skill}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden sticky top-28 bg-white border">
              <CardHeader className="bg-primary text-primary-foreground p-10">
                <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-70">Price Range</p>
                <CardTitle className="text-4xl font-black flex items-center gap-2">
                  <Landmark className="h-8 w-8" /> {profile.priceRange && profile.priceRange.toLowerCase() !== 'negotiable' ? `NGN ${profile.priceRange}` : "Negotiable"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <Button className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20" onClick={handleMessage}>
                  Start Collaboration
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
