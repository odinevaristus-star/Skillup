
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
  Zap
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-xl">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Freelancer not found</h2>
          <p className="text-muted-foreground mb-8">The profile you are looking for might have been moved or deleted.</p>
          <Button onClick={() => router.push("/freelancers")} className="w-full h-12 rounded-xl font-bold">
            Back to Search
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      {/* Header Profile Section */}
      <div className="bg-card border-b py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Zap className="h-64 w-64 text-primary" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-primary/5 text-primary font-bold">
              <ArrowLeft className="h-4 w-4" /> Back to Discover
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10"><Share2 className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="relative shrink-0">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl rounded-3xl">
                <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${userId}/160/160`} />
                <AvatarFallback className="text-4xl">{profile.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-card rounded-full shadow-lg" />
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{profile.fullName}</h1>
                    <Badge className="bg-primary/10 text-primary border-none text-xs font-bold uppercase tracking-widest px-3">Top Rated</Badge>
                  </div>
                  <p className="text-xl md:text-2xl text-muted-foreground font-medium">{profile.title}</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={handleMessage}
                    className="flex-1 md:flex-none gap-2 h-14 px-8 border-primary text-primary hover:bg-primary/5 rounded-2xl font-bold text-lg"
                  >
                    <MessageSquare className="h-5 w-5" /> Message
                  </Button>
                  <Button className="flex-1 md:flex-none h-14 px-12 font-bold text-lg rounded-2xl shadow-xl shadow-primary/20">
                    Hire Now
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-medium">
                <span className="flex items-center gap-2 text-yellow-500">
                  <Star className="h-5 w-5 fill-current" /> 
                  <span className="text-lg font-bold">{profile.rating || '5.0'}</span>
                  <span className="text-muted-foreground">({profile.completedJobs || 0} reviews)</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" /> Remote
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-5 w-5 text-green-500" /> Identity Verified
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary" /> Available Now
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">About the Professional</h2>
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                    {profile.bio || `Highly skilled and reliable professional with years of experience in ${profile.title}. Dedicated to providing world-class service and high-quality results for all clients. Specializing in efficient workflows and creative problem solving.`}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Expertise & Skills</h2>
              <div className="flex flex-wrap gap-3">
                {profile.skills?.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="px-6 py-2.5 text-sm font-bold bg-card border shadow-sm rounded-xl">
                    {skill}
                  </Badge>
                ))}
                {!profile.skills?.length && <p className="text-muted-foreground italic">No skills listed yet.</p>}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Recent Projects</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="group overflow-hidden border-none shadow-sm rounded-2xl cursor-pointer">
                    <div className="relative aspect-video">
                      <Image 
                        src={`https://picsum.photos/seed/portfolio-${i}-${userId}/800/600`} 
                        alt="Portfolio project" 
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <div className="text-white">
                          <p className="font-bold text-lg">Project Title {i}</p>
                          <p className="text-xs text-white/70">Completed for top-tier client</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <Button variant="ghost" className="w-full py-8 text-primary font-bold hover:bg-primary/5">View Full Portfolio</Button>
            </section>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden sticky top-28">
              <CardHeader className="bg-primary text-primary-foreground p-8">
                <CardTitle className="text-3xl font-bold">${profile.hourlyRate || 45}<span className="text-sm font-normal opacity-70">/hr</span></CardTitle>
                <CardDescription className="text-primary-foreground/80 font-medium">Starting rate for projects</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>Response time</span>
                    </div>
                    <span className="font-bold">~2 hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span>Jobs completed</span>
                    </div>
                    <span className="font-bold">{profile.completedJobs || 12}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Star className="h-5 w-5 text-primary" />
                      <span>Job success rate</span>
                    </div>
                    <span className="font-bold">99%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-14 text-xl font-bold rounded-2xl">Continue to Hire</Button>
                  <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-muted-foreground/20">Save for Later</Button>
                </div>

                <div className="pt-6 border-t">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground leading-relaxed">
                    <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                    <span>SkillUp payment protection ensures you only pay for work you approve.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Trust Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">RELIABILITY</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-muted-foreground">COMMUNICATION</span>
                    <span>98%</span>
                  </div>
                  <div className="h-2.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[98%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
