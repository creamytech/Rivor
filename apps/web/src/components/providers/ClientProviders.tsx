"use client";

import dynamic from "next/dynamic";

import ThemeProvider from "./ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/river/RiverToast";

const ClientRoot = dynamic(() => import("./ClientRoot"), { ssr: false });
const SessionProviderWrapper = dynamic(() => import("./SessionProviderWrapper"), { ssr: false });
const TRPCProvider = dynamic(() => import("./TRPCProvider").then(mod => ({ default: mod.TRPCProvider })), { ssr: false });

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProviderWrapper>
      <ThemeProvider>
        <TRPCProvider>
          <ToastProvider>
            {children}
            <ClientRoot />
            <Toaster />
            <div id="portal-toasts" />
            <div id="portal-modals" />
            <div id="portal-drawers" />
          </ToastProvider>
        </TRPCProvider>
      </ThemeProvider>
    </SessionProviderWrapper>
  );
}
