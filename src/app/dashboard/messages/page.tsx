"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp, or, limit, doc, getDoc } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Send, MessageSquare, Loader2, Phone, Video, Info, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"

export default function MessagesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get("userId")

  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [loadingContact, setLoadingContact] = useState(false)

  // 1. Fetch all messages involving the current user to build the "Conversations" list
  const allUserMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "messages"),
      or(where("senderId", "==", user.uid), where("receiverId", "==", user.uid)),
      orderBy("timestamp", "desc")
    )
  }, [db, user?.uid])

  const { data: allMessages, loading: messagesLoading } = useCollection(allUserMessagesQuery)

  // 2. Derive unique contacts from messages
  const conversations = useMemo(() => {
    if (!allMessages || !user?.uid) return []
    const contactsMap = new Map()
    
    allMessages.forEach((msg: any) => {
      const otherUserId = msg.senderId === user.uid ? msg.receiverId : msg.senderId
      if (!contactsMap.has(otherUserId)) {
        contactsMap.set(otherUserId, {
          id: otherUserId,
          lastMessage: msg.text,
          timestamp: msg.timestamp
        })
      }
    })
    return Array.from(contactsMap.values())
  }, [allMessages, user?.uid])

  // 3. If a userId is passed in URL, fetch their profile to start a chat
  useEffect(() => {
    if (targetUserId && db && user?.uid && targetUserId !== user.uid) {
      setLoadingContact(true)
      getDoc(doc(db, "users", targetUserId))
        .then((snapshot) => {
          if (snapshot.exists()) {
            setSelectedChatUser({ id: snapshot.id, ...snapshot.data() })
          }
        })
        .finally(() => setLoadingContact(false))
    }
  }, [targetUserId, db, user?.uid])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !selectedChatUser || !newMessage.trim()) return

    setIsSending(true)
    const chatId = [user.uid, selectedChatUser.id].sort().join("_")
    const msgData = {
      senderId: user.uid,
      receiverId: selectedChatUser.id,
      text: newMessage,
      timestamp: serverTimestamp(),
      read: false,
      chatId: chatId
    }

    addDoc(collection(db, "messages"), msgData)
      .then(() => {
        // Create notification for receiver
        addDoc(collection(db, "notifications"), {
          userId: selectedChatUser.id,
          title: "New Message",
          message: `${user.displayName} sent you a message.`,
          link: `/dashboard/messages?userId=${user.uid}`,
          type: "message",
          read: false,
          createdAt: serverTimestamp()
        })
        setNewMessage("")
      })
      .catch(async (err) => {
        const error = new FirestorePermissionError({
          path: "messages",
          operation: "create",
          requestResourceData: msgData
        })
        errorEmitter.emit("permission-error", error)
      })
      .finally(() => setIsSending(false))
  }

  // Current active chat messages
  const activeChatQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !selectedChatUser?.id) return null
    const chatId = [user.uid, selectedChatUser.id].sort().join("_")
    return query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc")
    )
  }, [db, user?.uid, selectedChatUser?.id])

  const { data: activeMessages } = useCollection(activeChatQuery)

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-80 flex flex-col border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-background h-10 rounded-xl" placeholder="Search chats..." />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {messagesLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : conversations.length > 0 ? (
              conversations.map((chat: any) => (
                <ConversationItem 
                  key={chat.id} 
                  chat={chat} 
                  db={db}
                  isActive={selectedChatUser?.id === chat.id}
                  onClick={() => setSelectedChatUser({ id: chat.id })} 
                />
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet.</div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden bg-card">
        {selectedChatUser ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <ChatHeader userProfile={selectedChatUser} db={db} />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/5">
              <div className="space-y-4">
                {activeMessages?.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex",
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl shadow-sm text-sm",
                      msg.senderId === user?.uid 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white border text-foreground rounded-tl-none"
                    )}>
                      {msg.text}
                      <p className={cn(
                        "text-[10px] mt-1 opacity-70",
                        msg.senderId === user?.uid ? "text-right" : "text-left"
                      )}>
                        {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  className="flex-1 h-12 rounded-xl"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={isSending}>
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            {loadingContact ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <>
                <h3 className="text-xl font-bold text-foreground">Select a chat to start messaging</h3>
                <p className="max-w-xs mt-2 text-sm leading-relaxed">Connect with clients and freelancers in real-time to discuss project details and deadlines.</p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function ChatHeader({ userProfile, db }: { userProfile: any, db: any }) {
  const [profile, setProfile] = useState<any>(userProfile)
  
  useEffect(() => {
    if (db && userProfile.id && !userProfile.fullName) {
      getDoc(doc(db, "users", userProfile.id)).then(snap => {
        if (snap.exists()) setProfile(snap.data())
      })
    }
  }, [db, userProfile.id])

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile?.avatarUrl} />
        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
      </Avatar>
      <div>
        <p className="font-bold">{profile?.fullName || "Loading..."}</p>
        <p className="text-[10px] text-green-500 font-medium">Active now</p>
      </div>
    </div>
  )
}

function ConversationItem({ chat, db, isActive, onClick }: { chat: any, db: any, isActive: boolean, onClick: () => void }) {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (db && chat.id) {
      getDoc(doc(db, "users", chat.id)).then(snap => {
        if (snap.exists()) setProfile(snap.data())
      })
    }
  }, [db, chat.id])

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 flex items-center gap-3 transition-colors hover:bg-muted/50",
        isActive && "bg-primary/5 border-l-4 border-primary"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border shadow-sm">
          <AvatarImage src={profile?.avatarUrl} />
          <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-green-500" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <p className="font-bold truncate text-sm">{profile?.fullName || "..."}</p>
          <span className="text-[10px] text-muted-foreground">
            {chat.timestamp ? new Date(chat.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
      </div>
    </button>
  )
}
