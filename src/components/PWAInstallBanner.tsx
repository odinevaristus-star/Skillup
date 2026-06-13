'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PWAInstallBanner Component
 * 
 * Provides an interactive prompt for users to install the application as a PWA.
 * Features:
 * - Listens for 'beforeinstallprompt' to show native install dialog.
 * - Provides manual instructions as a fallback via a small tagline change.
 * - Auto-dismisses after 8 seconds of inactivity.
 * - Persistently hides once dismissed using localStorage.
 */
export function PWAInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed or in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. Check if user previously dismissed it
    const isDismissed = localStorage.getItem('pwa-dismissed') === 'true';
    if (isDismissed) return;

    // 3. Listen for the native install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Native prompt is available, so show the banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Fallback: Show the banner after 2 seconds for visibility
    const timer = setTimeout(() => {
      if (!isDismissed && !isStandalone) {
        setIsVisible(true);
      }
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
      // Fallback: Show instructions if native install prompt isn't available
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
      <div className="bg-white border shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[2rem] p-4 max-w-md mx-auto pointer-events-auto flex items-center gap-4 relative overflow-hidden">
        
        {/* Left side: Icon */}
        <div className="shrink-0">
          <img 
            src="/icon-192-new.png" 
            alt="SkillUp" 
            style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} 
          />
        </div>

        {/* Middle: App Name & Tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-sm md:text-base tracking-tight truncate text-foreground">SkillUp</h3>
            <Sparkles className="h-3 w-3 text-primary" />
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight truncate">
            {showInstructions ? "Tap browser menu ⋮ then Add to Home Screen" : "Campus Freelance Marketplace"}
          </p>
        </div>

        {/* Right side: Button and X */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleInstall}
            className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-5 bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}