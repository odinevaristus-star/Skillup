'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed or in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Check if user previously dismissed it in this session (or permanently)
    const isDismissed = localStorage.getItem('pwa-dismissed') === 'true';
    if (isDismissed) return;

    // 3. Listen for the native install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Show the banner after a short delay for visibility
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible && !showInstructions) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showInstructions]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    } else {
      // Fallback for browsers that don't support/haven't fired the prompt
      setShowInstructions(true);
      // Keep it visible longer if showing instructions
      setTimeout(() => setShowInstructions(false), 5000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[200] animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out pointer-events-none">
      <div className="bg-white border shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] p-5 max-w-md mx-auto pointer-events-auto relative overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
            <img 
              src="https://picsum.photos/seed/skillup-icon/192/192" 
              alt="SkillUp" 
              className="w-full h-full rounded-2xl object-cover"
            />
          </div>
          
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-black text-lg tracking-tight">SkillUp</h3>
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight mb-4">
              Campus Freelance Marketplace
            </p>

            {showInstructions ? (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-in zoom-in-95 duration-300">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Tap the browser menu <span className="font-black">⋮</span> or <span className="font-black">⎙</span> then "Add to Home Screen"</span>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-11 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Add to Home Screen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
