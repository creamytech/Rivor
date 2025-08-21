"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const ChatAgent = dynamic(() => import("@/components/app/ChatAgent"), {
  ssr: false,
});

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide chat widget on app pages, auth pages, and landing page
  if (
    pathname?.startsWith("/app") ||
    pathname?.startsWith("/auth") ||
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/signin"
  ) {
    return null;
  }

  return (
    <>
      <ChatAgent isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-12 w-12 shadow-lg brand-gradient text-white"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
}
