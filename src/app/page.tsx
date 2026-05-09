import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { CheckCircle, Users, Briefcase, Star, Search, ShieldCheck } from "lucide-react"

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-freelancer')

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

      {/* Category Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Browse by category</h2>
              <p className="text-muted-foreground">Explore expert freelancers across every niche.</p>
            </div>
            <Link href="/freelancers" className="text-primary font-semibold hover:underline mt-4 md:mt-0">
              View all categories →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "Programming", "Design", "Writing", "Marketing", "Video", "Music",
              "Business", "Lifestyle", "Photography", "Data Science", "Mobile", "3D Modeling"
            ].map((cat, i) => (
              <Link key={i} href={`/freelancers?category=${cat}`}>
                <div className="p-6 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-center group">
                  <p className="font-medium group-hover:text-primary">{cat}</p>
                </div>
              </Link>
            ))}
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