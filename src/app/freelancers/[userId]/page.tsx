
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
  DollarSign
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

export default function FreelancerProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  const db = useFirestore()

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null
    return doc(db, "users", userId as string)
  }, [db, userId])

  const { data: profile, loading } = useDoc(userRef)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Freelancer not found</h2>
        <Button onClick={() => router.push("/freelancers")} className="mt-4">Back to Search</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      {/* Header Profile Section */}
      <div className="bg-card border-b py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Search
          </Button>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatarUrl || `https://picsum.photos/seed/${userId}/128/128`} />
              <AvatarFallback>{profile.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{profile.fullName}</h1>
                  <p className="text-xl text-muted-foreground font-medium">{profile.title}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2 h-12 px-6">
                    <MessageSquare className="h-4 w-4" /> Message
                  </Button>
                  <Button className="h-12 px-8 font-bold">Hire Now</Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <span className="flex items-center gap-1.5 font-bold text-yellow-500">
                  <Star className="h-4 w-4 fill-current" /> {profile.rating || '5.0'} 
                  <span className="text-muted-foreground font-normal">({profile.completedJobs || 0} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> Remote
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Identity Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Professional Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {profile.bio || "No professional biography provided yet. This freelancer is ready to tackle your complex projects with expertise and precision."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Expertise & Skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {profile.skills?.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                    {skill}
                  </Badge>
                ))}
                {!profile.skills?.length && <p className="text-muted-foreground italic">No skills listed yet.</p>}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle>Project Portfolio</CardTitle>
                <CardDescription>Recent work and successfully completed projects.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="group relative aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer">
                      <img 
                        src={`https://picsum.photos/seed/project-${i}-${userId}/600/400`} 
                        alt="Project" 
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">View Project</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardContent className="pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Hourly Rate</span>
                  <span className="text-2xl font-bold text-primary">${profile.hourlyRate || 45}/hr</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Average 24h response time</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span>{profile.completedJobs || 0} completed projects</span>
                  </div>
                </div>
                <Button className="w-full h-12 text-lg font-bold">Contact Now</Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Stats Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>JOB SUCCESS</span>
                    <span>98%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[98%]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>RECOMMENDATION</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[100%]" />
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
