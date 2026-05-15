
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Loader2, MessageSquare, Briefcase, UserCheck, CheckCircle2, Clock } from "lucide-react"
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
      // Assuming 'n' has an 'id' property from useCollection which maps Firestore docs
      // Note: useCollection docs usually include their ID as 'id'
      const id = (n as any).id
      if (id) {
        batch.update(doc(db, "notifications", id), { read: true })
      }
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
      case 'status': return <CheckCircle2 className="h-5 w-5 text-orange-500" />
      default: return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">Manage your alerts and project updates.</p>
        </div>
        {notifications && notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="rounded-xl font-bold">
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
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
                >
                  <div className="p-3 rounded-xl bg-muted/50 shrink-0">
                    {getIcon(notif.type || 'system')}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-bold ${!notif.read ? 'text-primary' : ''}`}>{notif.title}</p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-3">
                      {notif.link && (
                        <Link href={notif.link}>
                          <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary" onClick={() => markAsRead(notif.id)}>
                            View Details
                          </Button>
                        </Link>
                      )}
                      {!notif.read && (
                        <Button 
                          variant="ghost" 
                          className="p-0 h-auto text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => markAsRead(notif.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="bg-primary h-2 w-2 p-0 rounded-full shrink-0 mt-2" />
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
              <p className="max-w-xs mx-auto mt-2">You don't have any notifications right now.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
