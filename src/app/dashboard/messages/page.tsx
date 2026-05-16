
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp, or, doc, getDoc, limit, updateDoc, writeBatch } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Send, MessageSquare, Loader2, Phone, Video, Info, User, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSearchParams, useRouter } from "next/navigation"

export default function MessagesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const targetUserId = searchParams.get("userId")
  const scrollRef = useRef<HTMLDivElement>(null)

  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [loadingContact, setLoadingContact] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  // 1. Fetch all messages involving the current user to build the "Conversations" list
  const allUserMessagesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    return query(
      collection(db, "messages"),
      or(where("senderId", "==", user.uid), where("receiverId", "==", user.uid)),
      orderBy("timestamp", "desc"),
      limit(200)
    )
  }, [db, user?.uid])

  const { data: allMessages, loading: messagesLoading } = useCollection(allUserMessagesQuery)

  // 2. Derive unique contacts from messages for the sidebar
  const conversations = useMemo(() => {
    if (!allMessages || !user?.uid) return []
    const contactsMap = new Map()
    
    allMessages.forEach((msg: any) => {
      const otherUserId = msg.senderId === user.uid ? msg.receiverId : msg.senderId
      if (!contactsMap.has(otherUserId)) {
        contactsMap.set(otherUserId, {
          id: otherUserId,
          lastMessage: msg.text,
          timestamp: msg.timestamp,
          read: msg.read,
          isMine: msg.senderId === user.uid
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
            setShowSidebar(false)
          }
        })
        .finally(() => setLoadingContact(false))
    }
  }, [targetUserId, db, user?.uid])

  // 4. Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [selectedChatUser, conversations])

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
          message: `${user.displayName || 'A user'} sent you a message: "${newMessage.substring(0, 30)}${newMessage.length > 30 ? '...' : ''}"`,
          link: `/dashboard/messages?userId=${user.uid}`,
          type: "message",
          read: false,
          createdAt: serverTimestamp()
        })
        setNewMessage("")
      })
      .catch(async (err) => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: "messages",
          operation: "create",
          requestResourceData: msgData
        }))
      })
      .finally(() => setIsSending(false))
  }

  // Current active chat messages listener
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

  // Mark messages as read when viewing a chat
  useEffect(() => {
    if (!db || !user?.uid || !selectedChatUser?.id || !activeMessages) return

    const unreadMessages = activeMessages.filter(m => m.receiverId === user.uid && !m.read)
    if (unreadMessages.length === 0) return

    const batch = writeBatch(db)
    unreadMessages.forEach(m => {
      // Find the ID. Note: useCollection docs usually include their ID as 'id'
      const id = (m as any).id
      if (id) {
        batch.update(doc(db, "messages", id), { read: true })
      }
    })
    batch.commit().catch(console.error)
  }, [db, user?.uid, selectedChatUser?.id, activeMessages])

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-0 lg:gap-6 bg-background rounded-[2rem] overflow-hidden shadow-xl border">
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "lg:w-96 flex flex-col border-r bg-card h-full transition-all",
        !showSidebar && "hidden lg:flex"
      )}>
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 bg-muted/50 border-none h-11 rounded-xl" placeholder="Search conversations..." />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-muted/30">
            {messagesLoading ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : conversations.length > 0 ? (
              conversations.map((chat: any) => (
                <ConversationItem 
                  key={chat.id} 
                  chat={chat} 
                  db={db}
                  isActive={selectedChatUser?.id === chat.id}
                  onClick={() => {
                    setSelectedChatUser({ id: chat.id })
                    setShowSidebar(false)
                    window.history.pushState(null, '', `/dashboard/messages?userId=${chat.id}`)
                  }} 
                />
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground space-y-4">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-8 w-8 opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground">No messages yet</p>
                  <p className="text-xs">Start a conversation from an expert's profile.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-card h-full transition-all",
        showSidebar && "hidden lg:flex"
      )}>
        {selectedChatUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden" 
                  onClick={() => setShowSidebar(true)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <ChatHeader userProfile={selectedChatUser} db={db} />
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Message Stream */}
            <ScrollArea className="flex-1 p-6 bg-muted/5" ref={scrollRef}>
              <div className="space-y-6">
                {activeMessages?.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col group",
                    msg.senderId === user?.uid ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] md:max-w-[70%] px-5 py-3 rounded-[1.5rem] shadow-sm text-sm leading-relaxed",
                      msg.senderId === user?.uid 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white border text-foreground rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] mt-1.5 text-muted-foreground font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                      {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-center max-w-5xl mx-auto">
                <Input 
                  placeholder="Write a message..." 
                  className="flex-1 h-14 rounded-2xl bg-muted/50 border-none px-6 text-base focus-visible:ring-primary"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all" 
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-6 w-6" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
            <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-8">
              <MessageSquare className="h-12 w-12 text-primary opacity-20" />
            </div>
            {loadingContact ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground">Initializing conversation...</p>
              </div>
            ) : (
              <div className="max-w-md space-y-4">
                <h3 className="text-3xl font-bold tracking-tight">Your Inbox</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Select a professional from your contacts or browse the marketplace to start discussing your next big project.
                </p>
                <div className="pt-6">
                  <Button 
                    variant="outline" 
                    className="rounded-2xl font-bold h-12 px-8 border-primary text-primary hover:bg-primary/5"
                    onClick={() => router.push('/freelancers')}
                  >
                    Browse Experts
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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
  }, [db, userProfile.id, userProfile.fullName])

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-11 w-11 border-2 border-muted shadow-sm rounded-xl">
        <AvatarImage src={profile?.avatarUrl} />
        <AvatarFallback className="bg-primary/10 text-primary font-bold">{profile?.fullName?.substring(0, 2).toUpperCase() || "..."}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col -space-y-0.5">
        <p className="font-bold text-base leading-tight">{profile?.fullName || "User"}</p>
        <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Now</p>
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
        "w-full p-6 flex items-center gap-4 transition-all hover:bg-muted/50 border-l-4 border-transparent",
        isActive && "bg-primary/5 border-primary shadow-inner"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-14 w-14 border shadow-sm rounded-2xl">
          <AvatarImage src={profile?.avatarUrl} />
          <AvatarFallback className="bg-muted text-muted-foreground font-bold">{profile?.fullName?.substring(0, 2).toUpperCase() || "..."}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-card bg-green-500" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-start mb-1.5">
          <p className="font-bold truncate text-base text-foreground">{profile?.fullName || "Loading..."}</p>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            {chat.timestamp ? new Date(chat.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-medium">
          {chat.isMine ? "You: " : ""}{chat.lastMessage}
        </p>
      </div>
      {!chat.read && !chat.isMine && (
        <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0" />
      )}
    </button>
  )
}
