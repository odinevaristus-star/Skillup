
"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useUser, useFirestore, useDoc, errorEmitter, FirestorePermissionError } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { X, Plus, Save, Loader2, Landmark, User, MapPin, Briefcase, Play, Edit, Trash, Upload, ExternalLink, Image as ImageIcon, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  skills: string[];
  images: string[];
  videoLink?: string;
}

export default function ProfileManagement() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isPrompted = searchParams.get("complete") === "true"

  const userDocRef = useMemo(() => {
    if (!db || !user?.uid) return null
    return doc(db, "users", user.uid)
  }, [db, user?.uid])

  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  // Profile fields
  const [fullName, setFullName] = useState("")
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [gender, setGender] = useState("")
  const [department, setDepartment] = useState("")
  const [location, setLocation] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Portfolio fields
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [currentPortfolioItem, setCurrentPortfolioItem] = useState<Partial<PortfolioItem>>({})
  const [portfolioSkillInput, setPortfolioSkillInput] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Completion calculation
  const completionScore = useMemo(() => {
    if (!profile && !user) return 0
    let score = 0
    if (user?.photoURL || profile?.avatarUrl) score += 20
    if (bio) score += 20
    if (skills.length > 0) score += 20
    if (title) score += 10
    if (portfolio.length > 0) score += 30
    return score
  }, [profile, user, bio, skills, title, portfolio])

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "")
      setTitle(profile.title || "")
      setBio(profile.bio || "")
      setGender(profile.gender || "")
      setDepartment(profile.department || "")
      setLocation(profile.location || "")
      setPriceRange(profile.priceRange || "")
      setIsAvailable(profile.isAvailable !== undefined ? profile.isAvailable : true)
      setSkills(profile.skills || [])
      
      const processedPortfolio = (profile.portfolio || []).map((item: any) => ({
        ...item,
        skills: item.skills || [],
        images: item.images || []
      }))
      setPortfolio(processedPortfolio)
    }
  }, [profile])

  useEffect(() => {
    if (isPrompted) {
      toast({
        title: "Almost there!",
        description: "Complete your freelancer profile to start finding work.",
        duration: 6000
      })
    }
  }, [isPrompted, toast])

  const addSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSkill = newSkill.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleOpenPortfolioModal = (item?: PortfolioItem) => {
    if (item) {
      setCurrentPortfolioItem({ ...item })
    } else {
      setCurrentPortfolioItem({
        id: crypto.randomUUID(),
        title: "",
        description: "",
        skills: [],
        images: [],
        videoLink: ""
      })
    }
    setPortfolioSkillInput("")
    setShowPortfolioModal(true)
  }

  const addPortfolioSkill = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = portfolioSkillInput.trim()
    if (trimmed) {
      const currentSkills = currentPortfolioItem.skills || []
      if (!currentSkills.includes(trimmed)) {
        setCurrentPortfolioItem({
          ...currentPortfolioItem,
          skills: [...currentSkills, trimmed]
        })
      }
      setPortfolioSkillInput("")
    }
  }

  const removePortfolioSkill = (skillToRemove: string) => {
    const currentSkills = currentPortfolioItem.skills || []
    setCurrentPortfolioItem({
      ...currentPortfolioItem,
      skills: currentSkills.filter(s => s !== skillToRemove)
    })
  }

  const handleSavePortfolioItem = () => {
    if (!currentPortfolioItem.title || !currentPortfolioItem.images || currentPortfolioItem.images.length === 0 || !currentPortfolioItem.skills || currentPortfolioItem.skills.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide a title, at least one skill, and at least one image of your work."
      })
      return
    }

    const updatedPortfolio = [...portfolio]
    const index = updatedPortfolio.findIndex(i => i.id === currentPortfolioItem.id)

    if (index > -1) {
      updatedPortfolio[index] = currentPortfolioItem as PortfolioItem
    } else {
      updatedPortfolio.push(currentPortfolioItem as PortfolioItem)
    }

    setPortfolio(updatedPortfolio)
    setShowPortfolioModal(false)
    setCurrentPortfolioItem({})
  }

  const handleDeletePortfolioItem = (id: string) => {
    setPortfolio(portfolio.filter(i => i.id !== id))
    toast({
      title: "Portfolio item removed",
      description: "Remember to save your profile to persist changes."
    })
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const currentImages = currentPortfolioItem.images || []
    if (currentImages.length >= 5) {
      toast({
        variant: "destructive",
        title: "Limit reached",
        description: "You can only upload up to 5 images per project."
      })
      return
    }

    setIsUploadingImage(true)
    try {
      const compressedBase64 = await compressImage(file)
      
      setCurrentPortfolioItem({ 
        ...currentPortfolioItem, 
        images: [...currentImages, compressedBase64] 
      })

      toast({
        title: "Image added",
        description: "Successfully optimized and added to project."
      })
    } catch (error: any) {
      console.error("Image processing error:", error)
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: "Could not process image. Please try again."
      })
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removePortfolioImage = (idx: number) => {
    const currentImages = currentPortfolioItem.images || []
    setCurrentPortfolioItem({
      ...currentPortfolioItem,
      images: currentImages.filter((_, i) => i !== idx)
    })
  }

  const handleSave = () => {
    if (!user?.uid || !db) return
    setIsSaving(true)
    
    const data = {
      fullName,
      title,
      bio,
      gender,
      department,
      location,
      priceRange,
      isAvailable,
      skills,
      portfolio,
      updatedAt: new Date().toISOString()
    };

    setDoc(doc(db, "users", user.uid), data, { merge: true })
      .then(() => {
        toast({
          title: "Profile updated",
          description: "Your professional details and portfolio have been saved successfully."
        })
        router.push("/dashboard")
      })
      .catch(async (serverError: any) => {
        setIsSaving(false)
        
        if (serverError?.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${user.uid}`,
            operation: 'write',
            requestResourceData: data,
          }));
        } else {
          toast({
            variant: "destructive",
            title: "Error saving profile",
            description: serverError.message || "Please check your connectivity and try again."
          })
        }
      });
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const getFallbackIcon = () => {
    if (gender === 'female') return <User className="h-10 w-10 text-pink-500" />
    if (gender === 'male') return <User className="h-10 w-10 text-blue-500" />
    return <User className="h-10 w-10 text-primary" />
  }

  const getFallbackBg = () => {
    if (gender === 'female') return "bg-pink-100"
    if (gender === 'male') return "bg-blue-100"
    return "bg-primary/10"
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Professional Profile</h1>
          <p className="text-muted-foreground text-lg font-medium">Enhance your visibility and attract top-tier clients.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-4 bg-card px-6 py-3 rounded-2xl border shadow-sm">
            <Label htmlFor="availability" className="font-bold text-sm">Active & Available</Label>
            <Switch 
              id="availability" 
              checked={isAvailable} 
              onCheckedChange={setIsAvailable} 
            />
          </div>
          <div className="w-full max-w-[200px] space-y-1.5 px-1">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
              <span>Profile Strength</span>
              <span>{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-1.5" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Personal & Academic Info</CardTitle>
              <CardDescription>How you'll appear to potential clients.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="relative group shrink-0">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-muted shadow-2xl rounded-3xl overflow-hidden relative">
                    <AvatarImage src={user?.photoURL || profile?.avatarUrl || ""} />
                    <AvatarFallback className={cn("text-4xl font-bold flex items-center justify-center", getFallbackBg())}>
                      {getFallbackIcon()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-6 w-full">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="fullName" className="font-bold">Full Name</Label>
                      <Input 
                        id="fullName" 
                        className="h-12 rounded-xl"
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="title" className="font-bold">Professional Headline</Label>
                      <Input 
                        id="title" 
                        className="h-12 rounded-xl"
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Lead Brand Designer"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <Label className="font-bold">Gender</Label>
                    <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                      <div className="flex items-center space-x-2 bg-muted/30 px-6 py-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="cursor-pointer font-bold">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-muted/30 px-6 py-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="cursor-pointer font-bold">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="department" className="font-bold">Department / Course of Study</Label>
                      <Input 
                        id="department" 
                        className="h-12 rounded-xl"
                        value={department} 
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="location" className="font-bold">Location</Label>
                      <Input 
                        id="location" 
                        className="h-12 rounded-xl"
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Unizik, Awka"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="priceRange" className="font-bold text-primary flex items-center gap-2">
                        <Landmark className="h-4 w-4" /> Price Range (NGN)
                      </Label>
                      <Input 
                        id="priceRange" 
                        className="h-12 rounded-xl font-bold"
                        value={priceRange} 
                        onChange={(e) => setPriceRange(e.target.value)}
                        placeholder="e.g. 500 - 5,000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-2.5">
                <Label htmlFor="bio" className="font-bold">Professional Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={6} 
                  className="rounded-2xl resize-none p-4"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detail your experience, tools, and what makes your service unique..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-8">
              <CardTitle className="text-2xl">Skills & Specialized Tools</CardTitle>
              <CardDescription>Add the tags you want to be discovered for.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 group transition-all hover:bg-destructive/10 hover:text-destructive">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="opacity-40 group-hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
                {skills.length === 0 && <p className="text-sm text-muted-foreground italic font-medium">No skills showcased yet.</p>}
              </div>
              
              <div className="space-y-4">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Quick Add Skills</Label>
                <SearchableSelect 
                  value=""
                  onValueChange={(val) => {
                    if (val && !skills.includes(val)) setSkills([...skills, val])
                  }}
                  placeholder="Select a common skill..."
                  className="h-12 bg-muted/20"
                />
                
                <div className="relative flex gap-4 mt-4">
                  <Input 
                    placeholder="Or type a custom skill..." 
                    className="h-12 rounded-xl flex-1"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addSkill(e)
                    }}
                  />
                  <Button onClick={addSkill} type="button" variant="outline" size="icon" className="h-12 w-12 rounded-xl border-muted-foreground/20">
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden">
            <CardHeader className="p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Work Portfolio</CardTitle>
                <CardDescription>Showcase your best projects to clients.</CardDescription>
              </div>
              <Button onClick={() => handleOpenPortfolioModal()} className="rounded-xl font-bold gap-2">
                <Plus className="h-4 w-4" /> Add Work
              </Button>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {portfolio.map((item) => (
                    <Card key={item.id} className="group overflow-hidden border bg-muted/20 rounded-2xl relative">
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img 
                          src={item.images?.[0] || ""} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {item.images && item.images.length > 1 && (
                            <Badge className="bg-black/60 text-white border-none text-[10px] font-bold">+ {item.images.length - 1} more</Badge>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary" onClick={() => handleOpenPortfolioModal(item)} className="rounded-full">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive" onClick={() => handleDeletePortfolioItem(item.id)} className="rounded-full">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.skills?.slice(0, 2).map((s) => (
                            <Badge key={s} variant="outline" className="text-[8px] uppercase tracking-widest font-black">{s}</Badge>
                          ))}
                          {item.skills && item.skills.length > 2 && (
                            <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-black">+{item.skills.length - 2}</Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{item.description}</p>
                        {item.videoLink && (
                          <div className="mt-3 flex items-center gap-1.5 text-primary">
                            <Play className="h-3 w-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Video Included</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">Your portfolio is empty. Add your first project!</p>
                  <Button variant="link" onClick={() => handleOpenPortfolioModal()} className="mt-2 text-primary font-bold">Add Portfolio Item</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6">
            <Button className="h-14 px-12 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
              Update Profile & Portfolio
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showPortfolioModal} onOpenChange={setShowPortfolioModal}>
        <DialogContent className="rounded-[2rem] p-8 max-w-2xl border-none shadow-2xl z-[140] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" /> {currentPortfolioItem.id ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </DialogTitle>
            <DialogDescription className="text-base font-medium">
              Share a project you've completed to build trust with clients. Add up to 5 photos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2.5">
                <Label className="font-bold">Project Title</Label>
                <Input 
                  placeholder="e.g. Modern Brand Identity" 
                  value={currentPortfolioItem.title} 
                  onChange={(e) => setCurrentPortfolioItem({ ...currentPortfolioItem, title: e.target.value })}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="grid gap-2.5">
                <Label className="font-bold">Skills Used</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Photoshop, HTML" 
                    value={portfolioSkillInput} 
                    onChange={(e) => setPortfolioSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addPortfolioSkill()
                      }
                    }}
                    className="rounded-xl h-12 flex-1"
                  />
                  <Button type="button" onClick={addPortfolioSkill} variant="outline" className="h-12 rounded-xl px-4">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentPortfolioItem.skills?.map((s) => (
                    <Badge key={s} variant="secondary" className="px-3 py-1 rounded-lg flex items-center gap-1.5">
                      {s}
                      <button onClick={() => removePortfolioSkill(s)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2.5">
              <Label className="font-bold">Description</Label>
              <Textarea 
                placeholder="What was your role? What did you achieve?" 
                value={currentPortfolioItem.description} 
                onChange={(e) => setCurrentPortfolioItem({ ...currentPortfolioItem, description: e.target.value })}
                rows={3}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="grid gap-2.5">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Project Images ({currentPortfolioItem.images?.length || 0}/5)</Label>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Optimized for storage</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {currentPortfolioItem.images?.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border bg-muted/30">
                    <img src={img} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                    <button 
                      onClick={() => removePortfolioImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-2 left-2">
                       <Badge className="bg-black/50 text-white border-none text-[8px]">{idx === 0 ? 'Main' : idx + 1}</Badge>
                    </div>
                  </div>
                ))}

                {(currentPortfolioItem.images?.length || 0) < 5 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-muted/50 border-2 border-dashed border-muted flex flex-col items-center justify-center rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-[8px] font-bold text-primary animate-pulse">OPTIMIZING...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center px-2">Upload Photo</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>

            <div className="grid gap-2.5">
              <Label className="font-bold flex items-center gap-2">
                <Play className="h-4 w-4 text-primary fill-current" /> Video Link (Optional)
              </Label>
              <Input 
                placeholder="YouTube or Google Drive URL" 
                value={currentPortfolioItem.videoLink} 
                onChange={(e) => setCurrentPortfolioItem({ ...currentPortfolioItem, videoLink: e.target.value })}
                className="rounded-xl h-12"
              />
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button variant="ghost" onClick={() => setShowPortfolioModal(false)} className="rounded-xl font-bold h-12">Cancel</Button>
            <Button onClick={handleSavePortfolioItem} className="rounded-xl font-black px-10 h-12 shadow-xl shadow-primary/20">
              Save Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
