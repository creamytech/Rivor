"use client";

import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export default function Logo({ href = "/", className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-2xl"
  };

  const wordmark = (
    <div className={`inline-flex items-center group transition-all duration-300 ${className ?? ""}`}>
      <span 
        className={`font-bold tracking-tight ${sizeClasses[size]} bg-gradient-to-r from-[var(--rivor-indigo)] via-[var(--rivor-teal)] to-[var(--rivor-aqua)] bg-clip-text text-transparent bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-500`}
        style={{ 
          letterSpacing: "-0.02em",
          backgroundSize: "200% 100%",
          backgroundPosition: "0% 0%"
        }}
      >
        Rivor
      </span>
      <div className="ml-1 w-2 h-2 rounded-full bg-gradient-to-r from-[var(--rivor-teal)] to-[var(--rivor-aqua)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110" />
    </div>
  );

  return href ? (
    <Link href={href} aria-label="Rivor Home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 rounded-md">
      {wordmark}
    </Link>
  ) : (
    wordmark
  );
}


