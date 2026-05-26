
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
  CheckCircle2, 
  Briefcase, 
  MessageSquare, 
  Eye,
  MapPin,
  Clock
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { SearchableSelect } from "@/components/ui/searchable-select"

export default function FreelancerSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryType, setCategoryType] = useState<"all" | "Digital" | "Artisan">("all")
  const [specificSkill, setSpecificSkill] = useState("")
  const db = useFirestore()

  const freelancersQuery = useMemoFirebase(() => {
    if (!db) return null
    return query(collection(db, "users"), where("role", "==", "freelancer"))
  }, [db])

  const { data: freelancers, loading } = useCollection(freelancersQuery)

  const filteredFreelancers = useMemo(() => {
    if (!freelancers) return []

    return freelancers.filter(fl => {
      // Only show freelancers who have completed their profile (have at least one skill)
      if (!fl.skills || fl.skills.length === 0) return false

      const matchesSearch = 
        fl.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fl.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        fl.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = 
        categoryType === "all" || 
        fl.skillType === categoryType

      const matchesSkill = 
        !specificSkill || 
        fl.skills?.some((s: string) => s.toLowerCase() === specificSkill.toLowerCase())

      return matchesSearch && matchesType && matchesSkill
    })
  }, [freelancers, searchTerm, categoryType, specificSkill])

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <div className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/market/1600/900')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Hire Verified Experts</h1>
            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              From high-end digital solutions to essential local services. Find the right person for the job.
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
            <p className="text-sm font-medium text-muted-foreground">
              Showing <span className="text-foreground font-bold">{filteredFreelancers.length}</span> verified professionals
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground font-bold text-lg">Loading expert network...</p>
            </div>
          ) : filteredFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFreelancers.map((fl: any) => (
                <Card key={fl.uid} className="group hover:shadow-2xl transition-all duration-500 border-none shadow-sm overflow-hidden bg-card rounded-[2rem]">
                  <CardContent className="p-0">
                    <div className="p-8">
                      <div className="flex gap-6">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-2xl bg-muted overflow-hidden border-2 border-background shadow-md">
                            <Image 
                              src={fl.avatarUrl || `https://picsum.photos/seed/${fl.uid}/96/96`} 
                              alt={fl.fullName} 
                              width={96} 
                              height={96}
                              className="object-cover h-full w-full transition-transform group-hover:scale-110"
                            />
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 border-4 border-card rounded-full shadow-lg",
                            fl.isAvailable !== false ? "bg-green-500" : "bg-destructive"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors truncate">{fl.fullName}</h3>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-primary/20 text-primary">
                              {fl.skillType || 'Professional'}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Briefcase className="h-4 w-4 text-primary" /> {fl.title || "Professional"}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-bold">{fl.rating ? fl.rating.toFixed(1) : "N/A"}</span>
                            <span className="text-xs text-muted-foreground">({fl.completedJobs || 0} jobs)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">
                          {fl.bio || "No biography provided yet."}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {fl.skills?.slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[10px] uppercase font-bold tracking-widest px-3 py-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="px-8 py-5 bg-muted/20 border-t flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-lg font-black text-foreground">{fl.priceRange || "₦500 - ₦5,000"}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Est. Range</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/freelancers/${fl.uid}`}>
                          <Button variant="ghost" size="icon" className="rounded-xl h-11 w-11 border border-transparent hover:border-primary/20">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/messages?userId=${fl.uid}`}>
                          <Button size="icon" className="rounded-xl h-11 w-11 shadow-lg shadow-primary/20">
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
            <div className="text-center py-48 bg-card rounded-[3rem] border-2 border-dashed border-muted shadow-sm max-w-2xl mx-auto w-full">
              <div className="w-32 h-32 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search className="h-16 w-16 text-muted-foreground opacity-10" />
              </div>
              <h3 className="text-3xl font-bold mb-4 tracking-tight">No freelancers found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-lg leading-relaxed mb-8">
                We couldn't find anyone matching your current search criteria.
              </p>
              <Button 
                variant="outline" 
                className="rounded-xl font-bold h-12 px-8"
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
