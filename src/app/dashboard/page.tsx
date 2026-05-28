'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, query, where, limit, orderBy, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TrendingUp,
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
  User,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [roleSetting, setRoleSetting] = useState(false);
  
  // Local state for setup gate
  const [setupFirstName, setSetupFirstName] = useState('');
  const [setupLastName, setSetupLastName] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, loading: profileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (profile) {
      console.log("Dashboard: Logged-in UID:", user?.uid);
      console.log("Dashboard: Profile Data:", profile);
      console.log("Dashboard: Detected Role:", profile.role);
    } else if (!profileLoading && user) {
      console.warn("Dashboard: No Firestore document found for UID:", user.uid);
    }
  }, [profile, profileLoading, user]);

  const isFreelancer = profile?.role === 'freelancer';
  const isClient = profile?.role === 'client';
  const needsSetup = !profile || !profile.role;

  // Data fetching (conditional to avoid unnecessary reads)
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

  const openJobsQuery = useMemoFirebase(() => {
    if (!db || needsSetup) return null;
    return query(collection(db, 'jobs'), where('status', '==', 'open'), orderBy('createdAt', 'desc'), limit(4));
  }, [db, needsSetup]);

  const { data: clientJobs, loading: clientJobsLoading } = useCollection(clientJobsQuery);
  const { data: freelancerJobs, loading: freelancerJobsLoading } = useCollection(freelancerJobsQuery);
  const { data: myApplications } = useCollection(myApplicationsQuery);
  const { data: openJobs, loading: openJobsLoading } = useCollection(openJobsQuery);

  const handleCompleteSetup = async (selectedRole: 'client' | 'freelancer') => {
    if (!userDocRef || !user) return;
    
    const firstName = setupFirstName.trim() || user.displayName?.split(' ')[0] || 'User';
    const lastName = setupLastName.trim() || user.displayName?.split(' ')[1] || '';

    setRoleSetting(true);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      role: selectedRole,
      updatedAt: serverTimestamp(),
      createdAt: profile?.createdAt || serverTimestamp(),
      title: selectedRole === 'client' ? 'Project Client' : 'Professional Freelancer',
      isAvailable: true,
      completedJobs: profile?.completedJobs || 0,
      rating: profile?.rating || null
    };

    console.log("Saving setup data:", userData);

    setDoc(userDocRef, userData, { merge: true })
      .then(() => {
        toast({ title: 'Profile Created!', description: `Welcome to SkillUp as a ${selectedRole}.` });
      })
      .catch(async (error) => {
        console.error("Setup Error:", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'write',
          requestResourceData: userData
        }));
      })
      .finally(() => setRoleSetting(false));
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Profile Setup Gate
  if (needsSetup) {
    return (
      <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-700">
        <div className="max-w-3xl w-full text-center space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter">Complete Your Setup</h1>
            <p className="text-muted-foreground text-xl font-medium">We couldn't find your professional profile. Let's fix that now.</p>
          </div>

          <Card className="p-8 border-none bg-card rounded-[3rem] shadow-xl text-left space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">First Name</Label>
                <Input 
                  placeholder="e.g. John" 
                  value={setupFirstName} 
                  onChange={(e) => setSetupFirstName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Last Name</Label>
                <Input 
                  placeholder="e.g. Doe" 
                  value={setupLastName} 
                  onChange={(e) => setSetupLastName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold text-center block">Select Your Role</Label>
              <div className="grid md:grid-cols-2 gap-8">
                <button
                  onClick={() => handleCompleteSetup('client')}
                  disabled={roleSetting}
                  className="flex flex-col items-center p-8 border-4 border-muted hover:border-primary bg-card rounded-[2.5rem] transition-all group relative"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-black">I am a Client</h3>
                  <p className="text-xs text-muted-foreground mt-1">I want to hire talent</p>
                </button>

                <button
                  onClick={() => handleCompleteSetup('freelancer')}
                  disabled={roleSetting}
                  className="flex flex-col items-center p-8 border-4 border-muted hover:border-accent bg-card rounded-[2.5rem] transition-all group relative"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                    <Briefcase className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-black">I am a Freelancer</h3>
                  <p className="text-xs text-muted-foreground mt-1">I want to work</p>
                </button>
              </div>
            </div>
            
            {roleSetting && (
              <div className="flex justify-center pt-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const firstName = profile?.firstName || user?.displayName?.split(' ')[0] || 'User';
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

  const smartMatches = openJobs?.filter((job) => job.clientId !== user?.uid).slice(0, 2) || [];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground">Hello, {firstName}!</h1>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xl font-medium">Your Workspace Dashboard</p>
            <div className="flex items-center gap-3">
              <Badge className={cn(
                "border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                isFreelancer ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
              )}>
                {isFreelancer ? 'Freelancer Account' : 'Client Account'}
              </Badge>
              <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-50">Role: {profile?.role}</span>
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
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-none bg-muted/50 px-3 py-1">LIVE</Badge>
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
                          <span>Status</span>
                          <span>{job.status === 'open' ? 'Awaiting Applicants' : 'Active Milestone'}</span>
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
                  <p className="text-lg max-w-xs mx-auto mt-4 leading-relaxed font-medium">
                    {isFreelancer ? 'Browse available jobs to start earning today.' : 'Post a new job to find talented professionals.'}
                  </p>
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
              {isFreelancer ? (
                <Link href="/jobs">
                  <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><Search className="h-6 w-6 text-primary" /></div>
                    <span className="font-black text-sm uppercase tracking-widest">Browse Jobs</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/dashboard/jobs/post">
                    <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><PlusCircle className="h-6 w-6 text-primary" /></div>
                      <span className="font-black text-sm uppercase tracking-widest">Post a Gig</span>
                    </Button>
                  </Link>
                  <Link href="/freelancers">
                    <Button variant="outline" className="w-full justify-start gap-5 h-16 rounded-[1.25rem] border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all px-6">
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                      <span className="font-black text-sm uppercase tracking-widest">Hire Expert</span>
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
