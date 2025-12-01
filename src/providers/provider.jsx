import React, { useMemo, useEffect } from "react";
import { client } from "../services/client";
import { ConnectButton, darkTheme, lightTheme } from "thirdweb/react";
import { defineChain } from "thirdweb/chains";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { useDarkMode } from "../contexts/themeContext";

export function OpenHeartConnectButton() {
  const { darkMode } = useDarkMode();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const wallets = useMemo(
    () => [
      inAppWallet({
        auth: {
          options: ["google", "discord", "passkey", "github"],
        },
        metadata: {
          name: "Open Heart",
          image: {
            src: "/vite.svg",
            width: 150,
            height: 150,
          },
        },
        executionMode: {
          mode: "EIP7702",
          sponsorGas: true,
        },
        smartAccount: {
          chain: defineChain(11155111),
          sponsorGas: true,
        },
      }),
      createWallet("io.metamask"),
      createWallet("com.coinbase.wallet"),
      createWallet("me.rainbow"),
    ],
    []
  );

  const customTheme = useMemo(
    () =>
      darkMode
        ? darkTheme({
            colors: {
              // Primary brand colors - Red/Pink gradient
              primaryButtonBg:
                "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
              primaryButtonText: "#ffffff",

              // Accent colors
              accentText: "#f87171", // Red-400
              accentButtonBg:
                "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
              accentButtonText: "#ffffff",

              // Backgrounds
              modalBg: "#111827", // Gray-900
              accentBg: "rgba(220, 38, 38, 0.1)", // Red-600 with opacity

              // Interactive states
              primaryButtonBgHover:
                "linear-gradient(135deg, #b91c1c 0%, #be185d 100%)",
              accentButtonBgHover:
                "linear-gradient(135deg, #b91c1c 0%, #be185d 100%)",

              // Text
              primaryText: "#f9fafb", // Gray-50
              secondaryText: "#d1d5db", // Gray-300

              // Borders and separators
              borderColor: "#374151", // Gray-700
              separatorLine: "#dc2626", // Red-600

              // Connected state
              connectedButtonBg: "rgba(220, 38, 38, 0.15)",
              connectedButtonBgHover: "rgba(220, 38, 38, 0.25)",

              // Misc
              selectedTextColor: "#f9fafb",
              skeletonBg: "#374151", // Gray-700

              // Wallet selector
              walletSelectorButtonHoverBg: "rgba(220, 38, 38, 0.1)",
            },
            fontFamily: "Inter, system-ui, sans-serif",
          })
        : lightTheme({
            colors: {
              // Primary brand colors - Red/Pink gradient
              primaryButtonBg:
                "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
              primaryButtonText: "#ffffff",

              // Accent colors
              accentText: "#dc2626", // Red-600
              accentButtonBg:
                "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
              accentButtonText: "#ffffff",

              // Backgrounds
              modalBg: "#ffffff",
              accentBg: "rgba(220, 38, 38, 0.05)", // Red-600 with opacity

              // Interactive states
              primaryButtonBgHover:
                "linear-gradient(135deg, #b91c1c 0%, #be185d 100%)",
              accentButtonBgHover:
                "linear-gradient(135deg, #b91c1c 0%, #be185d 100%)",

              // Text
              primaryText: "#111827", // Gray-900
              secondaryText: "#6b7280", // Gray-500

              // Borders and separators
              borderColor: "#e5e7eb", // Gray-200
              separatorLine: "#fca5a5", // Red-300

              // Connected state
              connectedButtonBg: "rgba(220, 38, 38, 0.08)",
              connectedButtonBgHover: "rgba(220, 38, 38, 0.15)",

              // Misc
              selectedTextColor: "#ffffff",
              skeletonBg: "#f3f4f6", // Gray-100

              // Wallet selector
              walletSelectorButtonHoverBg: "rgba(220, 38, 38, 0.05)",
            },
            fontFamily: "Inter, system-ui, sans-serif",
          }),
    [darkMode]
  );

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectButton={{
        label: "Connect Wallet",
        style: {
          background: "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: "12px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: darkMode
            ? "0 4px 20px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(220, 38, 38, 0.2)"
            : "0 4px 20px rgba(220, 38, 38, 0.15), 0 0 0 1px rgba(220, 38, 38, 0.1)",
          transition: "all 0.2s ease-in-out",
          minWidth: "160px",
        },
      }}
      connectModal={{
        size: "compact",
        showThirdwebBranding: false,
        title: "Welcome to OpenHeart Chain",
        welcomeScreen: {
          title: "Connect Your Heart",
          subtitle: "Join our community of transparent giving",
          img: {
            src: "/logo-heart.png", // Add your logo here
            width: 150,
            height: 150,
          },
        },
      }}
      theme={customTheme}
    />
  );
}
