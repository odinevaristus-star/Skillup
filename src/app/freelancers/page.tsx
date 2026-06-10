
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
  Filter, 
  Loader2, 
  Briefcase, 
  MessageSquare, 
  Eye,
  User
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
      const hasSkills = fl.skills && Array.isArray(fl.skills) && fl.skills.length > 0
      const hasSingleSkill = !!fl.skill
      
      if (!hasSkills && !hasSingleSkill) return false

      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        !searchTerm ||
        fl.fullName?.toLowerCase().includes(searchLower) ||
        fl.title?.toLowerCase().includes(searchLower) || 
        fl.skills?.some((s: string) => s.toLowerCase().includes(searchLower)) ||
        fl.skill?.toLowerCase().includes(searchLower)
      
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
    if (fl.gender === 'female') return <User className="h-8 w-8 text-pink-500" />
    if (fl.gender === 'male') return <User className="h-8 w-8 text-blue-500" />
    return <User className="h-8 w-8 text-primary" />
  }

  const getFallbackBg = (fl: any) => {
    if (fl.gender === 'female') return "bg-pink-100"
    if (fl.gender === 'male') return "bg-blue-100"
    return "bg-muted"
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary py-20 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/market/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-none">Find Skilled Students Near You</h1>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Browse campus freelancers offering artisan and digital services. Hire fast, pay fair.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
              <Input 
                placeholder="Search by name or skill (e.g. 'Plumber', 'UI Design')" 
                className="pl-16 h-16 text-lg bg-white text-foreground rounded-2xl border-none shadow-2xl focus-visible:ring-offset-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Tabs 
                value={categoryType} 
                onValueChange={(val: any) => setCategoryType(val)} 
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 w-full md:w-[400px] h-12 rounded-xl bg-card border p-1 shadow-sm">
                  <TabsTrigger value="all" className="rounded-lg font-bold">All</TabsTrigger>
                  <TabsTrigger value="Digital" className="rounded-lg font-bold">Digital</TabsTrigger>
                  <TabsTrigger value="Artisan" className="rounded-lg font-bold">Artisan</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="hidden lg:block w-64">
                <SearchableSelect 
                  value={specificSkill}
                  onValueChange={setSpecificSkill}
                  placeholder="Filter by skill..."
                  className="h-12"
                />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest font-black">
              <span className="text-foreground">{filteredFreelancers.length}</span> Professionals Available
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
              <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Scanning talent network...</p>
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFreelancers.map((fl: any) => (
                <Card key={fl.id || fl.uid} className="group hover:shadow-2xl transition-all duration-500 border-none shadow-sm overflow-hidden bg-card rounded-[2.5rem] border border-muted/30">
                  <CardContent className="p-0">
                    <div className="p-8">
                      <div className="flex gap-6">
                        <div className="relative shrink-0">
                          <div className={cn("w-20 h-20 rounded-2xl overflow-hidden border-2 border-background shadow-md flex items-center justify-center", getFallbackBg(fl))}>
                            {fl.avatarUrl ? (
                              <Image 
                                src={fl.avatarUrl} 
                                alt={fl.fullName || "User"} 
                                width={96} 
                                height={96}
                                className="object-cover h-full w-full transition-transform group-hover:scale-110"
                              />
                            ) : getFallbackIcon(fl)}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-card rounded-full shadow-lg",
                            fl.isAvailable !== false ? "bg-green-500" : "bg-destructive"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-black text-xl group-hover:text-primary transition-colors truncate tracking-tight">{fl.fullName}</h3>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-primary/20 text-primary rounded-full">
                              {fl.skillType || 'Expert'}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Briefcase className="h-4 w-4 text-primary" /> {fl.title || fl.skill || "Professional"}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-black">{fl.rating ? fl.rating.toFixed(1) : "N/A"}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">({fl.completedJobs || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10 font-medium italic">
                          "{fl.bio || "Available for campus projects and collaborations."}"
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {fl.skills ? (
                          <>
                            {fl.skills.slice(0, 3).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-xl">
                                {skill}
                              </Badge>
                            ))}
                            {fl.skills.length > 3 && (
                              <Badge variant="ghost" className="text-[9px] font-black uppercase tracking-widest">+{fl.skills.length - 3} more</Badge>
                            )}
                          </>
                        ) : fl.skill ? (
                          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-xl">
                            {fl.skill}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-8 py-6 bg-muted/20 border-t flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-xl font-black text-foreground">
                          {formatPriceRange(fl.priceRange)}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Price Range</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/freelancers/${fl.id || fl.uid}`}>
                          <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 hover:bg-primary/5 transition-all">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/messages?userId=${fl.id || fl.uid}`}>
                          <Button size="icon" className="rounded-xl h-12 w-12 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <MessageSquare className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-48 bg-card rounded-[4rem] border-2 border-dashed border-muted shadow-inner max-w-2xl mx-auto w-full px-8">
              <div className="w-32 h-32 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10">
                <Search className="h-16 w-16 text-muted-foreground opacity-10" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-4">No experts found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed font-medium mb-10">
                We couldn't find anyone matching those specific filters. Try expanding your search or clearing filters.
              </p>
              <Button 
                variant="outline" 
                className="rounded-2xl font-black text-xs uppercase tracking-widest h-14 px-10 border-muted-foreground/20 hover:bg-primary/5"
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
