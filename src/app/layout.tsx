import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Citradhara | A Stream of Wonders",
  description: "A Stream of Wonders — Dedicated video streaming platform for the CodersHigh community. Built with Next.js, Google Drive video storage, and Firebase.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-[#f3f4f6] antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
