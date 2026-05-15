
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit } from "firebase/firestore"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, CheckCircle2, MessageSquare, Briefcase, Trash2 } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    )
  }, [db, user?.uid])

  const { data: notifications, loading } = useCollection(notificationsQuery)

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'job': return <Briefcase className="h-5 w-5 text-green-500" />
      default: return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your job applications and messages.</p>
        </div>
        <Button variant="outline" size="sm">Mark all as read</Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications?.length ? (
            <div className="divide-y">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-6 flex items-start gap-4 hover:bg-muted/20 transition-colors">
                  <div className="p-3 rounded-xl bg-muted/50">
                    {getIcon(notif.type || 'system')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{notif.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    {notif.link && (
                      <Link href={notif.link}>
                        <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">View details</Button>
                      </Link>
                    )}
                  </div>
                  {!notif.read && (
                    <Badge className="bg-primary h-2 w-2 p-0 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Bell className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-foreground">All caught up!</h3>
              <p className="max-w-xs mx-auto mt-2">You don't have any new notifications at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
