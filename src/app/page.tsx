'use client';

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/firebase"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  Briefcase, 
  MessageSquare
} from "lucide-react"

export default function LandingPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              Hire the best <span className="text-primary">campus talent</span> in minutes.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Connect with skilled students for any job. From essential artisan trades to digital projects, SkillUp is your portal to campus services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-10 py-7 rounded-xl font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                  Get Started
                </Button>
              </Link>
              <Link href="/freelancers">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-10 py-7 rounded-xl font-bold hover:bg-muted/50 transition-all">
                  Browse Freelancers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Why SkillUp? */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">Why SkillUp?</h2>
            <p className="text-muted-foreground text-lg">We've built a simple platform to help you get things done on campus.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                title: "Find Campus Talent", 
                desc: "Discover skilled peers within your campus community for any task, big or small." 
              },
              { 
                icon: Briefcase, 
                title: "Post Jobs Easily", 
                desc: "Quickly describe what you need, set your budget, and receive proposals from qualified students." 
              },
              { 
                icon: MessageSquare, 
                title: "Chat Directly", 
                desc: "Connect instantly through our built-in messaging system to coordinate project details." 
              }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-sm bg-card hover:shadow-xl transition-all rounded-[2rem] overflow-hidden">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-16 border-t mt-auto bg-card">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <span className="text-3xl font-black tracking-tighter text-primary">SkillUp</span>
              <p className="text-muted-foreground mt-6 max-w-sm font-medium leading-relaxed">
                Empowering campus collaboration through connection and world-class student talent.
              </p>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li><Link href="/freelancers" className="hover:text-primary transition-colors">Find Talent</Link></li>
                <li><Link href="/jobs" className="hover:text-primary transition-colors">Find Work</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Log In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-t pt-10">
            <p>© 2026 SkillUp Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="hover:text-primary">Twitter</Link>
              <Link href="#" className="hover:text-primary">Instagram</Link>
              <Link href="#" className="hover:text-primary">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
