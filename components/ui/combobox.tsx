"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    value: string
    label: React.ReactNode | string
    keywords?: string[] // Additional search keywords
}

export interface ComboboxProps {
    options: ComboboxOption[]
    value?: string | string[]
    onChange?: (value: string | string[]) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
    multiple?: boolean
    disabled?: boolean
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyText = "No option found.",
    className,
    multiple = false,
    disabled = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
        multiple
            ? Array.isArray(value)
                ? value
                : value
                    ? [value]
                    : []
            : value
                ? [String(value)]
                : []
    )

    // Update internal state when prop changes
    React.useEffect(() => {
        if (multiple) {
            setSelectedValues(Array.isArray(value) ? value : value ? [value] : [])
        } else {
            setSelectedValues(value ? [String(value)] : [])
        }
    }, [value, multiple])

    const handleSelect = (currentValue: string) => {
        let newValues: string[]

        if (multiple) {
            // Multi-select logic
            if (selectedValues.includes(currentValue)) {
                newValues = selectedValues.filter((v) => v !== currentValue)
            } else {
                newValues = [...selectedValues, currentValue]
            }
            setSelectedValues(newValues)
            onChange?.(newValues)
        } else {
            // Single-select logic
            newValues = currentValue === selectedValues[0] ? [] : [currentValue]
            setSelectedValues(newValues)
            onChange?.(newValues[0] || "")
            setOpen(false)
        }
    }

    const getDisplayText = () => {
        if (selectedValues.length === 0) return placeholder

        if (multiple && selectedValues.length > 1) {
            // Show first category icon + count
            const firstOption = options.find((opt) => opt.value === selectedValues[0])
            if (firstOption && typeof firstOption.label !== "string") {
                return (
                    <div className="flex items-center gap-1.5">
                        {firstOption.label}
                        <span className="text-xs text-muted-foreground ml-0.5">+{selectedValues.length - 1}</span>
                    </div>
                )
            }
            return `${selectedValues.length} selected`
        }

        const selectedOption = options.find((opt) => opt.value === selectedValues[0])
        if (selectedOption) {
            // Return the label as-is (including React nodes with icons)
            return selectedOption.label
        }

        return placeholder
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                    disabled={disabled}
                >
                    <span className="truncate">{getDisplayText()}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-white border shadow-md" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9 focus-visible:ring-0 focus-visible:ring-offset-0" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                    keywords={option.keywords}
                                    className="text-sm py-2"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
