"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Filter, Loader2, User, MapPin, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"

const DIGITAL_SKILLS = [
  "Programming", "Graphic Design", "Video Editing", "Writing", "UI/UX Design", "Tutoring"
]

const ARTISAN_SKILLS = [
  "Electrician", "Plumbing", "Mechanic", "Painting", "Barbering", "Hair Styling", "Tailoring", "Phone Repair"
]

export default function FreelancerSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryType, setCategoryType] = useState<"all" | "digital" | "artisan">("all")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const db = useFirestore()

  const freelancersQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "users"), where("role", "==", "freelancer"))
  }, [db])

  const { data: freelancers, loading } = useCollection(freelancersQuery)

  const filteredFreelancers = useMemo(() => {
    if (!freelancers) return []

    return freelancers.filter(fl => {
      const matchesSearch = 
        fl.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fl.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fl.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesType = 
        categoryType === "all" || 
        (categoryType === "digital" && fl.skills?.some((s: string) => DIGITAL_SKILLS.includes(s))) ||
        (categoryType === "artisan" && fl.skills?.some((s: string) => ARTISAN_SKILLS.includes(s)))

      const matchesCategory = 
        activeCategory === "all" || 
        fl.skills?.includes(activeCategory)

      return matchesSearch && matchesType && matchesCategory
    })
  }, [freelancers, searchTerm, categoryType, activeCategory])

  const currentCategories = categoryType === "digital" ? DIGITAL_SKILLS : categoryType === "artisan" ? ARTISAN_SKILLS : [...DIGITAL_SKILLS, ...ARTISAN_SKILLS]

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      {/* Search Header */}
      <div className="bg-primary text-primary-foreground py-16 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/market/1600/900')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Discover Top Freelancers</h1>
          <div className="max-w-4xl flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Try 'Full Stack Developer' or 'Plumber'..." 
                className="pl-12 h-16 text-lg bg-white text-foreground rounded-2xl border-none shadow-2xl focus-visible:ring-offset-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-16 px-10 rounded-2xl font-bold text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl">
              Search
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 space-y-8 shrink-0">
            <div className="bg-card p-6 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h2>
                <button 
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryType("all")
                    setActiveCategory("all")
                  }} 
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Clear all
                </button>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Expertise Type</h3>
                <Tabs value={categoryType} onValueChange={(val: any) => {
                  setCategoryType(val)
                  setActiveCategory("all")
                }} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full h-10">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="digital">Digital</TabsTrigger>
                    <TabsTrigger value="artisan">Hand</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Specific Skill</h3>
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select Skill" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Skills</SelectItem>
                    {currentCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Budget (Hourly)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Min $" className="h-10" />
                  <Input placeholder="Max $" className="h-10" />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <h4 className="font-bold mb-2">Want to work?</h4>
              <p className="text-xs text-muted-foreground mb-4">Join our community of {freelancers?.length || 0} professionals and find high-paying jobs.</p>
              <Link href="/signup">
                <Button variant="outline" className="w-full text-xs font-bold border-primary text-primary hover:bg-primary/5">Join as Freelancer</Button>
              </Link>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Found <span className="font-bold text-foreground">{filteredFreelancers.length}</span> verified experts
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-[140px] h-9 rounded-lg">
                    <SelectValue placeholder="Relevance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Top Match</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Lowest Rate</SelectItem>
                    <SelectItem value="price_high">Highest Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Finding the best talent for you...</p>
              </div>
            ) : filteredFreelancers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFreelancers.map((fl: any) => (
                  <Link key={fl.id} href={`/freelancers/${fl.id}`}>
                    <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none shadow-sm overflow-hidden bg-card">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex gap-5">
                            <div className="relative shrink-0">
                              <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border-2 border-background shadow-md">
                                {fl.avatarUrl ? (
                                  <Image 
                                    src={fl.avatarUrl} 
                                    alt={fl.fullName} 
                                    width={80} 
                                    height={80}
                                    className="object-cover h-full w-full"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">
                                    <User className="h-10 w-10" />
                                  </div>
                                )}
                              </div>
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-card rounded-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-xl group-hover:text-primary transition-colors truncate">{fl.fullName}</h3>
                                  <p className="text-sm text-primary font-bold">{fl.title}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xl">${fl.hourlyRate || '45'}<span className="text-xs text-muted-foreground font-normal">/hr</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                  <Star className="h-4 w-4 fill-current" /> {fl.rating || '5.0'}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {fl.completedJobs || '0'} reviews
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="mt-4 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {fl.bio || "Experienced professional ready to help with your project needs. High quality work guaranteed."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {fl.skills?.slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] uppercase font-bold tracking-wider">
                                {skill}
                              </Badge>
                            ))}
                            {fl.skills?.length > 3 && (
                              <Badge variant="ghost" className="text-[10px] text-muted-foreground">+{fl.skills.length - 3} more</Badge>
                            )}
                          </div>
                        </div>

                        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> Remote
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="font-bold text-primary hover:bg-primary/5">Details</Button>
                            <Button size="sm" className="font-bold rounded-lg px-6">Hire</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-card rounded-3xl border-2 border-dashed border-muted shadow-sm">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-muted-foreground opacity-30" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No matching experts found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your filters or searching for different keywords to find the right talent.</p>
                <Button variant="outline" className="mt-8 rounded-full px-8" onClick={() => {
                  setSearchTerm("")
                  setCategoryType("all")
                  setActiveCategory("all")
                }}>
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
