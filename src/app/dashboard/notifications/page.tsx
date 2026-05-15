
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit, doc, updateDoc, writeBatch, getDocs } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, MessageSquare, Briefcase, UserCheck, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

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

  const handleMarkAllAsRead = async () => {
    if (!db || !user?.uid || !notifications) return

    const unread = notifications.filter(n => !n.read)
    if (unread.length === 0) return

    const batch = writeBatch(db)
    unread.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true })
    })

    batch.commit().catch(async () => {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: "notifications",
        operation: "update",
        requestResourceData: { read: true }
      }))
    })
  }

  const markAsRead = async (id: string) => {
    if (!db) return
    updateDoc(doc(db, "notifications", id), { read: true })
      .catch(async () => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: `notifications/${id}`,
          operation: "update",
          requestResourceData: { read: true }
        }))
      })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'job': return <Briefcase className="h-5 w-5 text-green-500" />
      case 'hire': return <UserCheck className="h-5 w-5 text-purple-500" />
      default: return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activities on SkillUp.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={!notifications?.some(n => !n.read)}>
          Mark all as read
        </Button>
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
                <div 
                  key={notif.id} 
                  className={`p-6 flex items-start gap-4 transition-colors ${!notif.read ? 'bg-primary/5' : 'hover:bg-muted/20'}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="p-3 rounded-xl bg-muted/50">
                    {getIcon(notif.type || 'system')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{notif.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
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
                    <Badge className="bg-primary h-2 w-2 p-0 rounded-full shrink-0" />
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
              <p className="max-w-xs mx-auto mt-2">You don't have any notifications at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
