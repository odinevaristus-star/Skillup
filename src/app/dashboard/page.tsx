
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
import { useEffect } from 'react';

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  // Explicit debug logging to see the exact structure in Firestore
  useEffect(() => {
    if (!profileLoading && profile) {
      console.log("DASHBOARD DATA FETCHED:", profile);
    } else if (!profileLoading && !profile && user) {
      console.log("DASHBOARD DATA: No document found for UID:", user.uid);
    }
  }, [profile, profileLoading, user]);

  // Wait for both Auth and Firestore to be absolutely ready
  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Syncing workspace...</p>
        </div>
      </div>
    );
  }

  // Profile data mapping (Handling both new and legacy field names)
  const isFreelancer = profile?.role === 'freelancer';
  const isClient = profile?.role === 'client';
  const firstName = profile?.firstName || profile?.first_name || user?.displayName?.split(' ')[0] || 'User';
  const lastName = profile?.lastName || profile?.last_name || '';
  const role = profile?.role;

  // Banner logic: Only show if the profile document is missing OR if essential fields are null/empty
  // If the document exists but fields are missing, it's an "incomplete setup"
  // If the document doesn't exist at all, it's "Account Pending"
  const docExists = !!profile;
  const missingEssentialFields = !firstName || firstName === 'User' || !lastName || !role;
  const showSetupAlert = !docExists || missingEssentialFields;

  // Data fetching for stats based on confirmed role
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

  const setupLink = isFreelancer ? "/dashboard/profile" : "/dashboard/settings";

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {showSetupAlert && (
        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 rounded-[2rem] p-8">
          <AlertCircle className="h-6 w-6" />
          <div className="flex-1">
            <AlertTitle className="font-black text-xl mb-1">Account setup incomplete</AlertTitle>
            <AlertDescription className="text-base font-medium flex flex-col md:flex-row md:items-center justify-between gap-4">
              Your professional details are missing. Please complete your registration to start hiring or finding work.
              <Link href={setupLink}>
                <Button variant="outline" size="sm" className="rounded-xl font-bold border-destructive text-destructive hover:bg-destructive hover:text-white px-6 h-11">
                  Complete Setup <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">
            Hello, {firstName}!
          </h1>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xl font-medium">Your Workspace Overview</p>
            <div className="flex items-center gap-3">
              {docExists ? (
                <Badge className={cn(
                  "border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                  isFreelancer ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                )}>
                  {role ? `${role} Account` : 'Role Not Assigned'}
                </Badge>
              ) : (
                <Badge variant="destructive" className="border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Account Pending
                </Badge>
              )}
            </div>
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
      </div>
    </div>
  );
}
