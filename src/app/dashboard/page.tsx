'use client';

import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Briefcase,
  MessageSquare,
  Star,
  Zap,
  Clock,
  PlusCircle,
  Search,
  Loader2,
  CheckCircle2,
  FileText,
  Users,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  const isFreelancer = profile?.role === 'freelancer';
  const isClient = profile?.role === 'client';

  // Data fetching
  const clientJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !isClient) return null;
    return query(collection(db, 'jobs'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user?.uid, isClient]);

  const freelancerJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !isFreelancer) return null;
    return query(collection(db, 'jobs'), where('freelancerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user?.uid, isFreelancer]);

  const myApplicationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !isFreelancer) return null;
    return query(collection(db, 'applications'), where('freelancerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user?.uid, isFreelancer]);

  const { data: clientJobs, loading: clientJobsLoading } = useCollection(clientJobsQuery);
  const { data: freelancerJobs, loading: freelancerJobsLoading } = useCollection(freelancerJobsQuery);
  const { data: myApplications } = useCollection(myApplicationsQuery);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeJobs = isFreelancer ? (freelancerJobs || []) : (clientJobs || []);
  const jobsLoading = isFreelancer ? freelancerJobsLoading : clientJobsLoading;

  const stats = isFreelancer
    ? [
        { label: 'Active Projects', value: activeJobs.filter((j) => j.status === 'in-progress').length.toString(), icon: Briefcase, color: 'text-blue-500' },
        { label: 'Submitted Proposals', value: myApplications?.length.toString() || '0', icon: FileText, color: 'text-purple-500' },
        { label: 'Completed Jobs', value: profile?.completedJobs?.toString() || '0', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Average Rating', value: profile?.rating ? profile.rating.toFixed(1) : 'N/A', icon: Star, color: 'text-yellow-500' },
      ]
    : [
        { label: 'Open Postings', value: activeJobs.filter((j) => j.status === 'open').length.toString(), icon: Zap, color: 'text-orange-500' },
        { label: 'Active Contracts', value: activeJobs.filter((j) => j.status === 'in-progress').length.toString(), icon: Briefcase, color: 'text-blue-500' },
        { label: 'Total Hires', value: profile?.totalHires?.toString() || '0', icon: Users, color: 'text-cyan-500' },
        { label: 'Messages', value: '0', icon: MessageSquare, color: 'text-indigo-500' },
      ];

  // Only show the banner if core identity/role fields are missing
  const showSetupAlert = !profile || !profile.firstName || !profile.lastName || !profile.role;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {showSetupAlert && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 rounded-3xl p-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold text-lg mb-1">Account setup incomplete</AlertTitle>
          <AlertDescription className="text-sm font-medium flex items-center justify-between">
            Your professional profile details are missing. Please complete your registration to start hiring or finding work.
            <Link href="/dashboard/profile">
              <Button variant="outline" size="sm" className="ml-4 rounded-xl font-bold border-destructive text-destructive hover:bg-destructive hover:text-white">
                Complete Profile <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
            Hello, {profile?.firstName || user?.displayName?.split(' ')[0] || 'User'}!
          </h1>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xl font-medium">Your Workspace Overview</p>
            {profile?.role && (
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                  isFreelancer ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                )}>
                  {isFreelancer ? 'Freelancer Account' : 'Client Account'}
                </Badge>
              </div>
            )}
            {!profile?.role && (
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Account Pending
                </Badge>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          {isFreelancer ? (
            <Link href="/jobs">
              <Button className="h-16 px-10 rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Search className="h-5 w-5" /> Find Work
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/jobs/post">
              <Button className="h-16 px-10 rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <PlusCircle className="h-5 w-5" /> Post a Job
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-card overflow-hidden">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className={cn('p-4 rounded-2xl bg-muted/50 transition-colors', stat.color)}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <Card className="border-none shadow-sm overflow-hidden rounded-[3rem] bg-card border border-muted/30">
            <CardHeader className="flex flex-row items-center justify-between p-10 pb-6 border-b bg-muted/10">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">{isFreelancer ? 'Current Contracts' : 'My Recent Postings'}</CardTitle>
                <CardDescription className="font-medium text-base">{isFreelancer ? 'Jobs you are currently working on' : 'Monitor progress of your active projects'}</CardDescription>
              </div>
              <Link href="/dashboard/jobs">
                <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl px-4">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-10 pt-8">
              {jobsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                </div>
              ) : activeJobs.length ? (
                <div className="space-y-8">
                  {activeJobs.map((job: any) => (
                    <div key={job.id} className="group p-8 rounded-[2.5rem] border-2 border-muted bg-card hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-start justify-between mb-8">
                        <div className="space-y-3">
                          <h4 className="font-black text-2xl group-hover:text-primary transition-colors tracking-tight leading-tight">{job.title}</h4>
                          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {job.deadline ? `Due ${job.deadline}` : 'No deadline'}</span>
                            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full">{job.status.replace('-', ' ')}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-primary">₦{job.budget?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>Progress</span>
                          <span>{job.status === 'in-progress' ? '50%' : '0%'}</span>
                        </div>
                        <Progress value={job.status === 'in-progress' ? 50 : 0} className="h-3 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-muted rounded-[2.5rem] px-8">
                  <div className="w-24 h-24 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-8 opacity-20">
                    <Briefcase className="h-12 w-12" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight">Nothing here yet</h3>
                  <Link href={isFreelancer ? '/jobs' : '/dashboard/jobs/post'}>
                    <Button variant="outline" className="mt-10 rounded-2xl font-black text-sm uppercase tracking-widest h-14 px-10 border-muted-foreground/20 hover:border-primary transition-all">
                      {isFreelancer ? 'Explore Job Board' : 'Post First Gig'}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-12">
          <Card className="border-none shadow-sm overflow-hidden rounded-[3rem] bg-card border border-muted/30">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black tracking-tight uppercase tracking-[0.1em]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-8 pt-4">
              <Link href="/freelancers">
                <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                  <span className="font-black text-sm uppercase tracking-widest">Browse Experts</span>
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><Search className="h-6 w-6 text-primary" /></div>
                  <span className="font-black text-sm uppercase tracking-widest">View Job Board</span>
                </Button>
              </Link>
              {!isFreelancer && (
                <Link href="/dashboard/jobs/post">
                  <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><PlusCircle className="h-6 w-6 text-primary" /></div>
                    <span className="font-black text-sm uppercase tracking-widest">Post a Job</span>
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
