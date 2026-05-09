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
    title: "Digital Skills",
    description: "Built for the internet age",
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
    title: "Hand & Artisan Skills",
    description: "Skilled professionals for real-world needs",
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
        <div className="bg-primary py-20 text-primary-foreground text-center px-4">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Explore all services</h1>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
              Find exactly what you need. From complex software development to essential home repairs, our verified professionals have you covered.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input 
                className="h-14 pl-12 pr-6 rounded-full text-foreground text-lg shadow-xl"
                placeholder="Search for any skill or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 py-20">
          <div className="space-y-24">
            {filteredCategories.map((group) => (
              <section key={group.title} className="space-y-10">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">{group.title}</h2>
                  <p className="text-muted-foreground mt-2">{group.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {group.skills.map((skill) => (
                    <Link key={skill.name} href={`/freelancers?category=${skill.name}`}>
                      <Card className="group h-full hover:shadow-lg transition-all border-none shadow-sm cursor-pointer overflow-hidden bg-card">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl bg-muted group-hover:bg-primary/5 transition-colors ${skill.color}`}>
                              <skill.icon className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                              {skill.count}
                            </span>
                          </div>
                          <div className="mt-6">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{skill.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">Browse experts in {skill.name.toLowerCase()}</p>
                          </div>
                          <div className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View freelancers <ArrowRight className="h-3 w-3 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-20">
                <p className="text-2xl font-bold text-muted-foreground">No categories found matching "{search}"</p>
                <button 
                  onClick={() => setSearch("")} 
                  className="mt-4 text-primary font-semibold hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-12 border-t bg-card">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2024 SkillUp Inc. All categories are subject to our verified pro policy.</p>
        </div>
      </footer>
    </div>
  )
}
