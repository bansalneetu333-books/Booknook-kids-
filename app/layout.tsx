import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids E-Book Store",
  description: "A friendly digital library for young readers."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
