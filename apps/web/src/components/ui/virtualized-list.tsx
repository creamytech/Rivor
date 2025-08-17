"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  LoadingComponent?: React.ComponentType;
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  LoadingComponent,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Accessibility: Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const currentIndex = Math.floor(scrollTop / itemHeight);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, items.length - 1);
        container.scrollTop = nextIndex * itemHeight;
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        container.scrollTop = prevIndex * itemHeight;
        break;
      case 'Home':
        e.preventDefault();
        container.scrollTop = 0;
        break;
      case 'End':
        e.preventDefault();
        container.scrollTop = totalHeight - height;
        break;
      case 'PageDown':
        e.preventDefault();
        const pageDownIndex = Math.min(currentIndex + Math.floor(height / itemHeight), items.length - 1);
        container.scrollTop = pageDownIndex * itemHeight;
        break;
      case 'PageUp':
        e.preventDefault();
        const pageUpIndex = Math.max(currentIndex - Math.floor(height / itemHeight), 0);
        container.scrollTop = pageUpIndex * itemHeight;
        break;
    }
  }, [scrollTop, itemHeight, items.length, height, totalHeight]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600",
        "scrollbar-track-transparent",
        className
      )}
      style={{ height }}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label="Virtualized list"
      aria-setsize={items.length}
      aria-posinset={Math.floor(scrollTop / itemHeight) + 1}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          <AnimatePresence>
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <motion.div
                  key={actualIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: itemHeight }}
                  role="option"
                  aria-selected={false}
                  className="focus:bg-slate-100 dark:focus:bg-slate-800 focus:outline-none"
                >
                  {renderItem(item, actualIndex)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {loading && LoadingComponent && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <LoadingComponent />
        </div>
      )}
    </div>
  );
}

// Infinite scroll wrapper
interface InfiniteVirtualizedListProps<T> extends VirtualizedListProps<T> {
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore?: boolean;
}

export function InfiniteVirtualizedList<T>({
  items,
  hasMore,
  onLoadMore,
  loadingMore = false,
  ...props
}: InfiniteVirtualizedListProps<T>) {
  const handleScroll = useCallback((scrollTop: number) => {
    const { height, itemHeight } = props;
    const totalHeight = items.length * itemHeight;
    const scrollPercentage = scrollTop / (totalHeight - height);
    
    // Load more when user scrolls to 80% of the list
    if (scrollPercentage > 0.8 && hasMore && !loadingMore) {
      onLoadMore();
    }
    
    props.onScroll?.(scrollTop);
  }, [items.length, hasMore, loadingMore, onLoadMore, props]);

  return (
    <VirtualizedList
      {...props}
      items={items}
      onScroll={handleScroll}
      loading={loadingMore}
    />
  );
}

// Searchable virtualized list
interface SearchableVirtualizedListProps<T> extends VirtualizedListProps<T> {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  searchPlaceholder?: string;
  filterItems: (items: T[], searchTerm: string) => T[];
}

export function SearchableVirtualizedList<T>({
  items,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterItems,
  ...props
}: SearchableVirtualizedListProps<T>) {
  const filteredItems = filterItems(items, searchTerm);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search items"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      
      <VirtualizedList
        {...props}
        items={filteredItems}
      />
      
      {searchTerm && filteredItems.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          No items found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
