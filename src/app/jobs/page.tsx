
"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Briefcase, Clock, Loader2, ArrowRight, DollarSign } from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"

export default function JobSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
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

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find your next project</h1>
          <p className="text-primary-foreground/80 text-lg mb-8">Browse thousands of open opportunities across digital and artisan trades.</p>
          <div className="max-w-4xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="h-16 pl-12 pr-4 bg-white text-foreground text-lg rounded-xl border-none shadow-2xl"
              placeholder="Search by job title, skill or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="space-y-6 hidden lg:block">
            <h2 className="font-bold text-lg">Filters</h2>
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Category</h3>
              <div className="space-y-2">
                {["Programming", "Design", "Home Repair", "Writing"].map(cat => (
                  <div key={cat} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-4">Budget Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" />
                <Input placeholder="Max" />
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Showing {filteredJobs?.length || 0} open jobs</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : filteredJobs?.length ? (
              <div className="space-y-4">
                {filteredJobs.map((job: any) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <Card className="hover:shadow-lg transition-shadow border-none shadow-sm group">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                                {job.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {job.createdAt ? 'Recently' : 'Now'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">{job.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Remote / On-site</span>
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.clientName}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start md:items-end justify-between min-w-[140px]">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${job.budget}</p>
                              <p className="text-xs text-muted-foreground font-medium">Est. Budget</p>
                            </div>
                            <Button variant="ghost" size="sm" className="mt-4 gap-2 text-primary group-hover:bg-primary/5">
                              View Details <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-card rounded-2xl border-2 border-dashed">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-2xl font-bold">No jobs found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
