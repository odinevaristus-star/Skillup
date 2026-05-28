'use client';

import { useState } from "react"
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
  Landmark
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function JobSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const db = useFirestore()

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(
      collection(db, "jobs"), 
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    )
  }, [db])

  const { data: jobs, loading } = useCollection(jobsQuery)

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        job.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || job.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/jobs/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter">Find Your Next Gig</h1>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed font-medium">
              Discover opportunities across digital services and specialized trades. Secure your next contract today.
            </p>
            <div className="relative group max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
              <Input 
                className="h-16 pl-16 pr-8 bg-white text-foreground text-xl rounded-2xl border-none shadow-2xl transition-all focus:scale-[1.01]"
                placeholder="What skills are you offering today?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="w-full lg:w-80 space-y-8 shrink-0">
            <div className="bg-card p-8 rounded-[2.5rem] shadow-sm space-y-8 border border-muted/50">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2 tracking-tight"><Filter className="h-5 w-5 text-primary" /> Filters</h2>
                <Button variant="link" size="sm" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }} className="p-0 h-auto text-xs font-black uppercase tracking-widest text-primary opacity-60 hover:opacity-100 transition-opacity">Reset</Button>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Category Search</h3>
                <SearchableSelect 
                  value={activeCategory === 'all' ? "" : activeCategory}
                  onValueChange={(val) => setActiveCategory(val || 'all')}
                  placeholder="All Categories"
                />
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between px-2">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                <span className="text-foreground">{filteredJobs?.length || 0}</span> Active Opportunities
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Scanning the campus market...</p>
              </div>
            ) : filteredJobs?.length ? (
              <div className="grid gap-8">
                {filteredJobs.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="group hover:shadow-2xl transition-all duration-500 border-none shadow-sm overflow-hidden bg-card cursor-pointer rounded-[2.5rem] border border-muted/30">
                      <CardContent className="p-10">
                        <div className="flex flex-col md:flex-row gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                {job.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em] flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> 
                                {job.createdAt ? formatDistanceToNow(new Date(job.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-3xl font-black group-hover:text-primary transition-colors leading-tight tracking-tighter">
                                {job.title}
                              </h3>
                              <p className="text-muted-foreground text-base line-clamp-2 leading-relaxed max-w-2xl font-medium">
                                {job.description}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 pt-2">
                              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl">
                                <MapPin className="h-4 w-4 text-primary" /> {job.location || 'Remote'}
                              </span>
                              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/50 px-4 py-2 rounded-xl">
                                <Briefcase className="h-4 w-4 text-primary" /> {job.clientFirstName || 'User'}
                              </span>
                            </div>
                          </div>
                          <div className="md:w-56 flex flex-col items-start md:items-end justify-between gap-6 md:border-l md:pl-10 pt-8 md:pt-0">
                            <div className="md:text-right">
                              <p className="text-4xl font-black text-primary flex items-center gap-1 md:justify-end">
                                <span className="text-2xl font-bold opacity-70">₦</span>{job.budget.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Est. Budget</p>
                            </div>
                            <Button variant="outline" className="w-full md:w-auto font-black text-sm uppercase tracking-widest h-14 rounded-2xl border-muted-foreground/20 hover:border-primary group-hover:bg-primary/5 transition-all gap-3 px-8">
                              Apply Now <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-48 bg-card rounded-[3rem] border-2 border-dashed border-muted shadow-inner max-w-2xl mx-auto w-full">
                <Briefcase className="h-20 w-20 mx-auto text-muted-foreground mb-8 opacity-10" />
                <h3 className="text-3xl font-black tracking-tight mb-4">No matching jobs</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed font-medium mb-10">Try adjusting your search filters or check back later for new campus opportunities.</p>
                <Button variant="outline" className="rounded-2xl font-black text-sm uppercase tracking-widest h-14 px-10 border-muted-foreground/20" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}>
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
