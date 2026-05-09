import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { 
  CheckCircle, 
  Users, 
  Briefcase, 
  Star, 
  Search, 
  ShieldCheck,
  Code,
  Palette,
  Video,
  PenTool,
  Plug,
  Droplets,
  Wrench,
  Paintbrush,
  ArrowRight
} from "lucide-react"

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-freelancer')

  const digitalSkills = [
    { name: "Programming", icon: Code, color: "bg-blue-500/10 text-blue-600" },
    { name: "Graphic Design", icon: Palette, color: "bg-pink-500/10 text-pink-600" },
    { name: "Video Editing", icon: Video, color: "bg-purple-500/10 text-purple-600" },
    { name: "Writing", icon: PenTool, color: "bg-orange-500/10 text-orange-600" },
  ]

  const handSkills = [
    { name: "Electrician", icon: Plug, color: "bg-yellow-500/10 text-yellow-600" },
    { name: "Plumbing", icon: Droplets, color: "bg-cyan-500/10 text-cyan-600" },
    { name: "Mechanic", icon: Wrench, color: "bg-slate-500/10 text-slate-600" },
    { name: "Painting", icon: Paintbrush, color: "bg-green-500/10 text-green-600" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 max-w-2xl">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                Hire the best <span className="text-primary">freelance talent</span> in minutes.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Connect with top-rated professionals for any job, anywhere. SkillUp is your portal to world-class services at your fingertips.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/jobs">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl">
                    Get Started
                  </Button>
                </Link>
                <Link href="/freelancers">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-xl">
                    Browse Freelancers
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-muted">
                      <Image 
                        src={`https://picsum.photos/seed/user-${i}/40/${40}`} 
                        alt="User" 
                        width={40} 
                        height={40}
                        data-ai-hint="user portrait"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">Joined by 10,000+ professionals</p>
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-2 text-muted-foreground font-normal">4.9/5 overall rating</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative group lg:block">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 transition duration-1000 group-hover:opacity-40"></div>
              <div className="relative overflow-hidden rounded-2xl border bg-card aspect-[4/3] shadow-2xl">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose SkillUp?</h2>
            <p className="text-muted-foreground">We've built a platform that prioritizes trust, speed, and quality above all else.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Smart Matching", desc: "Our AI-powered engine connects you with freelancers who possess the exact skills you need." },
              { icon: ShieldCheck, title: "Secure Payments", desc: "Safe and secure transactions with integrated payment protection and milestone-based releases." },
              { icon: CheckCircle, title: "Verified Profiles", desc: "Every professional on SkillUp goes through a rigorous identity and skill verification process." }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-md bg-card hover:shadow-lg transition-shadow">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Browse by Category Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Explore our marketplace</h2>
            <p className="text-muted-foreground text-lg">Find experts for digital projects or reliable professionals for home services.</p>
          </div>

          <div className="space-y-16">
            {/* Digital Skills */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold border-l-4 border-primary pl-4">Digital Skills</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {digitalSkills.map((skill) => (
                  <Link key={skill.name} href={`/freelancers?category=${skill.name}`}>
                    <Card className="group border-none shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer bg-card">
                      <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className={`p-4 rounded-2xl ${skill.color} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                          <skill.icon className="h-8 w-8" />
                        </div>
                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{skill.name}</h4>
                        <p className="text-sm text-muted-foreground mt-2">Hire top-rated {skill.name.toLowerCase()} experts</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Hand Skills */}
            <div className="space-y-8">
              <h3 className="text-2xl font-bold border-l-4 border-accent pl-4">Hand & Artisan Skills</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {handSkills.map((skill) => (
                  <Link key={skill.name} href={`/freelancers?category=${skill.name}`}>
                    <Card className="group border-none shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer bg-card">
                      <CardContent className="p-8 flex flex-col items-center text-center">
                        <div className={`p-4 rounded-2xl ${skill.color} mb-6 transition-transform group-hover:scale-110 duration-300`}>
                          <skill.icon className="h-8 w-8" />
                        </div>
                        <h4 className="font-bold text-lg group-hover:text-accent transition-colors">{skill.name}</h4>
                        <p className="text-sm text-muted-foreground mt-2">Connect with verified local professionals</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/categories">
              <Button size="lg" variant="outline" className="px-10 h-14 text-lg rounded-full hover:bg-primary hover:text-primary-foreground transition-all gap-2 group">
                View All Categories <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Freelancers", val: "50k+" },
              { label: "Jobs Completed", val: "200k+" },
              { label: "Avg. Rating", val: "4.8" },
              { label: "Secure Payments", val: "$10M+" }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold mb-2">{stat.val}</p>
                <p className="text-primary-foreground/70 uppercase text-xs tracking-widest font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <span className="text-2xl font-bold text-primary">SkillUp</span>
              <p className="text-muted-foreground mt-4 max-w-sm">
                Empowering the future of work through connection, collaboration, and world-class freelance talent.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/freelancers" className="hover:text-primary">Find Talent</Link></li>
                <li><Link href="/jobs" className="hover:text-primary">Find Work</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-8">
            <p>© 2024 SkillUp Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <span>Twitter</span>
              <span>LinkedIn</span>
              <span>Instagram</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
