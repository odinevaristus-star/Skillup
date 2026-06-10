import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { AuthRedirectHandler } from "@/components/AuthRedirectHandler";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'SkillUp - Campus Freelance Marketplace',
  description: 'Connect with skilled students for any job. From artisan trades to digital projects, SkillUp is your portal to campus services.',
  openGraph: {
    title: 'SkillUp - Campus Freelance Marketplace',
    description: 'Connect with skilled students for any job. From artisan trades to digital projects, SkillUp is your portal to campus services.',
    url: 'https://skillup-app-eta.vercel.app',
    siteName: 'SkillUp',
    images: [
      {
        url: 'https://picsum.photos/seed/skillup-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'SkillUp - Campus Freelance Marketplace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillUp - Campus Freelance Marketplace',
    description: 'Connect with skilled students for any job.',
    images: ['https://picsum.photos/seed/skillup-og/1200/630'],
  },
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
