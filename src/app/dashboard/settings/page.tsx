"use client"

import { useState, useEffect, useMemo } from "react"
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Save, Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ClientSettings() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || profile.first_name || "")
      setLastName(profile.lastName || profile.last_name || "")
    }
  }, [profile])

  const handleSave = () => {
    if (!user?.uid || !db) return
    setIsSaving(true)
    
    const data = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, "users", user.uid), data, { merge: true })
      .then(() => {
        toast({
          title: "Settings updated",
          description: "Your information has been updated successfully."
        })
        // Force immediate redirect to dashboard to clear state and refresh data
        setTimeout(() => {
          window.location.replace("/dashboard");
        }, 300);
      })
      .catch(async (serverError) => {
        setIsSaving(false)
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${user.uid}`,
          operation: 'write',
          requestResourceData: data,
        }));
        toast({
          variant: "destructive",
          title: "Error saving changes",
          description: "Please check your permissions and try again."
        })
      });
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground text-lg font-medium mt-1">Manage your identity and preferences.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Basic Information
          </CardTitle>
          <CardDescription>Update how you appear to the community.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2.5">
              <Label htmlFor="firstName" className="font-bold">First Name</Label>
              <Input 
                id="firstName" 
                className="h-12 rounded-xl"
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
              />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="lastName" className="font-bold">Last Name</Label>
              <Input 
                id="lastName" 
                className="h-12 rounded-xl"
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
              />
            </div>
          </div>
          <div className="grid gap-2.5">
            <Label className="font-bold">Email Address</Label>
            <Input 
              value={user?.email || ""} 
              disabled 
              className="h-12 rounded-xl bg-muted/50 opacity-60 cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Email cannot be changed via settings</p>
          </div>
        </CardContent>
        <CardFooter className="p-8 border-t bg-muted/20">
          <Button className="ml-auto h-12 px-10 rounded-xl font-bold gap-2 shadow-xl shadow-primary/20" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
