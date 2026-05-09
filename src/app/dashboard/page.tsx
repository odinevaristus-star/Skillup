"use client"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Briefcase, 
  MessageSquare, 
  Star, 
  Zap, 
  Clock, 
  ArrowRight
} from "lucide-react"

export default function DashboardOverview() {
  const stats = [
    { label: "Active Jobs", value: "3", icon: Briefcase, color: "text-blue-500" },
    { label: "Messages", value: "12", icon: MessageSquare, color: "text-cyan-500" },
    { label: "Total Earned", value: "$4,250", icon: TrendingUp, color: "text-green-500" },
    { label: "Average Rating", value: "4.9", icon: Star, color: "text-yellow-500" },
  ]

  const activeJobs = [
    { id: '1', title: 'React Dashboard UI', client: 'Acme Corp', deadline: '2 days left', progress: 75 },
    { id: '2', title: 'Python Scraper Fix', client: 'WebServices', deadline: '5 days left', progress: 30 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Alex!</h1>
          <p className="text-muted-foreground">You have 2 projects due this week. Good luck!</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Invoice</Button>
          <Button>Explore Jobs</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="text-[10px]">MONTHLY</Badge>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Projects */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Active Projects</CardTitle>
                <CardDescription>Track your ongoing work progress</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {activeJobs.map((job) => (
                  <div key={job.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {job.deadline}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-6 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary fill-primary/20" />
              <h2 className="text-xl font-bold">AI Recommended for You</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Based on your expertise in React and UI Design, we found 3 high-paying jobs you might like.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Senior React Architect", budget: "$150/hr", match: "98% Match" },
                { title: "UX Designer for Fintech", budget: "$4,000", match: "94% Match" },
              ].map((rec, i) => (
                <div key={i} className="bg-card p-4 rounded-xl border border-border/50 shadow-sm hover:border-primary transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-primary border-primary/20">{rec.match}</Badge>
                    <span className="text-sm font-bold">{rec.budget}</span>
                  </div>
                  <h3 className="font-bold group-hover:text-primary transition-colors">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2">Recommended because of your past 5 successful UI projects.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start gap-3 h-11">
                <PlusCircle className="h-4 w-4" /> Create Milestone
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-11">
                <Search className="h-4 w-4" /> Find new talent
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-11 text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "John Doe", msg: "Hey, can we sync tomorrow?", time: "2h ago" },
                  { name: "Sarah Smith", msg: "The files look great, thanks!", time: "5h ago" },
                  { name: "Tech Solutions", msg: "Project proposal accepted", time: "1d ago" },
                ].map((msg, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0">
                      <Image 
                        src={`https://picsum.photos/seed/chat-${i}/40/40`} 
                        alt={msg.name} 
                        width={40} 
                        height={40}
                        data-ai-hint="user portrait"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between">
                        <p className="text-sm font-bold truncate">{msg.name}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{msg.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.msg}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/5">
                  View Messenger <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Fixed missing imports in code
import { PlusCircle, LogOut } from "lucide-react"
import Image from "next/image"
