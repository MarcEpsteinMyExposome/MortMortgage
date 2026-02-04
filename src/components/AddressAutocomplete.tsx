import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useDebounce } from '../hooks/useDebounce'

export interface ParsedAddress {
  street: string
  city: string
  state: string
  zip: string
  county?: string
}

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: ParsedAddress) => void
  placeholder?: string
  className?: string
  error?: string
  disabled?: boolean
}

/**
 * AddressAutocomplete - A reusable address autocomplete component
 * Uses Google Places API (via proxy) to provide address suggestions
 * with full keyboard navigation and mobile-friendly dropdown.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing address...',
  className = '',
  error,
  disabled = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [apiAvailable, setApiAvailable] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedValue = useDebounce(value, 300)

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    if (!apiAvailable || debouncedValue.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    let cancelled = false

    async function fetchSuggestions() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(debouncedValue)}`
        )

        if (!res.ok) {
          // API not available (no key or error), fall back to manual entry
          if (res.status === 503 || res.status === 500) {
            setApiAvailable(false)
          }
          setSuggestions([])
          return
        }

        const data = await res.json()

        if (!cancelled) {
          if (data.predictions && Array.isArray(data.predictions)) {
            setSuggestions(data.predictions)
            setIsOpen(data.predictions.length > 0)
            setSelectedIndex(-1)
          } else if (Array.isArray(data)) {
            setSuggestions(data)
            setIsOpen(data.length > 0)
            setSelectedIndex(-1)
          } else {
            setSuggestions([])
          }
        }
      } catch {
        // Network error or API unavailable - fall back to manual entry
        if (!cancelled) {
          setApiAvailable(false)
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [debouncedValue, apiAvailable])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('li')
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const handleSelect = useCallback(async (prediction: PlacePrediction) => {
    setLoading(true)
    setIsOpen(false)
    setSelectedIndex(-1)

    try {
      const res = await fetch(
        `/api/places/details?place_id=${encodeURIComponent(prediction.place_id)}`
      )

      if (!res.ok) {
        // Fallback: use the description as the street address
        onChange(prediction.description)
        setLoading(false)
        return
      }

      const details = await res.json()

      if (details.street) {
        onChange(details.street)
        onSelect({
          street: details.street,
          city: details.city || '',
          state: details.state || '',
          zip: details.zip || '',
          county: details.county
        })
      } else {
        // If parsing failed, just use the description
        onChange(prediction.description)
      }
    } catch {
      // On error, just use the description as fallback
      onChange(prediction.description)
    } finally {
      setLoading(false)
    }
  }, [onChange, onSelect])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break

      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break

      case 'Tab':
        // Allow tab to close dropdown and move focus
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, suggestions, selectedIndex, handleSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    // Reset API availability check when user starts typing again
    if (!apiAvailable && e.target.value.length > 0) {
      setApiAvailable(true)
    }
  }

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const inputClassName = `input ${error ? 'border-red-500' : ''} ${className}`.trim()

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={inputClassName}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto scrollbar-thin"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                px-4 py-3 cursor-pointer transition-colors duration-100
                flex items-start gap-2
                ${index === selectedIndex
                  ? 'bg-primary-50 text-primary-900'
                  : 'hover:bg-gray-50 text-gray-900'
                }
                ${index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''}
              `}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {/* Location pin icon */}
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  index === selectedIndex ? 'text-primary-500' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>

              <div className="flex-1 min-w-0">
                {suggestion.structured_formatting ? (
                  <>
                    <div className="font-medium truncate">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </>
                ) : (
                  <div className="truncate">{suggestion.description}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Helper text for keyboard navigation */}
      {isOpen && suggestions.length > 0 && (
        <div className="sr-only" aria-live="polite">
          {suggestions.length} suggestions available. Use up and down arrows to navigate, Enter to select.
        </div>
      )}
    </div>
  )
}
