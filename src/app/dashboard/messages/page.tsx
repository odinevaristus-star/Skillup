
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase"
import { collection, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Send, MessageSquare, Loader2, Phone, Video, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Fetch all chats involving current user
  const chatsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null
    // In a real app, you'd have a 'chats' collection.
    // Here we'll derive active conversations from messages.
    return query(
      collection(db, "messages"),
      where("chatId", ">=", ""), // Dummy to satisfy query structure if needed, or use a proper chat schema
      orderBy("timestamp", "desc")
    )
  }, [db, user?.uid])

  const { data: messages, loading: messagesLoading } = useCollection(chatsQuery)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !db || !selectedChat || !newMessage.trim()) return

    setIsSending(true)
    const msgData = {
      senderId: user.uid,
      receiverId: selectedChat.id,
      text: newMessage,
      timestamp: serverTimestamp(),
      read: false,
      chatId: [user.uid, selectedChat.id].sort().join("_")
    }

    addDoc(collection(db, "messages"), msgData)
      .then(() => setNewMessage(""))
      .catch(async () => {
        const error = new FirestorePermissionError({
          path: "messages",
          operation: "create",
          requestResourceData: msgData
        })
        errorEmitter.emit("permission-error", error)
      })
      .finally(() => setIsSending(false))
  }

  // Derived chats for sidebar
  const contacts = [
    { id: "demo-1", name: "Sarah Miller", role: "Product Designer", avatar: "https://picsum.photos/seed/sarah/100/100", status: "online" },
    { id: "demo-2", name: "David Chen", role: "Full Stack Dev", avatar: "https://picsum.photos/seed/david/100/100", status: "away" },
    { id: "demo-3", name: "Emily Blunt", role: "Project Manager", avatar: "https://picsum.photos/seed/emily/100/100", status: "offline" }
  ]

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
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedChat(contact)}
                className={cn(
                  "w-full p-4 flex items-center gap-3 transition-colors hover:bg-muted/50",
                  selectedChat?.id === contact.id && "bg-primary/5 border-l-4 border-primary"
                )}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                    contact.status === 'online' ? 'bg-green-500' : contact.status === 'away' ? 'bg-yellow-500' : 'bg-slate-300'
                  )} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-bold truncate">{contact.name}</p>
                    <span className="text-[10px] text-muted-foreground">12:45</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex-1 flex flex-col border-none shadow-sm overflow-hidden">
        {selectedChat ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback>{selectedChat.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selectedChat.name}</p>
                  <p className="text-[10px] text-green-500 font-medium">Active now</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/10">
              <div className="space-y-4">
                {messages?.filter(m => 
                  (m.senderId === user?.uid && m.receiverId === selectedChat.id) ||
                  (m.senderId === selectedChat.id && m.receiverId === user?.uid)
                ).map((msg, i) => (
                  <div key={i} className={cn(
                    "flex",
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] p-4 rounded-2xl shadow-sm text-sm",
                      msg.senderId === user?.uid 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-white text-foreground rounded-tl-none"
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
                {messages?.length === 0 && (
                  <div className="text-center py-20">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                    <p className="text-sm text-muted-foreground">Start a conversation with {selectedChat.name}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  className="flex-1 h-12 rounded-xl"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
            <h3 className="text-xl font-bold text-foreground">Select a chat to start messaging</h3>
            <p className="max-w-xs mt-2">Connect with clients and freelancers in real-time to discuss project details.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
