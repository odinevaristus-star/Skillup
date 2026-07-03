
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, Sparkles } from "lucide-react"
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
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue)
    setOpen(false)
    setInputValue("")
  }

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
            value={inputValue}
            onValueChange={setInputValue}
            className="h-12"
          />
          <CommandList className="max-h-[350px]">
            <CommandEmpty className="p-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground font-medium px-1">No exact matches found.</p>
                <button
                  type="button"
                  className="w-full text-left p-3 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary/20 transition-all"
                  onClick={() => handleSelect(inputValue)}
                >
                  <Sparkles className="h-4 w-4" />
                  Use custom: "{inputValue}"
                </button>
              </div>
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
