'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { Sun, Moon, Zap, User, LogOut, LayoutDashboard, Bell, MessageSquare, Users, Search, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, query, where, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const auth = authInstance();
  const db = useFirestore();

  function authInstance() {
    try {
      return useAuth();
    } catch (e) {
      return null;
    }
  }

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);
  const isFreelancer = profile?.role === 'freelancer';
  const isClient = profile?.role === 'client';

  const unreadNotificationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
  }, [db, user?.uid]);

  const { data: unreadNotifications } = useCollection(unreadNotificationsQuery);

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'messages'), where('receiverId', '==', user.uid), where('read', '==', false));
  }, [db, user?.uid]);

  const { data: unreadMessages } = useCollection(unreadMessagesQuery);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.href = '/';
  };

  // Improved initials logic
  const getInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    if (profile?.fullName) {
      const parts = profile.fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      if (parts[0]) return parts[0][0].toUpperCase();
    }
    return "?";
  };

  const displayName = profile?.fullName || profile?.firstName || user?.displayName || "User";

  return (
    <nav className="sticky top-0 z-[100] w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 h-20 flex items-center shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-black tracking-tighter text-primary">SkillUp</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                {isFreelancer ? (
                  <Link href="/jobs" className="text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:text-primary transition-colors">
                    <Search className="h-4 w-4" /> Find Work
                  </Link>
                ) : isClient ? (
                  <>
                    <Link href="/freelancers" className="text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:text-primary transition-colors">
                      <Users className="h-4 w-4" /> Hire Talent
                    </Link>
                    <Link href="/dashboard/jobs/post" className="text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:text-primary transition-colors">
                      <PlusCircle className="h-4 w-4" /> Post Job
                    </Link>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/freelancers" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Hire Talent</Link>
                <Link href="/jobs" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Find Work</Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-muted transition-all">
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'amoled' && <Zap className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              <DropdownMenuItem onClick={() => toggleTheme('light')} className="rounded-xl font-bold">Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('dark')} className="rounded-xl font-bold">Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('amoled')} className="rounded-xl font-bold">AMOLED</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <>
              <Link href="/dashboard/messages" className="relative">
                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-muted transition-all">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages && unreadMessages.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px] font-black border-4 border-background shadow-lg">
                      {unreadMessages.length > 9 ? '9+' : unreadMessages.length}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/notifications" className="relative">
                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-muted transition-all">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] font-black border-4 border-background shadow-lg">
                      {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-2xl border-2 border-muted overflow-hidden hover:border-primary transition-all p-0">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={user.photoURL || profile?.avatarUrl || ""} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 rounded-[2rem] p-4 shadow-2xl" align="end" forceMount>
                <div className="flex flex-col space-y-2 p-4 border-b mb-2">
                  <p className="text-lg font-black leading-none tracking-tight truncate">{displayName}</p>
                  <p className="text-[10px] font-black leading-none text-muted-foreground uppercase tracking-widest">{profile?.role || 'User'}</p>
                </div>
                <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer hover:bg-primary/5 transition-all">
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-4 h-5 w-5 text-primary" /> <span className="font-black text-xs uppercase tracking-widest">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-2xl p-4 cursor-pointer hover:bg-primary/5 transition-all">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <User className="mr-4 h-5 w-5 text-primary" /> <span className="font-black text-xs uppercase tracking-widest">My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive rounded-2xl p-4 cursor-pointer hover:bg-destructive/5 transition-all">
                  <LogOut className="mr-4 h-5 w-5" /> <span className="font-black text-xs uppercase tracking-widest">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-black text-xs uppercase tracking-widest h-12 px-6">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="font-black text-xs uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-primary/20">Join</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
