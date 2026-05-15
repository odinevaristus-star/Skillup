
"use client"

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
  DollarSign,
  Filter,
  Zap
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { cn } from "@/lib/utils"

const ALL_CATEGORIES = [
  "Programming", "Graphic Design", "Video Editing", "Writing", "Web Development", "Mobile Apps", "Data Science", "Digital Marketing",
  "Electrician", "Plumbing", "Mechanic", "Painting", "Carpentry", "Landscaping", "Auto Repair", "Home Repair"
]

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
      
      {/* Search Hero */}
      <div className="bg-primary py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/jobs/1600/900')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6 tracking-tight">Find Your Next Contract</h1>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              Discover opportunities across digital services and specialized trades. Verified clients and secure payments.
            </p>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
              <Input 
                className="h-16 pl-14 pr-6 bg-white text-foreground text-xl rounded-2xl border-none shadow-2xl transition-all focus:scale-[1.01]"
                placeholder="Search jobs, skills or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="bg-card p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h2>
                <Button variant="link" size="sm" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }} className="p-0 h-auto text-xs font-bold">Reset</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={activeCategory === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    className="rounded-full text-xs font-bold"
                    onClick={() => setActiveCategory('all')}
                  >
                    All
                  </Button>
                  {ALL_CATEGORIES.map(cat => (
                    <Button 
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'outline'} 
                      size="sm" 
                      className="rounded-full text-xs font-bold"
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Card className="border-none bg-accent/5 rounded-2xl overflow-hidden">
              <CardContent className="p-6 space-y-4 text-center">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-bold">Pro Features</h4>
                <p className="text-xs text-muted-foreground">Unlock early access to high-budget projects with SkillUp Pro.</p>
                <Button size="sm" className="w-full font-bold">Upgrade Now</Button>
              </CardContent>
            </Card>
          </aside>

          {/* Job List */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filteredJobs?.length || 0}</span> opportunities
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold">Scanning the market...</p>
              </div>
            ) : filteredJobs?.length ? (
              <div className="grid gap-6">
                {filteredJobs.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="group hover:shadow-xl transition-all border-none shadow-sm overflow-hidden bg-card cursor-pointer">
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs font-bold px-3 py-1">
                                {job.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                <Clock className="h-4 w-4" /> Posted {job.createdAt ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
                              {job.title}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed max-w-2xl">
                              {job.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-6 pt-2">
                              <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                                <MapPin className="h-4 w-4" /> Remote / On-site
                              </span>
                              <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                                <Briefcase className="h-4 w-4" /> {job.clientName}
                              </span>
                            </div>
                          </div>
                          <div className="md:w-48 flex flex-col items-start md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8">
                            <div className="md:text-right">
                              <p className="text-3xl font-bold text-primary">${job.budget}</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Est. Budget</p>
                            </div>
                            <Button variant="ghost" className="w-full md:w-auto font-bold text-primary group-hover:bg-primary/5 rounded-xl gap-2">
                              View Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-card rounded-[2rem] border-2 border-dashed border-muted shadow-sm">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-10" />
                <h3 className="text-2xl font-bold">No matching jobs</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Try adjusting your search filters or check back later for new opportunities.</p>
                <Button variant="outline" className="mt-8 rounded-xl font-bold px-8" onClick={() => { setSearchTerm(""); setActiveCategory("all"); }}>
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
