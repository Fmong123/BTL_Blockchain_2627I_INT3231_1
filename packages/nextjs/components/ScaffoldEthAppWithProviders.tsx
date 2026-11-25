"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { copyrightChain, copyrightDeployment } from "~~/copyright.config";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="bqs-shell">
        <Header />
        <main className="relative flex flex-col flex-1">
          {copyrightDeployment ? (
            children
          ) : (
            <div className="bqs-page">
              <div role="alert" className="alert alert-warning">
                Ứng dụng chưa hoàn tất kết nối contract trên {copyrightChain.name}. Người quản trị cần hoàn tất triển
                khai trước khi nhóm đăng ký tác phẩm.
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={
            mounted && isDarkMode
              ? darkTheme({ accentColor: "#bda7ff", accentColorForeground: "#241644", borderRadius: "medium" })
              : lightTheme({ accentColor: "#7050cd", accentColorForeground: "#ffffff", borderRadius: "medium" })
          }
        >
          <ProgressBar height="3px" color="#7050cd" />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
