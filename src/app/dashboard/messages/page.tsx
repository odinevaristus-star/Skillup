
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp, or, doc, getDoc } from "firebase/firestore"
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
          timestamp: msg.timestamp,
          read: msg.read
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
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [selectedChatUser])

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
          message: `${user.displayName || 'Someone'} sent you a message.`,
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
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-0 lg:gap-6 bg-background rounded-3xl overflow-hidden shadow-2xl border">
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "lg:w-80 flex flex-col border-r bg-card h-full transition-all",
        !showSidebar && "hidden lg:flex"
      )}>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-4 tracking-tight">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-muted/30 border-none h-10 rounded-xl" placeholder="Search contacts..." />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-muted/50">
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
                  }} 
                />
              ))
            ) : (
              <div className="p-10 text-center text-muted-foreground text-sm space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-20" />
                <p>No conversations found.</p>
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
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Message Stream */}
            <ScrollArea className="flex-1 p-6 bg-muted/10" ref={scrollRef}>
              <div className="space-y-6">
                {activeMessages?.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col",
                    msg.senderId === user?.uid ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "max-w-[75%] px-5 py-3 rounded-[1.25rem] shadow-sm text-sm leading-relaxed",
                      msg.senderId === user?.uid 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-background border text-foreground rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] mt-1.5 text-muted-foreground font-medium px-1">
                      {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                <Input 
                  placeholder="Type your message..." 
                  className="flex-1 h-12 rounded-2xl bg-muted/30 border-none px-6 focus-visible:ring-primary"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20" 
                  disabled={isSending || !newMessage.trim()}
                >
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-8">
              <MessageSquare className="h-12 w-12 opacity-10" />
            </div>
            {loadingContact ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">Your Inbox</h3>
                <p className="max-w-xs mx-auto text-sm leading-relaxed">Select a professional from the list or browse freelancers to start a conversation about your project.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 rounded-xl font-bold"
                  onClick={() => router.push('/freelancers')}
                >
                  Find Talent
                </Button>
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
  }, [db, userProfile.id])

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 border-2 border-muted shadow-sm">
        <AvatarImage src={profile?.avatarUrl} />
        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
      </Avatar>
      <div className="flex flex-col -space-y-1">
        <p className="font-bold text-sm">{profile?.fullName || "Loading..."}</p>
        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
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
        "w-full p-5 flex items-center gap-4 transition-all hover:bg-muted/30 border-l-4 border-transparent",
        isActive && "bg-primary/5 border-primary"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 border shadow-sm rounded-xl">
          <AvatarImage src={profile?.avatarUrl} />
          <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card bg-green-500" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-start mb-1">
          <p className="font-bold truncate text-sm">{profile?.fullName || "..."}</p>
          <span className="text-[10px] text-muted-foreground font-medium">
            {chat.timestamp ? new Date(chat.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-medium">{chat.lastMessage}</p>
      </div>
    </button>
  )
}
