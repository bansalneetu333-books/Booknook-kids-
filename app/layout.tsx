import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
