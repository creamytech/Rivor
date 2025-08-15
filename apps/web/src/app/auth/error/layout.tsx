import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Error | Rivor",
  description: "There was an issue with your sign-in attempt. Please try again or contact support.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthErrorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
