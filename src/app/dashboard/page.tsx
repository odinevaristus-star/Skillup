
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardOverview() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Manual fetch as requested to ensure data integrity
  useEffect(() => {
    async function fetchProfile() {
      if (user && db) {
        setProfileLoading(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Firestore data:', data);
            setProfile(data);
          } else {
            console.log('No such document in Firestore!');
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    }
    fetchProfile();
  }, [user, db]);

  const isFreelancer = profile?.role === 'freelancer';
  const isClient = profile?.role === 'client';
  
  // Resolve name from Firestore fields
  const firstNameDisplay = profile?.firstName || profile?.first_name || "User";

  // Related data queries
  const activeJobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !profile) return null;
    if (isFreelancer) {
      return query(collection(db, 'jobs'), where('freelancerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    }
    if (isClient) {
      return query(collection(db, 'jobs'), where('clientId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    }
    return null;
  }, [db, user?.uid, isFreelancer, isClient, !!profile]);

  const myApplicationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !isFreelancer) return null;
    return query(collection(db, 'applications'), where('freelancerId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user?.uid, isFreelancer]);

  const { data: activeJobs, loading: jobsLoading } = useCollection(activeJobsQuery);
  const { data: myApplications } = useCollection(myApplicationsQuery);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const stats = isFreelancer
    ? [
        { label: 'Active Projects', value: activeJobs?.filter((j) => j.status === 'in-progress').length.toString() || '0', icon: Briefcase, color: 'text-blue-500' },
        { label: 'Proposals', value: myApplications?.length.toString() || '0', icon: FileText, color: 'text-purple-500' },
        { label: 'Completed', value: profile?.completedJobs?.toString() || '0', icon: CheckCircle2, color: 'text-green-500' },
        { label: 'Rating', value: profile?.rating ? profile.rating.toFixed(1) : 'N/A', icon: Star, color: 'text-yellow-500' },
      ]
    : [
        { label: 'Open Postings', value: activeJobs?.filter((j) => j.status === 'open').length.toString() || '0', icon: Zap, color: 'text-orange-500' },
        { label: 'Active Contracts', value: activeJobs?.filter((j) => j.status === 'in-progress').length.toString() || '0', icon: Briefcase, color: 'text-blue-500' },
        { label: 'Total Hires', value: profile?.totalHires?.toString() || '0', icon: Users, color: 'text-cyan-500' },
        { label: 'Messages', value: '0', icon: MessageSquare, color: 'text-indigo-500' },
      ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            Hello, {firstNameDisplay}!
          </h1>
          <div className="flex items-center gap-3">
            <Badge className={cn(
              "border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
              isFreelancer ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
            )}>
              {profile?.role ? `${profile.role} Account` : 'Role Not Assigned'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-4">
          {isFreelancer ? (
            <Link href="/jobs">
              <Button className="h-16 px-10 rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]">
                <Search className="h-5 w-5" /> Find Work
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/jobs/post">
              <Button className="h-16 px-10 rounded-2xl font-black text-sm uppercase tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]">
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
                <div className={cn('p-4 rounded-2xl bg-muted/50', stat.color)}>
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
            <CardHeader className="p-10 pb-6 border-b bg-muted/10">
              <CardTitle className="text-2xl font-black tracking-tight">{isFreelancer ? 'Current Contracts' : 'My Recent Postings'}</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-8">
              {jobsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                </div>
              ) : activeJobs && activeJobs.length ? (
                <div className="space-y-8">
                  {activeJobs.map((job: any) => (
                    <div key={job.id} className="group p-8 rounded-[2.5rem] border-2 border-muted bg-card hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-8">
                        <div className="space-y-3">
                          <h4 className="font-black text-2xl group-hover:text-primary transition-colors tracking-tight">{job.title}</h4>
                          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                            <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {job.deadline || 'No deadline'}</span>
                            <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full">{job.status}</Badge>
                          </div>
                        </div>
                        <p className="text-3xl font-black text-primary">₦{job.budget?.toLocaleString()}</p>
                      </div>
                      <div className="space-y-3">
                        <Progress value={job.status === 'in-progress' ? 50 : 0} className="h-3 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-muted rounded-[2.5rem]">
                  <Briefcase className="h-12 w-12 mx-auto mb-8 opacity-20" />
                  <h3 className="text-2xl font-black text-foreground">Nothing here yet</h3>
                  <Link href={isFreelancer ? '/jobs' : '/dashboard/jobs/post'}>
                    <Button variant="outline" className="mt-8 rounded-2xl font-black text-sm uppercase tracking-widest h-14 px-10">
                      {isFreelancer ? 'Explore Jobs' : 'Post First Job'}
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
