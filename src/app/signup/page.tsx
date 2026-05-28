
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, User, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ARTISAN_SKILLS, DIGITAL_SKILLS } from '@/lib/constants';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primarySkill, setPrimarySkill] = useState('');
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Ensure role is selected
    if (!selectedRole) {
      toast({ 
        variant: 'destructive', 
        title: 'Role Required', 
        description: 'Please select "Client" or "Freelancer" to continue.' 
      });
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Create User in Firebase Auth
      console.log("Step 1: Starting Auth creation for", email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Step 2: Get UID
      const user = userCredential.user;
      const uid = user.uid;
      console.log("Step 2: Auth success. UID:", uid);

      const fullName = `${firstName} ${lastName}`;
      const skillType = selectedRole === 'freelancer' ? (DIGITAL_SKILLS.includes(primarySkill) ? 'Digital' : 'Artisan') : '';

      const userData = {
        uid: uid,
        firstName,
        lastName,
        fullName,
        email,
        role: selectedRole, // Using state variable directly as requested
        skills: primarySkill ? [primarySkill] : [],
        skillType,
        bio: '',
        title: selectedRole === 'freelancer' ? primarySkill || 'Professional Freelancer' : 'Project Client',
        avatarUrl: user.photoURL || `https://picsum.photos/seed/${uid}/128/128`,
        createdAt: serverTimestamp(),
        rating: null,
        completedJobs: 0,
        totalHires: 0,
        isAvailable: true,
      };

      // Step 3: Save to Firestore
      console.log("Step 3: Saving user with role: " + selectedRole);
      console.log("Full User Data:", userData);
      await setDoc(doc(db, 'users', uid), userData);
      
      // Optional but good for consistency
      try {
        await updateProfile(user, { displayName: fullName });
      } catch (pErr) {
        console.warn("Profile display name update failed, but continuing...", pErr);
      }

      // Step 4: Final Redirect
      console.log("Step 4: Firestore success. Redirecting to dashboard...");
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error("Signup error occurred:", error);
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden rounded-[2.5rem]">
          <CardHeader className="space-y-4 text-center pb-8 border-b">
            <CardTitle className="text-4xl font-black tracking-tighter">Join SkillUp</CardTitle>
            <CardDescription className="text-lg font-medium">Select your professional path to get started</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-10 p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={cn(
                  'flex flex-col items-center p-8 border-4 rounded-[2rem] transition-all relative overflow-hidden group',
                  selectedRole === 'client'
                    ? 'border-primary bg-primary/5 shadow-2xl scale-[1.02]'
                    : 'border-muted bg-card hover:border-primary/30'
                )}
              >
                {selectedRole === 'client' && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-black mb-2">I am a Client</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-60">I want to hire talent</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('freelancer')}
                className={cn(
                  'flex flex-col items-center p-8 border-4 rounded-[2rem] transition-all relative overflow-hidden group',
                  selectedRole === 'freelancer'
                    ? 'border-primary bg-primary/5 shadow-2xl scale-[1.02]'
                    : 'border-muted bg-card hover:border-primary/30'
                )}
              >
                {selectedRole === 'freelancer' && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-xl font-black mb-2">I am a Freelancer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-60">I want to work</p>
              </button>
            </div>

            {selectedRole && (
              <form onSubmit={handleSignup} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid gap-2.5">
                    <Label htmlFor="firstName" className="font-bold">First Name</Label>
                    <Input id="firstName" placeholder="John" required className="h-12 rounded-xl bg-muted/30 border-none px-4" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="grid gap-2.5">
                    <Label htmlFor="lastName" className="font-bold">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required className="h-12 rounded-xl bg-muted/30 border-none px-4" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="email" className="font-bold">Email address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required className="h-12 rounded-xl bg-muted/30 border-none px-4" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {selectedRole === 'freelancer' && (
                  <div className="grid gap-2.5">
                    <Label htmlFor="primarySkill" className="font-bold">Primary Skill / Category</Label>
                    <SearchableSelect 
                      value={primarySkill} 
                      onValueChange={setPrimarySkill} 
                      placeholder="Select or type your expertise"
                    />
                  </div>
                )}
                <div className="grid gap-2.5">
                  <Label htmlFor="password" className="font-bold">Password</Label>
                  <Input id="password" type="password" required className="h-12 rounded-xl bg-muted/30 border-none px-4" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox id="terms" required className="mt-1" />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed font-medium">
                    By creating an account, you agree to our <Link href="#" className="text-primary hover:underline font-bold">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
                  </label>
                </div>
                <Button className="w-full h-14 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20" type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {isLoading ? 'Creating account...' : 'Start My Journey'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-center gap-2 p-8 border-t bg-muted/10">
            <span className="text-sm text-muted-foreground font-medium">Already have an account?</span>
            <Link href="/login" className="text-sm font-black text-primary hover:underline uppercase tracking-widest">Log in</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
