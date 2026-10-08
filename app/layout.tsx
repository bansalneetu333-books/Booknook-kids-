import type { Metadata } from "next";
import "./globals.css";
import AuthSessionKeeper from "@/components/auth-session-keeper";
import AnalyticsTracker from "@/components/analytics-tracker";
import CartSync from "@/components/cart-sync";

export const metadata: Metadata = {
  title: "Booknook Kids",
  description:
    "Fun digital books and stories for curious young readers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionKeeper />
        <AnalyticsTracker />
        <CartSync />
        {children}
      </body>
    </html>
  );
}
