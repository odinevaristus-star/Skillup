
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ARTISAN_SKILLS, DIGITAL_SKILLS } from "@/lib/constants"

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select or type...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const allSkills = React.useMemo(() => [...ARTISAN_SKILLS, ...DIGITAL_SKILLS], [])

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue)
    setOpen(false)
    setSearch("")
  }

  // Check if search exactly matches any existing skill
  const isExactMatch = allSkills.some(s => s.toLowerCase() === search.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-14 rounded-2xl bg-muted/30 border-none px-6 font-medium text-left", !value && "text-muted-foreground", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl overflow-hidden border-none shadow-2xl z-[150]">
        <Command className="bg-card">
          <CommandInput 
            placeholder="Search or type custom skill..." 
            value={search}
            onValueChange={setSearch}
            className="h-12"
          />
          <CommandList className="max-h-[350px]">
            {/* "Use Custom" option shown whenever user types something new and not an exact match */}
            {search.length > 0 && !isExactMatch && (
              <CommandGroup heading="Custom Skill">
                <CommandItem
                  value={search}
                  onSelect={() => handleSelect(search)}
                  className="rounded-xl mx-1 cursor-pointer flex items-center gap-2 bg-primary/5"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-bold text-primary">Use: "{search}"</span>
                </CommandItem>
              </CommandGroup>
            )}
            
            <CommandEmpty className="p-4 text-center text-sm text-muted-foreground">
              No results found. Type to add a custom skill.
            </CommandEmpty>
            
            <CommandGroup heading="Artisan Skills">
              {ARTISAN_SKILLS.map((skill) => (
                <CommandItem
                  key={skill}
                  value={skill}
                  onSelect={handleSelect}
                  className="rounded-xl mx-1 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === skill ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {skill}
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator className="my-1" />
            
            <CommandGroup heading="Digital Skills">
              {DIGITAL_SKILLS.map((skill) => (
                <CommandItem
                  key={skill}
                  value={skill}
                  onSelect={handleSelect}
                  className="rounded-xl mx-1 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === skill ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {skill}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
