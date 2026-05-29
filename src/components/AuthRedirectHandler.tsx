'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * Handles redirection for public auth pages (login/signup).
 * Logged-in users are redirected to the dashboard.
 */
export function AuthRedirectHandler() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // If a logged-in user hits login or signup, send them to dashboard
      if (pathname === '/login' || pathname === '/signup') {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
