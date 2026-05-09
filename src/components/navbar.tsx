"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { Sun, Moon, Zap, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-primary">SkillUp</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/jobs" className="text-sm font-medium hover:text-primary transition-colors">Find Work</Link>
            <Link href="/freelancers" className="text-sm font-medium hover:text-primary transition-colors">Hire Talent</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'amoled' && <Zap className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleTheme('light')}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('dark')}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleTheme('amoled')}>AMOLED</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}