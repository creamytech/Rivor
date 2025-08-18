import * as React from "react"
import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
  placeholder?: string
  showShortcut?: boolean
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, onSearch, placeholder = "Search...", showShortcut = true, ...props }, ref) => {
    const [value, setValue] = React.useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      onSearch?.(newValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSearch?.(value)
      }
    }

    return (
      <div className="relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foam-60" />
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "glass w-full rounded-2xl border border-foam-20 bg-depth-100/80 px-10 py-2 text-sm",
              "placeholder:text-foam-60 focus:border-current-400 focus:outline-none focus:ring-2 focus:ring-current-400/20",
              "transition-all duration-200",
              className
            )}
            {...props}
          />
          {showShortcut && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-foam-20 bg-depth-200 px-1.5 font-mono text-xs font-medium text-foam-60">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          )}
        </div>
      </div>
    )
  }
)
Search.displayName = "Search"

export { Search }
