
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { Sun, Moon, Zap, User, LogOut, LayoutDashboard, Bell, MessageSquare, Users, Search, PlusCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { signOut } from "firebase/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { collection, query, where, doc } from "firebase/firestore"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile } = useDoc(userDocRef)
  const isFreelancer = profile?.role !== 'customer'

  const unreadNotificationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    )
  }, [db, user?.uid])

  const { data: unreadNotifications } = useCollection(unreadNotificationsQuery)

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("read", "==", false)
    )
  }, [db, user?.uid])

  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  const handleSignOut = async () => {
    await signOut(auth)
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">SkillUp</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {user && (
              <>
                {isFreelancer ? (
                  <Link href="/jobs" className="text-sm font-bold flex items-center gap-2 hover:text-primary transition-colors">
                    <Search className="h-4 w-4" /> Find Work
                  </Link>
                ) : (
                  <>
                    <Link href="/freelancers" className="text-sm font-bold flex items-center gap-2 hover:text-primary transition-colors">
                      <Users className="h-4 w-4" /> Hire Talent
                    </Link>
                    <Link href="/dashboard/jobs/post" className="text-sm font-bold flex items-center gap-2 hover:text-primary transition-colors">
                      <PlusCircle className="h-4 w-4" /> Post Job
                    </Link>
                  </>
                )}
              </>
            )}
            {!user && (
              <>
                <Link href="/freelancers" className="text-sm font-bold hover:text-primary transition-colors">Hire Talent</Link>
                <Link href="/jobs" className="text-sm font-bold hover:text-primary transition-colors">Find Work</Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'amoled' && <Zap className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('amoled')}>AMOLED</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <>
              <Link href="/dashboard/messages" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages && unreadMessages.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px] font-bold border-2 border-background">
                      {unreadMessages.length > 9 ? '9+' : unreadMessages.length}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/dashboard/notifications" className="relative">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold border-2 border-background">
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
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
                    <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-4">
                  <p className="text-sm font-bold leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1 capitalize">{profile?.role || 'Freelancer'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center p-3 cursor-pointer">
                    <LayoutDashboard className="mr-3 h-4 w-4 text-primary" /> <span className="font-medium">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center p-3 cursor-pointer">
                    <User className="mr-3 h-4 w-4 text-primary" /> <span className="font-medium">My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive p-3 cursor-pointer">
                  <LogOut className="mr-3 h-4 w-4" /> <span className="font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="font-bold">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="font-bold px-6">Join</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
