// Accessibility utilities and helpers

// Focus management
export class FocusManager {
  private static previousFocus: HTMLElement | null = null;

  static storeFocus(): void {
    FocusManager.previousFocus = document.activeElement as HTMLElement;
  }

  static restoreFocus(): void {
    if (FocusManager.previousFocus) {
      FocusManager.previousFocus.focus();
      FocusManager.previousFocus = null;
    }
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
}

// Keyboard navigation helpers
export const KeyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowNavigation: (
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentIndex + 1, items.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      items[newIndex]?.focus();
    }
  },

  // Handle Enter/Space activation
  handleActivation: (e: KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }
};

// Screen reader utilities
export const ScreenReader = {
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Update screen reader status
  updateStatus: (elementId: string, status: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-label', status);
      element.setAttribute('title', status);
    }
  }
};

// Color contrast utilities
export const ColorContrast = {
  // Calculate relative luminance
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = ColorContrast.getRelativeLuminance(...color1);
    const lum2 = ColorContrast.getRelativeLuminance(...color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG requirements
  meetsWCAG: (color1: [number, number, number], color2: [number, number, number], level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = ColorContrast.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
};

// Reduced motion utilities
export const MotionPreferences = {
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  respectMotionPreference: (element: HTMLElement, animationClass: string) => {
    if (!MotionPreferences.prefersReducedMotion()) {
      element.classList.add(animationClass);
    }
  }
};

// ARIA utilities
export const ARIA = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set up ARIA relationships
  linkElements: (trigger: HTMLElement, target: HTMLElement, relationship: 'controls' | 'describedby' | 'labelledby') => {
    const id = target.id || ARIA.generateId();
    target.id = id;
    trigger.setAttribute(`aria-${relationship}`, id);
  },

  // Update ARIA state
  updateState: (element: HTMLElement, state: Record<string, string | boolean>) => {
    Object.entries(state).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, String(value));
    });
  }
};

// Skip link utilities
export const SkipLinks = {
  createSkipLink: (target: string, text: string): HTMLElement => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${target}`;
    skipLink.textContent = text;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded';
    skipLink.setAttribute('data-skip-link', 'true');
    
    return skipLink;
  },

  setupSkipLinks: () => {
    const skipLinks = [
      { target: 'main-content', text: 'Skip to main content' },
      { target: 'navigation', text: 'Skip to navigation' },
      { target: 'search', text: 'Skip to search' }
    ];

    const container = document.createElement('div');
    container.className = 'skip-links';

    skipLinks.forEach(({ target, text }) => {
      const skipLink = SkipLinks.createSkipLink(target, text);
      container.appendChild(skipLink);
    });

    document.body.insertBefore(container, document.body.firstChild);
  }
};

// Accessibility checker (development only)
export const AccessibilityChecker = {
  checkFocusRings: () => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      const styles = getComputedStyle(element);
      const hasOutline = styles.outline !== 'none' && styles.outline !== '0px';
      const hasBoxShadow = styles.boxShadow !== 'none';
      
      if (!hasOutline && !hasBoxShadow) {
        console.warn('Element lacks focus indicator:', element);
      }
    });
  },

  checkAltText: () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        console.warn('Image lacks alt text:', img);
      }
    });
  },

  checkHeadingStructure: () => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel > previousLevel + 1) {
        console.warn('Heading structure skips levels:', heading);
      }
      
      previousLevel = currentLevel;
    });
  },

  runChecks: () => {
    if (process.env.NODE_ENV === 'development') {
      AccessibilityChecker.checkFocusRings();
      AccessibilityChecker.checkAltText();
      AccessibilityChecker.checkHeadingStructure();
    }
  }
};
