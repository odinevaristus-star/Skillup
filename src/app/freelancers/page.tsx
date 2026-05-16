
"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Filter, Loader2, User, MapPin, CheckCircle2, Briefcase, MessageSquare } from "lucide-react"
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
      <div className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/market/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Hire World-Class Talent</h1>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl">
              From software developers to master artisans. Find verified professionals for every task.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
                <Input 
                  placeholder="What service are you looking for?" 
                  className="pl-14 h-16 text-lg bg-white text-foreground rounded-2xl border-none shadow-2xl focus-visible:ring-offset-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-16 px-12 rounded-2xl font-bold text-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl transition-transform hover:scale-[1.02]">
                Find Experts
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 space-y-8 shrink-0">
            <div className="bg-card p-8 rounded-[2rem] shadow-sm border space-y-8 sticky top-24">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2"><Filter className="h-5 w-5" /> Refine</h2>
                <button 
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryType("all")
                    setActiveCategory("all")
                  }} 
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Expertise Domain</h3>
                <Tabs value={categoryType} onValueChange={(val: any) => {
                  setCategoryType(val)
                  setActiveCategory("all")
                }} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl bg-muted/50 p-1">
                    <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                    <TabsTrigger value="digital" className="rounded-lg">Digital</TabsTrigger>
                    <TabsTrigger value="artisan" className="rounded-lg">Artisan</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Specialized Skill</h3>
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                    <SelectValue placeholder="All Specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    {currentCategories.sort().map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-6 border-t space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Availability</h3>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/5 cursor-pointer hover:bg-muted/10 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Available Immediately</span>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="font-bold text-sm mb-2">Are you an expert?</h4>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">Join {freelancers?.length || 0} professionals already earning on SkillUp.</p>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full rounded-xl font-bold border-primary text-primary hover:bg-primary/5 h-11">Become a Pro</Button>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-[1.5rem] border shadow-sm">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Available Professionals</h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Discovering <span className="text-foreground">{filteredFreelancers.length}</span> verified experts
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sort by:</span>
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-[160px] h-10 rounded-xl">
                    <SelectValue placeholder="Top Match" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Top Match</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Budget Friendly</SelectItem>
                    <SelectItem value="price_high">Premium Experts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold text-lg animate-pulse">Syncing with our professional network...</p>
              </div>
            ) : filteredFreelancers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredFreelancers.map((fl: any) => (
                  <Card key={fl.id} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-none shadow-sm overflow-hidden bg-card rounded-[2rem]">
                    <CardContent className="p-0">
                      <Link href={`/freelancers/${fl.id}`}>
                        <div className="p-8">
                          <div className="flex gap-6">
                            <div className="relative shrink-0">
                              <div className="w-24 h-24 rounded-[1.5rem] bg-muted overflow-hidden border-4 border-background shadow-xl">
                                {fl.avatarUrl ? (
                                  <Image 
                                    src={fl.avatarUrl} 
                                    alt={fl.fullName} 
                                    width={96} 
                                    height={96}
                                    className="object-cover h-full w-full transition-transform duration-700 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary">
                                    <User className="h-12 w-12" />
                                  </div>
                                )}
                              </div>
                              <span className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 border-4 border-card rounded-full shadow-lg" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-bold text-2xl group-hover:text-primary transition-colors truncate">{fl.fullName}</h3>
                                  <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                                    <Briefcase className="h-3.5 w-3.5" /> {fl.title}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-2xl text-foreground">${fl.hourlyRate || '45'}<span className="text-xs text-muted-foreground font-normal">/hr</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-5 pt-1">
                                <div className="flex items-center gap-1.5 text-yellow-500 font-bold text-sm">
                                  <Star className="h-4 w-4 fill-current" /> {fl.rating || '5.0'}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {fl.completedJobs || '0'} Successes
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="mt-6 text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                            {fl.bio || "Proven expertise in delivering high-quality results. Dedicated to professional excellence and client satisfaction."}
                          </p>

                          <div className="mt-6 flex flex-wrap gap-2">
                            {fl.skills?.slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                                {skill}
                              </Badge>
                            ))}
                            {fl.skills?.length > 3 && (
                              <Badge variant="ghost" className="text-[10px] text-muted-foreground font-bold">+{fl.skills.length - 3} MORE</Badge>
                            )}
                          </div>
                        </div>
                      </Link>

                      <div className="px-8 py-5 bg-muted/20 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" /> Remote Available
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/messages?userId=${fl.id}`}>
                            <Button variant="outline" size="sm" className="font-bold rounded-xl h-10 px-4 gap-2">
                              <MessageSquare className="h-4 w-4" /> Message
                            </Button>
                          </Link>
                          <Link href={`/freelancers/${fl.id}`}>
                            <Button size="sm" className="font-bold rounded-xl px-6 h-10 shadow-lg shadow-primary/20">Hire</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-48 bg-card rounded-[3rem] border-2 border-dashed border-muted shadow-inner">
                <div className="w-32 h-32 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search className="h-16 w-16 text-muted-foreground opacity-10" />
                </div>
                <h3 className="text-3xl font-bold mb-4 tracking-tight">No matching experts found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed">
                  Try adjusting your filters or domain to discover more professionals in our network.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-10 rounded-2xl px-12 h-14 font-bold text-lg border-primary text-primary hover:bg-primary/5" 
                  onClick={() => {
                    setSearchTerm("")
                    setCategoryType("all")
                    setActiveCategory("all")
                  }}
                >
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
