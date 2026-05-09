import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Navbar } from "@/components/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
  )
}