'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * Global component to handle automatic redirects based on authentication state.
 * Redirects logged-in users away from /login and /signup to /dashboard.
 * Redirects logged-out users away from /dashboard to /login.
 */
export function AuthRedirectHandler() {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // User is logged in. 
      // Redirect away from public auth pages and the landing page to the dashboard.
      if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
        router.replace('/dashboard');
      }
    } else {
      // User is logged out.
      // Redirect away from protected dashboard pages to login.
      if (pathname.startsWith('/dashboard')) {
        router.replace('/login');
      }
      // Logged out users stay on / (homepage) or other public pages
    }
  }, [user, loading, pathname, router]);

  return null;
}
