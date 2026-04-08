import * as React from "react"
import { HiOutlineCheck, HiOutlineChevronUpDown } from "react-icons/hi2"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  onSearchChange?: (searchQuery: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

const LISTBOX_ID = "combobox-listbox"

export function Combobox({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const optionRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map())
  const selectedOptionValueRef = React.useRef<string | null>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const query = searchQuery.toLowerCase().trim()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    )
  }, [options, searchQuery])

  const selectedOption = options.find((option) => option.value === value)

  // Check for duplicate values in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      const valueCounts = new Map<string, number>()
      options.forEach((option) => {
        valueCounts.set(option.value, (valueCounts.get(option.value) || 0) + 1)
      })
      const duplicates = Array.from(valueCounts.entries()).filter(
        ([, count]) => count > 1
      )
      if (duplicates.length > 0) {
        console.warn(
          `Combobox: Duplicate option values detected:`,
          duplicates.map(([val]) => val)
        )
      }
    }
  }, [options])

  // Reset highlighted index when filtered options change
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  // Update selected option ref when value changes
  React.useEffect(() => {
    selectedOptionValueRef.current = value || null
  }, [value])

  // Auto-focus search input when popover opens and scroll to selected
  React.useEffect(() => {
    if (open && searchInputRef.current) {
      // Small delay to ensure popover is fully rendered
      timeoutRef.current = setTimeout(() => {
        searchInputRef.current?.focus()
        // Scroll selected option into view
        if (selectedOptionValueRef.current) {
          const selectedEl = optionRefs.current.get(
            selectedOptionValueRef.current
          )
          selectedEl?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          })
        }
      }, 100)
    } else if (!open) {
      // Clear search when closing
      setSearchQuery("")
      setHighlightedIndex(-1)
    }

    // Cleanup timeout on unmount or when open changes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [open])

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return

      const enabledOptions = filteredOptions.filter((opt) => !opt.disabled)
      if (enabledOptions.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          e.stopPropagation()
          setHighlightedIndex((prev) => {
            const next = prev < enabledOptions.length - 1 ? prev + 1 : 0
            // Scroll highlighted option into view
            const optionValue = enabledOptions[next]?.value
            if (optionValue) {
              const optionEl = optionRefs.current.get(optionValue)
              optionEl?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }
            return next
          })
          break

        case "ArrowUp":
          e.preventDefault()
          e.stopPropagation()
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : enabledOptions.length - 1
            // Scroll highlighted option into view
            const optionValue = enabledOptions[next]?.value
            if (optionValue) {
              const optionEl = optionRefs.current.get(optionValue)
              optionEl?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }
            return next
          })
          break

        case "Enter":
          e.preventDefault()
          e.stopPropagation()
          if (highlightedIndex >= 0 && highlightedIndex < enabledOptions.length) {
            const selected = enabledOptions[highlightedIndex]
            if (selected && !selected.disabled) {
              onValueChange?.(selected.value)
              setOpen(false)
              setSearchQuery("")
              // Return focus to trigger
              setTimeout(() => {
                triggerRef.current?.focus()
              }, 0)
            }
          }
          break

        case "Home":
          e.preventDefault()
          e.stopPropagation()
          setHighlightedIndex(0)
          enabledOptions[0] &&
            optionRefs.current
              .get(enabledOptions[0].value)
              ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
          break

        case "End":
          e.preventDefault()
          e.stopPropagation()
          const lastIndex = enabledOptions.length - 1
          setHighlightedIndex(lastIndex)
          enabledOptions[lastIndex] &&
            optionRefs.current
              .get(enabledOptions[lastIndex].value)
              ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
          break

        case "Escape":
          e.preventDefault()
          e.stopPropagation()
          setOpen(false)
          // Return focus to trigger
          setTimeout(() => {
            triggerRef.current?.focus()
          }, 0)
          break

        default:
          // Allow typing in search input
          if (e.target === searchInputRef.current) {
            return
          }
          // Focus search input for other keys
          searchInputRef.current?.focus()
          break
      }
    },
    [open, filteredOptions, highlightedIndex, onValueChange]
  )

  // Handle popover close - return focus to trigger
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (!newOpen) {
        // Return focus to trigger when closing
        setTimeout(() => {
          triggerRef.current?.focus()
        }, 0)
      }
    },
    []
  )

  // Get highlighted option ID for aria-activedescendant
  const highlightedOptionId = React.useMemo(() => {
    if (highlightedIndex < 0) return undefined
    const enabledOptions = filteredOptions.filter((opt) => !opt.disabled)
    const highlighted = enabledOptions[highlightedIndex]
    return highlighted ? `option-${highlighted.value}` : undefined
  }, [filteredOptions, highlightedIndex])

  // Get unique key for option (handle duplicates)
  const getOptionKey = React.useCallback(
    (option: ComboboxOption, index: number) => {
      // Check if value is unique in options array
      const valueCount = options.filter((opt) => opt.value === option.value)
        .length
      return valueCount > 1 ? `${option.value}-${index}` : option.value
    },
    [options]
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={LISTBOX_ID}
          aria-haspopup="listbox"
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <HiOutlineChevronUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[400px] flex flex-col"
        align="start"
        onOpenAutoFocus={(e) => {
          // Prevent default focus behavior, we'll handle it manually
          e.preventDefault()
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b flex-shrink-0">
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              const newQuery = e.target.value
              setSearchQuery(newQuery)
              onSearchChange?.(newQuery)
            }}
            className="h-9"
            aria-label="Search options"
            aria-controls={LISTBOX_ID}
            onKeyDown={(e) => {
              // Prevent closing popover when typing in search
              e.stopPropagation()
              // Handle navigation keys
              if (
                ["ArrowDown", "ArrowUp", "Enter", "Home", "End"].includes(
                  e.key
                )
              ) {
                handleKeyDown(e)
              } else if (e.key === "Escape") {
                e.preventDefault()
                setOpen(false)
                setTimeout(() => {
                  triggerRef.current?.focus()
                }, 0)
              }
            }}
          />
        </div>
        <div
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Options"
          aria-activedescendant={highlightedOptionId}
          className="overflow-y-auto overflow-x-hidden flex-1 min-h-0"
          style={{
            maxHeight: "calc(400px - 60px)",
          }}
        >
          {filteredOptions.length === 0 ? (
            <div
              className="px-4 py-6 text-left text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {searchQuery.trim() ? (
                <>
                  {emptyText}
                  <div className="mt-1 text-xs">
                    No results for &quot;{searchQuery}&quot;
                  </div>
                </>
              ) : (
                emptyText
              )}
            </div>
          ) : (
            <div className="p-1" role="group">
              {filteredOptions.map((option, index) => {
                const optionId = `option-${option.value}`
                const isHighlighted =
                  highlightedIndex >= 0 &&
                  filteredOptions
                    .filter((opt) => !opt.disabled)
                    .findIndex((opt) => opt.value === option.value) ===
                    highlightedIndex
                const isSelected = value === option.value

                return (
                  <button
                    key={getOptionKey(option, index)}
                    ref={(el) => {
                      if (el) {
                        optionRefs.current.set(option.value, el)
                        if (isSelected) {
                          selectedOptionValueRef.current = option.value
                        }
                      } else {
                        optionRefs.current.delete(option.value)
                        if (isSelected && selectedOptionValueRef.current === option.value) {
                          selectedOptionValueRef.current = null
                        }
                      }
                    }}
                    type="button"
                    role="option"
                    id={optionId}
                    aria-selected={isSelected}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left",
                      option.disabled && "pointer-events-none opacity-50",
                      isSelected && "bg-accent",
                      isHighlighted && "bg-accent"
                    )}
                    onClick={() => {
                      if (!option.disabled) {
                        onValueChange?.(option.value)
                        setOpen(false)
                        setSearchQuery("")
                        // Return focus to trigger
                        setTimeout(() => {
                          triggerRef.current?.focus()
                        }, 0)
                      }
                    }}
                    disabled={option.disabled}
                  >
                    <HiOutlineCheck
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col min-w-0 flex-1 text-left">
                      <span className="truncate text-left">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate text-left">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {filteredOptions.length > 0 && searchQuery.trim() && (
            <div
              className="px-4 py-2 text-xs text-muted-foreground border-t"
              role="status"
              aria-live="polite"
            >
              {filteredOptions.length} result
              {filteredOptions.length !== 1 ? "s" : ""} found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
