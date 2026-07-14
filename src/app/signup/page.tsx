'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Briefcase, User, Loader2, Chrome, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<string>('');
  const [primarySkill, setPrimarySkill] = useState('');
  
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Role required",
        description: "Please select Client or Freelancer"
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: "Gender required",
        description: "Please select your gender"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 1. Send verification email
      await sendEmailVerification(result.user);

      // 2. Save user data to Firestore
      const userData = {
        uid: result.user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        gender: gender,
        roles: ['client', 'freelancer'],
        activeRole: selectedRole,
        skills: selectedRole === 'freelancer' ? [primarySkill] : [],
        title: selectedRole === 'freelancer' ? primarySkill || 'Professional Freelancer' : 'Project Client',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAvailable: true,
        completedJobs: 0,
        rating: null
      };

      await setDoc(doc(db, "users", result.user.uid), userData);
      
      toast({
        title: "Account created!",
        description: "We've sent a verification link to your email."
      });
      
      // Redirect to verification instructions instead of dashboard
      router.push("/verify-email");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message
      });
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      toast({
        variant: "destructive",
        title: "Role required",
        description: "Please select Client or Freelancer"
      });
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        fullName: user.displayName || '',
        email: user.email,
        activeRole: selectedRole,
        roles: ['client', 'freelancer'],
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      router.replace('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      toast({ 
        variant: "destructive",
        title: 'Google login failed',
        description: 'Please try again.' 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden rounded-[2.5rem]">
          <CardHeader className="space-y-4 text-center pb-8 border-b">
            <CardTitle className="text-4xl font-black tracking-tighter">Join SkillUp</CardTitle>
            <CardDescription className="text-lg font-medium">
              {!selectedRole ? "Choose your account type" : `Sign up as a ${selectedRole}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-10 p-8">
            {!selectedRole ? (
              <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className="flex flex-col items-center p-8 border-4 rounded-[2rem] transition-all relative overflow-hidden group border-muted bg-card hover:border-primary/30"
                >
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-black mb-2">I am a Client</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-60">I want to hire talent</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('freelancer')}
                  className="flex flex-col items-center p-8 border-4 rounded-[2rem] transition-all relative overflow-hidden group border-muted bg-card hover:border-primary/30"
                >
                  <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mb-6">
                    <Briefcase className="h-10 w-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-black mb-2">I am a Freelancer</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-60">I want to work</p>
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedRole(null)}
                  className="mb-4 gap-2 text-muted-foreground hover:text-primary font-bold"
                >
                  <ArrowLeft className="h-4 w-4" /> Change role
                </Button>

                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2.5">
                      <Label htmlFor="firstName" className="font-bold">First Name</Label>
                      <Input id="firstName" placeholder="John" required className="h-12 rounded-xl" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="lastName" className="font-bold">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required className="h-12 rounded-xl" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <Label className="font-bold">Select Gender</Label>
                    <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                      <div className="flex items-center space-x-2 bg-muted/30 px-6 py-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="male" id="signup-male" />
                        <Label htmlFor="signup-male" className="cursor-pointer font-bold">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-muted/30 px-6 py-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="female" id="signup-female" />
                        <Label htmlFor="signup-female" className="cursor-pointer font-bold">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid gap-2.5">
                    <Label htmlFor="email" className="font-bold">Email address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" required className="h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} />
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
                    <Input id="password" type="password" required className="h-12 rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button className="w-full h-14 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20" type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {isLoading ? 'Creating account...' : 'Start My Journey'}
                  </Button>
                </form>

                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground font-bold">Or quick join with</span>
                    </div>
                  </div>
                  <Button variant="outline" className="h-14 w-full rounded-2xl font-bold" onClick={handleGoogleLogin}>
                    <Chrome className="mr-2 h-5 w-5 text-primary" /> Continue with Google
                  </Button>
                </div>
              </div>
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
