
'use client'
/**
 * @fileOverview Simplified debug dashboard to verify Firestore data integrity.
 */
import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Explicitly using the production instances
    const auth = getAuth()
    const db = getFirestore()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. User:', user?.uid);
      
      if (!user) {
        window.location.href = '/login'
        return
      }

      try {
        const docRef = doc(db, 'users', user.uid)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
          const data = snap.data()
          console.log('Firestore data retrieved:', data)
          setUserData(data)
        } else {
          console.error('No Firestore document found for UID:', user.uid)
          // Fallback if document is missing
          setUserData({ 
            firstName: user.email?.split('@')[0] || 'User', 
            role: 'PENDING SETUP' 
          })
        }
      } catch (e) {
        console.error('Error fetching Firestore document:', e)
        setUserData({ firstName: 'Error Loading', role: 'ERROR' })
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-bold text-muted-foreground animate-pulse">VERIFYING FIRESTORE DATA...</p>
      </div>
    )
  }

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-500">
      <div className="bg-card p-12 rounded-[2.5rem] border-4 border-primary/20 shadow-2xl">
        <h1 className="text-5xl font-black tracking-tighter mb-4">
          Hello, {userData?.firstName || userData?.first_name || 'User'}!
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Account Role:</span>
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            {userData?.role || 'NOT ASSIGNED'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-muted/30 p-8 rounded-3xl border border-dashed">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Raw Metadata</p>
          <pre className="text-[10px] overflow-auto max-h-40 bg-black/5 p-4 rounded-xl">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex flex-col justify-center">
          <p className="text-sm font-medium leading-relaxed">
            If you see your name above, the data loading is successful. Check the <b>Console</b> in your browser tools to see the full raw document details.
          </p>
        </div>
      </div>
    </div>
  )
}
