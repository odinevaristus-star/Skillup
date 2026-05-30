'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  User,
  Bell,
  Search,
  LogOut,
  PlusCircle,
  Users,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [switching, setSwitching] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);
  const activeRole = profile?.activeRole || profile?.role || 'freelancer';
  const isFreelancer = activeRole === 'freelancer';
  const isClient = activeRole === 'client';

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'messages'), where('receiverId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: allReceivedMessages } = useCollection(messagesQuery);
  const unreadMessagesCount = useMemo(() => {
    return allReceivedMessages.filter((m: any) => !m.read).length;
  }, [allReceivedMessages]);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'notifications'), where('userId', '==', user.uid));
  }, [db, user?.uid]);

  const { data: allNotifications } = useCollection(notificationsQuery);
  const unreadNotificationsCount = useMemo(() => {
    return allNotifications.filter((n: any) => !n.read).length;
  }, [allNotifications]);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.replace('/');
  };

  const handleSwitchRole = async () => {
    if (!profile || switching) return;
    setSwitching(true);
    const newRole = activeRole === 'client' ? 'freelancer' : 'client';
    
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        activeRole: newRole,
        updatedAt: serverTimestamp()
      });
      toast({
        title: `Mode: ${newRole === 'client' ? 'Client' : 'Freelancer'}`,
        description: "Dashboard updated."
      });
      window.location.reload();
    } catch (e) {
      toast({ variant: "destructive", title: "Switch failed" });
      setSwitching(false);
    }
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    ...(isFreelancer
      ? [
          { label: 'Find Work', href: '/jobs', icon: Search },
          { label: 'My Proposals', href: '/dashboard/jobs', icon: FileText },
          { label: 'Profile', href: '/dashboard/profile', icon: User },
        ]
      : isClient
      ? [
          { label: 'Hire Talent', href: '/freelancers', icon: Users },
          { label: 'My Jobs', href: '/dashboard/jobs', icon: Briefcase },
          { label: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
      : [
          { label: 'Profile', href: '/dashboard/profile', icon: User },
        ]),
    { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, badge: unreadMessagesCount },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: unreadNotificationsCount },
  ];

  return (
    <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 border-r bg-card h-full shadow-2xl z-50">
      <div className="p-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-3xl font-black tracking-tighter text-primary">SkillUp</span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href}>
            <div
              className={cn(
                'flex items-center justify-between px-5 py-4 rounded-2xl transition-all group mb-1',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-4">
                <item.icon className="h-5 w-5" />
                <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-black px-2 py-1 rounded-full',
                    pathname === item.href ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  )}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="p-6 border-t space-y-4">
        <button
          onClick={handleSwitchRole}
          disabled={switching}
          className="w-full flex items-center justify-center gap-3 bg-muted text-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
        >
          {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Switch to {isFreelancer ? 'Client' : 'Freelancer'}
        </button>

        {isClient && (
          <Link href="/dashboard/jobs/post">
            <button className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <PlusCircle className="h-5 w-5" /> Post a Job
            </button>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all group"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-black text-sm uppercase tracking-widest">Logout</span>
        </button>
      </div>
    </aside>
  );
}