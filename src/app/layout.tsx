import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";

export const metadata: Metadata = {
  title: 'SkillUp | Modern Freelance Marketplace',
  description: 'Connect with skilled freelancers for jobs and services on SkillUp.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <FirebaseClientProvider>
          <AuthRedirectHandler />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
