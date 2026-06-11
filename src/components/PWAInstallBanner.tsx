'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Don't show if already installed or dismissed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isDismissed = localStorage.getItem('pwa-dismissed') === 'true';

    if (isStandalone || isDismissed) return;

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);

      // Auto-dismiss after 5 seconds if not interacted with
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[200] animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out pointer-events-none">
      <div className="bg-card border-2 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-4 flex items-center justify-between gap-4 max-w-md mx-auto backdrop-blur-xl bg-card/95 pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Smartphone className="text-white h-6 w-6 relative z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="font-black text-sm tracking-tight">Install SkillUp App</p>
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Add to home screen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleInstall}
            className="rounded-2xl font-black text-[10px] uppercase tracking-widest px-6 h-11 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Install
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="rounded-full h-11 w-11 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}