
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
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
  FileText
} from "lucide-react"
import { useAuth, useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, where, doc } from "firebase/firestore"

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile } = useDoc(userDocRef)
  const isFreelancer = profile?.role !== 'customer'

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("read", "==", false)
    )
  }, [db, user?.uid])

  const { data: unreadMessages } = useCollection(unreadMessagesQuery)

  const unreadNotificationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    )
  }, [db, user?.uid])

  const { data: unreadNotifications } = useCollection(unreadNotificationsQuery)

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ...(isFreelancer ? [
      { label: "Find Work", href: "/jobs", icon: Search },
      { label: "My Proposals", href: "/dashboard/jobs", icon: FileText },
    ] : [
      { label: "Hire Talent", href: "/freelancers", icon: Users },
      { label: "My Jobs", href: "/dashboard/jobs", icon: Briefcase },
    ]),
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: unreadMessages?.length || 0 },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: unreadNotifications?.length || 0 },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ]

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 border-r bg-card h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tighter text-primary">SkillUp</span>
        </Link>
      </div>
      
      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn(
              "flex items-center justify-between px-3 py-2 rounded-lg transition-colors group mb-1",
              pathname === item.href 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}>
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  pathname === item.href ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                )}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t space-y-2">
        {!isFreelancer && (
          <Link href="/dashboard/jobs/post">
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
              <PlusCircle className="h-4 w-4" /> Post a Job
            </button>
          </Link>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
