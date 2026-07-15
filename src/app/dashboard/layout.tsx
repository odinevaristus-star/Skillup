'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!user.emailVerified) {
        // Force redirect unverified users to the verification page
        router.replace('/verify-email');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  // Double-check verification before rendering protected content
  if (!user || !user.emailVerified) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 lg:hidden border-b bg-background">
          <Navbar />
        </header>
        <main className="flex-1 p-6 md:p-10">
          <div className="container mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
