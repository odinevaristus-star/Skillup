'use client';

import { useState, useMemo, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Loader2, 
  ArrowRight, 
  Filter,
  Landmark,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useUser } from "@/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function JobSearchPage() {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [jobs, setJobs] = useState<any[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const db = useFirestore()

  useEffect(() => {
    async function fetchData() {
      if (!db) return
      setLoading(true)
      try {
        // Fetch jobs
        const jobsRef = collection(db, 'jobs')
        const snapshot = await getDocs(jobsRef)
        const fetchedJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setJobs(fetchedJobs)

        // Fetch user's applications if logged in
        if (user?.uid) {
          const appsRef = collection(db, 'applications')
          const appsQuery = query(appsRef, where('freelancerId', '==', user.uid))
          const appsSnap = await getDocs(appsQuery)
          const ids = new Set(appsSnap.docs.map(doc => doc.data().jobId))
          setAppliedJobIds(ids)
        }
      } catch (error) {
        console.error("Error fetching jobs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [db, user?.uid])

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job: any) => {
        const matchesSearch = 
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === "all" || job.category === activeCategory
        const isOpen = job.status === "open"
        return matchesSearch && matchesCategory && isOpen
      })
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })
  }, [jobs, searchTerm, activeCategory])

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary py-12 md:py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/jobs/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-6xl font-black mb-4 md:mb-6 tracking-tighter leading-tight md:leading-none">Find Your Next Gig</h1>
            <p className="text-sm md:text-xl text-primary-foreground/80 mb-8 md:mb-10 leading-relaxed font-medium">
              Discover opportunities across digital services and specialized trades. Secure your next contract today.
            </p>
            <div className="relative group max-w-2xl mx-auto">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 md:h-6 md:w-6" />
              <input 
                className="flex h-14 md:h-16 w-full rounded-2xl border-none bg-white px-12 md:px-16 pr-6 md:pr-8 text-lg text-foreground shadow-2xl transition-all focus:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-primary"
                placeholder="What skills are you offering?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-16 flex-1">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
          <aside className="w-full lg:w-72 space-y-6 md:space-y-8 shrink-0">
            <div className="bg-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm space-y-6 md:space-y-8 border border-muted/50">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base md:text-lg flex items-center gap-2 tracking-tight"><Filter className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Filters</h2>
                <Button variant="link" size="sm" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }} className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary opacity-60 hover:opacity-100 transition-opacity">Reset</Button>
              </div>

              <div className="space-y-4 md:space-y-6">
                <h3 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Category Search</h3>
                <SearchableSelect 
                  value={activeCategory === 'all' ? "" : activeCategory}
                  onValueChange={(val) => setActiveCategory(val || 'all')}
                  placeholder="All Categories"
                  className="h-10 md:h-12"
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-6 md:space-y-8">
            <div className="flex items-center justify-between px-2">
              <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">
                <span className="text-foreground">{filteredJobs?.length || 0}</span> Opportunities
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 md:py-40 gap-4 md:gap-6">
                <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-[8px] md:text-xs">Scanning market...</p>
              </div>
            ) : filteredJobs?.length ? (
              <div className="grid gap-6 md:gap-8">
                {filteredJobs.map((job: any) => {
                  const hasApplied = appliedJobIds.has(job.id);
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <Card className="group hover:shadow-2xl transition-all duration-500 border-none shadow-sm overflow-hidden bg-card cursor-pointer rounded-[1.5rem] md:rounded-[2.5rem] border border-muted/30">
                        <CardContent className="p-6 md:p-10">
                          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            <div className="flex-1 space-y-4 md:space-y-6">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-primary/5 text-primary border-none text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                                  {job.category}
                                </Badge>
                                <span className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em] flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" /> 
                                  {job.createdAt ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                </span>
                              </div>
                              <div className="space-y-1 md:space-y-2">
                                <h3 className="text-xl md:text-3xl font-black group-hover:text-primary transition-colors leading-tight tracking-tighter">
                                  {job.title}
                                </h3>
                                <p className="text-xs md:text-base text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl font-medium">
                                  {job.description}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-1 md:pt-2">
                                <span className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
                                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" /> {job.location || 'Remote'}
                                </span>
                                <span className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl">
                                  <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-primary" /> {job.clientFirstName || 'User'}
                                </span>
                              </div>
                            </div>
                            <div className="md:w-56 flex flex-col items-start md:items-end justify-between gap-4 md:gap-6 md:border-l md:pl-8 md:pt-0">
                              <div className="md:text-right w-full md:w-auto">
                                <p className="text-2xl md:text-4xl font-black text-primary flex items-center gap-1 md:justify-end">
                                  {job.budget && job.budget > 0 ? (
                                    <>
                                      <span className="text-base md:text-2xl font-bold opacity-70">NGN </span>{job.budget.toLocaleString()}
                                    </>
                                  ) : (
                                    "Negotiable"
                                  )}
                                </p>
                                <p className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                                  {job.budget && job.budget > 0 ? "Est. Budget" : "Negotiable"}
                                </p>
                              </div>
                              
                              {hasApplied ? (
                                <Button 
                                  disabled 
                                  variant="secondary" 
                                  className="w-full md:w-auto font-black text-xs uppercase tracking-widest h-11 md:h-14 rounded-2xl gap-2 md:gap-3 px-6 md:px-8 bg-green-500/10 text-green-600 border-none"
                                >
                                  Applied <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                                </Button>
                              ) : (
                                <Button variant="outline" className="w-full md:w-auto font-black text-xs uppercase tracking-widest h-11 md:h-14 rounded-2xl border-muted-foreground/20 hover:border-primary group-hover:bg-primary/5 transition-all gap-2 md:gap-3 px-6 md:px-8">
                                  Apply Now <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 md:py-48 bg-card rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-muted shadow-inner max-w-2xl mx-auto w-full px-6">
                <Briefcase className="h-12 w-12 md:h-20 md:w-20 mx-auto text-muted-foreground mb-6 md:mb-8 opacity-10" />
                <h3 className="text-xl md:text-3xl font-black tracking-tight mb-2 md:mb-4">No matching jobs</h3>
                <p className="text-sm md:text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium mb-8 md:mb-10">Try adjusting your filters or check back later.</p>
                <Button variant="outline" className="rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest h-12 md:h-14 px-8 md:px-10 border-muted-foreground/20" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
