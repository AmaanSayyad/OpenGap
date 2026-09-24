"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { TourProvider } from "@/components/product-tour";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SOLANA_RPC } from "@/lib/constants";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";

import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <TourProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster position="bottom-right" />
            </TooltipProvider>
          </TourProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
