import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "DevPulse | Technical Micro-Journal & Engineering Feed",
  description: "Share architecture notes, code snippets, and engineering progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}