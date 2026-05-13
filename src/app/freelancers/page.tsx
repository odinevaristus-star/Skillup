"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Filter, Loader2, User } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

export default function FreelancerSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const db = useFirestore()

  const freelancersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("role", "==", "freelancer"));
  }, [db]);

  const { data: freelancers, loading } = useCollection(freelancersQuery);

  const filteredFreelancers = freelancers?.filter(fl => 
    fl.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fl.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fl.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6">Find the perfect freelancer</h1>
          <div className="max-w-4xl flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                placeholder="Try 'React Developer' or 'Logo Design'" 
                className="pl-10 h-14 text-lg bg-card rounded-xl border-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-14 px-8 rounded-xl font-bold text-lg">Search</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <span className="text-sm font-medium mr-2">Popular:</span>
            {["UI Design", "Shopify", "Python", "SEO", "Illustration"].map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors py-1 px-3"
                onClick={() => setSearchTerm(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 space-y-8 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</h2>
              <button onClick={() => setSearchTerm("")} className="text-xs text-primary hover:underline">Clear all</button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Category</h3>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="programming">Programming</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Budget (Hourly)</h3>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Min" />
                <Input placeholder="Max" />
              </div>
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filteredFreelancers?.length || 0}</span> freelancers found
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Relevance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : filteredFreelancers?.length ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredFreelancers.map((fl: any) => (
                  <Card key={fl.id} className="group hover:border-primary transition-all shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0">
                          {fl.avatarUrl ? (
                            <Image 
                              src={fl.avatarUrl} 
                              alt={fl.fullName} 
                              width={64} 
                              height={64}
                              className="object-cover h-full w-full"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                              <User className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{fl.fullName}</h3>
                              <p className="text-sm text-muted-foreground font-medium">{fl.title}</p>
                            </div>
                            <p className="font-bold text-lg">{fl.hourlyRate || '$45'}<span className="text-xs text-muted-foreground font-normal">/hr</span></p>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex items-center gap-1 text-yellow-500 font-bold">
                              <Star className="h-3 w-3 fill-current" /> {fl.rating || '5.0'}
                            </div>
                            <div className="text-muted-foreground">
                              {fl.completedJobs || '0'} jobs completed
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {fl.skills?.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="bg-muted/50 border-none font-medium">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-6 pt-6 border-t flex gap-2">
                        <Button variant="outline" className="flex-1">View Profile</Button>
                        <Button className="flex-1">Contact</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold">No freelancers found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
