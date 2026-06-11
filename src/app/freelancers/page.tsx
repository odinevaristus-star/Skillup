"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Star, 
  Loader2, 
  Briefcase, 
  MessageSquare, 
  Eye,
  User,
  MapPin,
  Sparkles
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function FreelancerSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryType, setCategoryType] = useState<"all" | "Digital" | "Artisan">("all")
  const [specificSkill, setSpecificSkill] = useState("")
  const db = useFirestore()

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null
    return collection(db, "users")
  }, [db])

  const { data: allUsers, loading } = useCollection(usersQuery)

  const filteredFreelancers = useMemo(() => {
    if (!allUsers) return []

    return allUsers.filter(fl => {
      // Must have activeRole as freelancer or at least one skill/role
      const isFreelancerMode = fl.activeRole === 'freelancer'
      const hasSkills = fl.skills && Array.isArray(fl.skills) && fl.skills.length > 0
      const hasSingleSkill = !!fl.skill
      
      if (!isFreelancerMode && !hasSkills && !hasSingleSkill) return false

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        !searchTerm ||
        fl.fullName?.toLowerCase().includes(searchLower) ||
        fl.title?.toLowerCase().includes(searchLower) || 
        fl.skills?.some((s: string) => s.toLowerCase().includes(searchLower)) ||
        fl.skill?.toLowerCase().includes(searchLower) ||
        fl.location?.toLowerCase().includes(searchLower)
      
      const matchesType = 
        categoryType === "all" || 
        fl.skillType === categoryType

      const matchesSkill = 
        !specificSkill || 
        fl.skills?.some((s: string) => s.toLowerCase() === specificSkill.toLowerCase()) ||
        fl.skill?.toLowerCase() === specificSkill.toLowerCase()

      return matchesSearch && matchesType && matchesSkill
    })
  }, [allUsers, searchTerm, categoryType, specificSkill])

  const formatPriceRange = (price: any) => {
    if (!price) return "Negotiable"
    const trimmed = price.toString().trim()
    if (trimmed.toLowerCase() === 'negotiable') return "Negotiable"
    
    if (/^\d+$/.test(trimmed)) {
      return `NGN ${parseInt(trimmed).toLocaleString()}`
    }
    
    return trimmed
  }

  const getFallbackIcon = (fl: any) => {
    if (fl.gender === 'female') return <User className="h-6 w-6 md:h-8 md:w-8 text-pink-500" />
    if (fl.gender === 'male') return <User className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
    return <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
  }

  const getFallbackBg = (fl: any) => {
    if (fl.gender === 'female') return "bg-pink-100"
    if (fl.gender === 'male') return "bg-blue-100"
    return "bg-muted"
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary py-12 md:py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/market/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-black mb-4 md:mb-6 tracking-tighter leading-tight md:leading-none">Find Skilled Students Near You</h1>
            <p className="text-sm md:text-xl text-primary-foreground/80 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Browse campus freelancers offering artisan and digital services. Hire fast, pay fair.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5 md:h-6 md:w-6" />
              <Input 
                placeholder="Search by name, skill, or location" 
                className="pl-12 md:pl-16 h-14 md:h-16 text-base md:text-lg bg-white text-foreground rounded-2xl border-none shadow-2xl focus-visible:ring-offset-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12 flex-1">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <Tabs 
                value={categoryType} 
                onValueChange={(val: any) => setCategoryType(val)} 
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 w-full md:w-[350px] h-10 md:h-12 rounded-xl bg-card border p-1 shadow-sm">
                  <TabsTrigger value="all" className="rounded-lg font-bold text-xs">All</TabsTrigger>
                  <TabsTrigger value="Digital" className="rounded-lg font-bold text-xs">Digital</TabsTrigger>
                  <TabsTrigger value="Artisan" className="rounded-lg font-bold text-xs">Artisan</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="hidden lg:block w-64">
                <SearchableSelect 
                  value={specificSkill}
                  onValueChange={setSpecificSkill}
                  placeholder="Filter by skill..."
                  className="h-10 md:h-12"
                />
              </div>
            </div>
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest font-black">
              <span className="text-foreground">{filteredFreelancers.length}</span> Professionals
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 md:py-40 gap-4 md:gap-6">
              <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary opacity-20" />
              <p className="text-muted-foreground font-black uppercase tracking-widest text-[8px] md:text-xs">Scanning talent network...</p>
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredFreelancers.map((fl: any) => (
                <Card key={fl.id || fl.uid} className="group hover:shadow-2xl transition-all duration-500 border-none shadow-sm overflow-hidden bg-card rounded-[1.5rem] md:rounded-[2.5rem] border border-muted/30">
                  <CardContent className="p-0">
                    <div className="p-6 md:p-8">
                      <div className="flex gap-4 md:gap-6">
                        <div className="relative shrink-0">
                          <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-background shadow-md flex items-center justify-center", getFallbackBg(fl))}>
                            {fl.avatarUrl ? (
                              <Image 
                                src={fl.avatarUrl} 
                                alt={fl.fullName || "User"} 
                                width={80} 
                                height={80}
                                className="object-cover h-full w-full transition-transform group-hover:scale-110"
                              />
                            ) : getFallbackIcon(fl)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 border-2 md:border-4 border-card rounded-full shadow-lg",
                            fl.isAvailable !== false ? "bg-green-500" : "bg-destructive"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-black text-lg md:text-xl group-hover:text-primary transition-colors truncate tracking-tight">{fl.fullName}</h3>
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            <Badge variant="outline" className="text-[8px] md:text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-primary/20 text-primary rounded-full">
                              {fl.skillType || 'Expert'}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" /> {fl.title || fl.skill || "Professional"}
                          </p>
                          {fl.location && (
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" /> {fl.location}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1.5">
                            {fl.completedJobs > 0 ? (
                              <>
                                <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-yellow-500 fill-current" />
                                <span className="text-xs md:text-sm font-black">{fl.rating ? fl.rating.toFixed(1) : "N/A"}</span>
                                <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">({fl.completedJobs})</span>
                              </>
                            ) : (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                <Sparkles className="h-2.5 w-2.5 md:h-3 md:w-3" /> New
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-6">
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed h-8 md:h-10 font-medium italic">
                          "{fl.bio || "Available for campus projects and collaborations."}"
                        </p>
                      </div>

                      <div className="mt-4 md:mt-6 flex flex-wrap gap-2">
                        {fl.skills ? (
                          <>
                            {fl.skills.slice(0, 2).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[8px] md:text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-xl">
                                {skill}
                              </Badge>
                            ))}
                            {fl.skills.length > 2 && (
                              <Badge variant="ghost" className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">+{fl.skills.length - 2}</Badge>
                            )}
                          </>
                        ) : fl.skill ? (
                          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[8px] md:text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-xl">
                            {fl.skill}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-6 md:px-8 py-4 md:py-6 bg-muted/20 border-t flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-base md:text-xl font-black text-foreground">
                          {formatPriceRange(fl.priceRange)}
                        </p>
                        <p className="text-[8px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Price Range</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/freelancers/${fl.id || fl.uid}`}>
                          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 md:h-12 md:w-12 hover:bg-primary/5 transition-all">
                            <Eye className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/messages?userId=${fl.id || fl.uid}`}>
                          <Button size="icon" className="rounded-xl h-10 w-10 md:h-12 md:w-12 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 md:py-48 bg-card rounded-[2rem] md:rounded-[4rem] border-2 border-dashed border-muted shadow-inner max-w-2xl mx-auto w-full px-6">
              <div className="w-20 h-20 md:w-32 md:h-32 bg-muted/50 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-10">
                <Search className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground opacity-10" />
              </div>
              <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-2 md:mb-4">No experts found</h3>
              <p className="text-sm md:text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium mb-8 md:mb-10">
                We couldn't find anyone matching those specific filters. Try expanding your search or clearing filters.
              </p>
              <Button 
                variant="outline" 
                className="rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest h-12 md:h-14 px-8 md:px-10 border-muted-foreground/20 hover:bg-primary/5"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryType("all")
                  setSpecificSkill("")
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
