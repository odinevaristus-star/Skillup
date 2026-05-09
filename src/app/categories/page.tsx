"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Code, 
  Palette, 
  Video, 
  PenTool, 
  Monitor, 
  Smartphone, 
  Database, 
  Megaphone,
  Plug, 
  Droplets, 
  Wrench, 
  Paintbrush, 
  Hammer, 
  Shovel, 
  Car, 
  Home,
  Search,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const CATEGORIES = [
  {
    id: "digital-skills",
    title: "Digital Skills",
    description: "Work with top-tier talent for your online and technical projects.",
    skills: [
      { name: "Programming", icon: Code, count: "12,403", color: "text-blue-500" },
      { name: "Graphic Design", icon: Palette, count: "8,291", color: "text-pink-500" },
      { name: "Video Editing", icon: Video, count: "4,152", color: "text-purple-500" },
      { name: "Writing & Copy", icon: PenTool, count: "6,720", color: "text-orange-500" },
      { name: "Web Development", icon: Monitor, count: "9,844", color: "text-indigo-500" },
      { name: "Mobile Apps", icon: Smartphone, count: "3,211", color: "text-green-500" },
      { name: "Data Science", icon: Database, count: "2,450", color: "text-cyan-500" },
      { name: "Digital Marketing", icon: Megaphone, count: "7,890", color: "text-red-500" },
    ]
  },
  {
    id: "hand-artisan-skills",
    title: "Hand & Artisan Skills",
    description: "Find local, verified experts for your home, office, or manual tasks.",
    skills: [
      { name: "Electrician", icon: Plug, count: "3,102", color: "text-yellow-600" },
      { name: "Plumbing", icon: Droplets, count: "2,844", color: "text-blue-600" },
      { name: "Mechanic", icon: Wrench, count: "4,520", color: "text-slate-600" },
      { name: "Painting", icon: Paintbrush, count: "1,980", color: "text-emerald-600" },
      { name: "Carpentry", icon: Hammer, count: "2,311", color: "text-amber-700" },
      { name: "Landscaping", icon: Shovel, count: "1,450", color: "text-green-700" },
      { name: "Auto Repair", icon: Car, count: "3,122", color: "text-zinc-600" },
      { name: "Home Repair", icon: Home, count: "5,431", color: "text-stone-600" },
    ]
  }
]

export default function CategoriesPage() {
  const [search, setSearch] = useState("")

  const filteredCategories = CATEGORIES.map(group => ({
    ...group,
    skills: group.skills.filter(skill => 
      skill.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.skills.length > 0)

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <div className="bg-primary py-24 text-primary-foreground text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/bg/1600/900')] opacity-10 bg-cover bg-center"></div>
          <div className="container mx-auto max-w-4xl relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Browse Services</h1>
            <p className="text-primary-foreground/90 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Find exactly what you need. From complex software development to essential home repairs.
            </p>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
              <Input 
                className="h-16 pl-16 pr-8 rounded-full text-foreground text-xl shadow-2xl border-none ring-offset-primary"
                placeholder="What service are you looking for today?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 py-20">
          <div className="space-y-32">
            {filteredCategories.map((group) => (
              <section key={group.title} id={group.id} className="scroll-mt-24 space-y-12">
                <div className="text-center md:text-left border-l-4 border-primary pl-6">
                  <h2 className="text-4xl font-bold tracking-tight">{group.title}</h2>
                  <p className="text-muted-foreground text-lg mt-3 max-w-3xl">{group.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                  {group.skills.map((skill) => (
                    <Link key={skill.name} href={`/freelancers?category=${skill.name}`}>
                      <Card className="group h-full hover:shadow-2xl transition-all border-none shadow-md cursor-pointer overflow-hidden bg-card hover:-translate-y-1">
                        <CardContent className="p-8">
                          <div className="flex items-start justify-between">
                            <div className={`p-4 rounded-2xl bg-muted group-hover:bg-primary/10 transition-colors ${skill.color}`}>
                              <skill.icon className="h-7 w-7" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                              {skill.count} experts
                            </span>
                          </div>
                          <div className="mt-8">
                            <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{skill.name}</h3>
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Find the best {skill.name.toLowerCase()} experts for your project needs.</p>
                          </div>
                          <div className="mt-8 flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                            Explore experts <ArrowRight className="h-4 w-4 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-32">
                <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-bold mb-2">No categories found</h3>
                <p className="text-muted-foreground text-lg">We couldn't find anything matching "{search}"</p>
                <Button 
                  variant="link"
                  onClick={() => setSearch("")} 
                  className="mt-6 text-primary font-bold text-lg"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 border-t bg-card">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2024 SkillUp Inc. Empowering the future of independent work.</p>
        </div>
      </footer>
    </div>
  )
}
