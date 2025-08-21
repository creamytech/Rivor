"use client";

interface ThemeProviderProps {
  children: React.ReactNode;
}

// Disabled old theme system in favor of glass themes
export default function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}
