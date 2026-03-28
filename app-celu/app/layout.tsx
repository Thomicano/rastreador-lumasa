import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import type { Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Fundamental en celulares nativos
};
export const metadata: Metadata = {
  title: "Ya Viene",
  description: "Encontrá el próximo colectivo fácilmente.",
  manifest: "/manifest.webmanifest", // Next.js lo mapea automáticamente del archivo que creamos recién
  appleWebApp: {
    capable: true,            // Esconde Safari y lo vuelve una app real
    statusBarStyle: "default",// Permite que absorba tu themeColor limpio
    title: "Ya Viene",
  },
icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png", 
  },
};  
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
