'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // 1. Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Check if user previously dismissed it
    const isDismissed = localStorage.getItem('pwa-dismissed') === 'true';
    if (isDismissed) return;

    // 3. Capture the native install prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Show the banner after a short delay (2 seconds)
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    // 5. Auto-dismiss after 5 seconds of visibility if no interaction
    const autoDismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, 7000); // 2s (initial delay) + 5s (display time)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(showTimer);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the native install prompt
      deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } else {
      // Fallback: Show manual instructions for iOS/other browsers
      toast({
        title: "Installation Guide",
        description: "To install: Tap the share/menu icon and select 'Add to Home Screen'.",
        duration: 5000,
      });
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Never show again if user dismissed it
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[200] animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out pointer-events-none">
      <div className="bg-card border-2 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-4 flex items-center justify-between gap-4 max-w-md mx-auto backdrop-blur-xl bg-card/95 pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 p-2 text-white">
              <Smartphone className="h-full w-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <p className="font-black text-sm tracking-tight">Install SkillUp App</p>
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 leading-none">Best on mobile</p>
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
