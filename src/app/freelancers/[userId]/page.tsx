'use client';

import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Clock,
  Share2,
  User,
  PlusCircle,
  Quote,
  Briefcase,
  Play,
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase"
import { doc, collection, query, where, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function FreelancerProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const userRef = useMemoFirebase(() => {
    if (!db || !userId) return null
    return doc(db, "users", userId as string)
  }, [db, userId])

  const { data: profile, loading: profileLoading } = useDoc(userRef)

  // Fetch reviews for this freelancer
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !userId) return null
    return query(collection(db, "reviews"), where("freelancerId", "==", userId))
  }, [db, userId])
  const { data: reviews, loading: reviewsLoading } = useCollection(reviewsQuery)

  // Check if current user has hired this freelancer (completed job)
  const hiredQuery = useMemoFirebase(() => {
    if (!db || !currentUser?.uid || !userId) return null
    return query(
      collection(db, "jobs"), 
      where("clientId", "==", currentUser.uid),
      where("freelancerId", "==", userId),
      where("status", "==", "completed")
    )
  }, [db, currentUser?.uid, userId])
  const { data: pastJobs } = useCollection(hiredQuery)
  const canReview = pastJobs && pastJobs.length > 0 && currentUser?.uid !== userId

  const handleMessage = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/freelancers/${userId}`)
      return
    }
    router.push(`/dashboard/messages?userId=${userId}`)
  }

  const handleBooking = () => {
    if (!currentUser) {
      router.push(`/login?redirect=/freelancers/${userId}`)
      return
    }
    toast({ title: "Booking Request Sent", description: "The professional will reach out to confirm." })
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!db || !currentUser || !userId || isSubmittingReview) return

    setIsSubmittingReview(true)
    const reviewData = {
      freelancerId: userId,
      clientId: currentUser.uid,
      clientName: currentUser.displayName || "Anonymous Client",
      rating: reviewRating,
      text: reviewText,
      createdAt: serverTimestamp()
    }

    try {
      await addDoc(collection(db, "reviews"), reviewData)
      
      // Update freelancer's aggregate rating (simplified for prototype)
      if (profile) {
        const currentTotal = (profile.rating || 0) * (profile.completedJobs || 0)
        const newCount = (profile.completedJobs || 0) + 1
        const newRating = (currentTotal + reviewRating) / newCount
        
        await updateDoc(doc(db, "users", userId as string), {
          rating: newRating,
          completedJobs: newCount,
          updatedAt: serverTimestamp()
        })
      }

      toast({ title: "Review submitted!", description: "Thank you for your feedback." })
      setShowReviewModal(false)
      setReviewText("")
      setReviewRating(5)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit review." })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const formatPriceRange = (price: any) => {
    if (!price) return "Negotiable"
    const trimmed = price.toString().trim()
    if (trimmed.toLowerCase() === 'negotiable') return "Negotiable"
    
    if (/^\d+$/.test(trimmed)) {
      return `NGN ${parseInt(trimmed).toLocaleString()}`
    }
    
    return trimmed
  }

  const getFallbackIcon = () => {
    if (profile?.gender === 'female') return <User className="h-10 w-10 md:h-16 md:w-16 text-pink-500" />
    if (profile?.gender === 'male') return <User className="h-10 w-10 md:h-16 md:w-16 text-blue-500" />
    return <User className="h-10 w-10 md:h-16 md:w-16 text-primary" />
  }

  const getFallbackBg = () => {
    if (profile?.gender === 'female') return "bg-pink-100"
    if (profile?.gender === 'male') return "bg-blue-100"
    return "bg-primary/10"
  }

  if (profileLoading || reviewsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12 border-none shadow-2xl rounded-[3rem]">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Profile not found</h2>
          <Button onClick={() => router.push("/freelancers")} className="w-full h-14 rounded-2xl font-bold text-lg">
            Back to Search
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navbar />
      
      <div className="bg-card border-b pt-8 pb-12 md:pt-16 md:pb-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2 hover:bg-primary/5 text-primary font-bold rounded-xl h-10 md:h-12 px-3 md:px-4 text-xs md:text-sm">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Search</span><span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2 md:gap-4">
              {canReview && (
                <Button onClick={() => setShowReviewModal(true)} className="gap-2 font-bold rounded-xl h-10 md:h-12 px-3 md:px-4 text-xs md:text-sm">
                  <PlusCircle className="h-4 w-4" /> Review
                </Button>
              )}
              <Button variant="outline" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 border-muted-foreground/20 hover:border-primary transition-colors">
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start text-center md:text-left">
            <div className="relative shrink-0">
              <Avatar className="w-24 h-24 md:w-40 md:h-40 border-4 md:border-8 border-background shadow-xl md:shadow-2xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden">
                <AvatarImage src={profile.avatarUrl || ""} />
                <AvatarFallback className={cn("flex items-center justify-center h-full w-full", getFallbackBg())}>
                  {getFallbackIcon()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-8 h-8 md:w-12 md:h-12 border-4 md:border-8 border-card rounded-full shadow-2xl flex items-center justify-center",
                profile.isAvailable !== false ? "bg-green-500" : "bg-destructive"
              )}>
                 <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-4 md:space-y-8">
              <div className="space-y-2 md:space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-tight">{profile.fullName}</h1>
                  <Badge className={cn("border-none font-bold text-[8px] md:text-[10px] uppercase tracking-widest px-3 md:px-4 py-1 rounded-full", profile.isAvailable !== false ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive")}>
                    {profile.isAvailable !== false ? "Available Now" : "Busy"}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 text-sm md:text-xl text-muted-foreground font-bold tracking-tight">
                  <span>{profile.title || "Professional Expert"}</span>
                  {profile.department && (
                    <span className="flex items-center gap-2 text-primary/70">
                      <GraduationCap className="h-4 w-4 md:h-6 md:w-6" /> {profile.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 md:gap-4 w-full justify-center md:justify-start pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleMessage}
                  className="flex-1 md:flex-none gap-2 h-11 md:h-14 px-5 md:px-8 border-muted-foreground/20 text-foreground hover:bg-muted/50 rounded-xl md:rounded-[1.25rem] font-bold text-xs md:text-base"
                >
                  <MessageSquare className="h-4 w-4 md:h-5 md:w-5" /> Message
                </Button>
                <Button 
                  onClick={handleBooking}
                  className="flex-1 md:flex-none h-11 md:h-14 px-6 md:px-10 font-bold text-xs md:text-base rounded-xl md:rounded-[1.25rem] shadow-xl md:shadow-2xl md:shadow-primary/30"
                >
                  Book Session
                </Button>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 md:gap-x-10 gap-y-4 pt-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-yellow-500/10 rounded-xl md:rounded-2xl"><Star className="h-4 w-4 md:h-6 md:w-6 text-yellow-500 fill-current" /></div>
                  <div className="text-left">
                    <p className="text-sm md:text-xl font-black">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{profile.completedJobs || 0} reviews</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl"><Clock className="h-4 w-4 md:h-6 md:w-6 text-primary" /></div>
                  <div className="text-left">
                    <p className="text-sm md:text-xl font-black">Top Speed</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Fast Response</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 md:p-3 bg-green-500/10 rounded-xl md:rounded-2xl"><ShieldCheck className="h-4 w-4 md:h-6 md:w-6 text-green-500" /></div>
                  <div className="text-left">
                    <p className="text-sm md:text-xl font-black">Verified</p>
                    <p className="text-[8px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Identify</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 md:py-16 flex-1">
        <div className="grid lg:grid-cols-3 gap-12 md:gap-16">
          <div className="lg:col-span-2 space-y-12 md:space-y-16">
            <section className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-3xl font-black tracking-tight">Biography</h2>
              <Card className="border-none shadow-sm rounded-2xl md:rounded-[2.5rem] bg-card p-6 md:p-10">
                <p className="text-muted-foreground text-sm md:text-xl leading-relaxed whitespace-pre-line font-medium">
                  {profile.bio || `Passionate professional dedicated to delivering high-quality solutions. Specialized in ${profile.title || 'their craft'}.`}
                </p>
              </Card>
            </section>

            <section className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-3xl font-black tracking-tight">Expertise</h2>
              <div className="flex flex-wrap gap-2 md:gap-4">
                {profile.skills?.map((skill: string) => (
                  <div key={skill} className="px-4 py-2 md:px-8 md:py-4 text-xs md:text-base font-bold bg-white border-2 border-muted hover:border-primary transition-all rounded-xl md:rounded-[1.25rem] shadow-sm flex items-center gap-2 md:gap-3">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary opacity-30" />
                    {skill}
                  </div>
                ))}
              </div>
            </section>

            {/* Portfolio Section */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <section className="space-y-6 md:space-y-8">
                <h2 className="text-xl md:text-3xl font-black tracking-tight">Work Portfolio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {profile.portfolio.map((item: any) => (
                    <PortfolioCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-3xl font-black tracking-tight">Client Reviews</h2>
                <Badge variant="secondary" className="rounded-full px-3 py-0.5 text-[10px] md:text-xs">{reviews?.length || 0} Total</Badge>
              </div>

              <div className="grid gap-4 md:gap-6">
                {reviews && reviews.length > 0 ? reviews.map((rev: any) => (
                  <Card key={rev.id} className="border-none shadow-sm rounded-2xl md:rounded-[2rem] bg-card p-6 md:p-8 group hover:shadow-md transition-all">
                    <div className="flex gap-4 md:gap-6">
                      <Avatar className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl border-2 border-muted shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary font-black uppercase text-[10px] md:text-xs">
                          {rev.clientName?.substring(0, 2) || "CL"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm md:text-lg">{rev.clientName}</h4>
                            <div className="flex gap-0.5 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("h-3 w-3 md:h-3.5 md:w-3.5", i < rev.rating ? "text-yellow-500 fill-current" : "text-muted opacity-30")} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {rev.createdAt ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                        <div className="relative">
                          <Quote className="absolute -left-1 -top-1 md:-left-2 md:-top-2 h-5 w-5 md:h-8 md:w-8 text-primary/5 -z-10" />
                          <p className="text-muted-foreground text-xs md:text-base font-medium italic leading-relaxed">"{rev.text}"</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="text-center py-16 md:py-24 bg-muted/20 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-muted">
                    <Star className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground opacity-10 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-bold">No reviews yet</h3>
                    <p className="text-muted-foreground text-xs md:text-sm mt-1">Ready for their first verified campus review.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 md:space-y-8">
            <Card className="border-none shadow-xl md:shadow-2xl rounded-2xl md:rounded-[3rem] overflow-hidden md:sticky md:top-28 bg-white border">
              <CardHeader className="bg-primary text-primary-foreground p-6 md:p-10">
                <p className="text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-70">Price Range</p>
                <CardTitle className="text-2xl md:text-4xl font-black flex items-center gap-2 md:gap-3">
                  <Landmark className="h-6 w-6 md:h-8 md:w-8" /> {formatPriceRange(profile.priceRange)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-10 space-y-4 md:space-y-6">
                <Button className="w-full h-12 md:h-16 text-sm md:text-xl font-bold rounded-xl md:rounded-2xl shadow-lg md:shadow-xl shadow-primary/20" onClick={handleMessage}>
                  Start Collaboration
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 max-w-lg border-none shadow-2xl">
          <DialogHeader className="space-y-2 md:space-y-4">
            <DialogTitle className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2 md:gap-3">
              <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 fill-current" /> Rate & Review
            </DialogTitle>
            <DialogDescription className="text-xs md:text-base font-medium leading-relaxed">
              How was your experience working with {profile.fullName}? Your feedback helps the campus community.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-6 md:space-y-8 py-2 md:py-4">
            <div className="space-y-2 md:space-y-4 text-center">
              <Label className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-60">Overall Rating</Label>
              <div className="flex justify-center gap-2 md:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 md:h-10 md:w-10 transition-colors", 
                        star <= reviewRating ? "text-yellow-500 fill-current" : "text-muted-foreground/20"
                      )} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reviewText" className="font-bold text-[10px] md:text-xs uppercase tracking-widest opacity-60">Your Review</Label>
              <Textarea 
                id="reviewText"
                placeholder="Share details of your experience..." 
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                className="min-h-[100px] md:min-h-[150px] rounded-xl md:rounded-2xl border-none bg-muted/50 p-4 md:p-6 text-sm md:text-base font-medium focus-visible:ring-primary"
              />
            </div>

            <DialogFooter className="pt-2 md:pt-4">
              <Button 
                type="submit" 
                disabled={isSubmittingReview || !reviewText.trim()}
                className="w-full h-12 md:h-16 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PortfolioCard({ item }: { item: any }) {
  const images = item.images || (item.imageUrl ? [item.imageUrl] : [])
  const [currentIdx, setCurrentIdx] = useState(0)

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIdx((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <Card className="group overflow-hidden border-none shadow-sm bg-card rounded-2xl md:rounded-[2rem] flex flex-col h-full">
      <div className="aspect-video relative overflow-hidden bg-muted group/gallery">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentIdx]} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
            {images.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-white/80" onClick={prevImage}>
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-white/80" onClick={nextImage}>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 md:gap-1.5 px-1.5 md:py-1 bg-black/30 rounded-full">
                  {images.map((_: any, i: number) => (
                    <div 
                      key={i} 
                      className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-all", i === currentIdx ? "bg-white w-2 md:w-3" : "bg-white/50")} 
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/20" />
          </div>
        )}
        {item.videoLink && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="lg" 
              className="rounded-full h-12 w-12 md:h-16 md:w-16 bg-white text-primary hover:bg-white/90 shadow-2xl"
              onClick={() => window.open(item.videoLink, '_blank')}
            >
              <Play className="h-5 w-5 md:h-8 md:w-8 fill-current" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-6 md:p-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-3 md:mb-4">
          <div className="flex flex-wrap gap-1 md:gap-1.5">
            {item.skills?.map((s: string) => (
              <Badge key={s} variant="secondary" className="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] uppercase font-black tracking-widest">{s}</Badge>
            ))}
          </div>
          {item.videoLink && (
            <button 
              onClick={() => window.open(item.videoLink, '_blank')}
              className="p-1.5 md:p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          )}
        </div>
        <h3 className="text-base md:text-xl font-bold mb-2 md:mb-3">{item.title}</h3>
        <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed flex-1">
          {item.description}
        </p>
      </div>
    </Card>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  )
}
