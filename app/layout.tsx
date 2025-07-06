// app/layout.tsx
import type { Metadata } from "next"; 
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import { UserProvider } from "@/contexts/user-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WorkLocus",
  description: "Ứng dụng quán lý chấm công thông minh",
  icons: {
    icon: [
      // THAY ĐỔI Ở ĐÂY
      { url: "/images/logo.png?v=1", type: "image/png" },
      { url: "/images/logo.png?v=1", rel: "shortcut icon", type: "image/png" },
    ],
    // VÀ CẢ ĐÂY NỮA
    apple: "/images/logo.png?v=1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          {children}
        </UserProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}