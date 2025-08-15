import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in to Rivor",
  description: "Secure sign-in to your Rivor account using Google or Microsoft OAuth.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
