import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Ban, CheckCircle, Info, Loader2, TriangleAlert } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAdsense from "./_components/adsense";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Unisend.co",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background no-scrollbar selection:text-foreground selection:bg-primary/50`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            closeButton
            pauseWhenPageIsHidden
            richColors
            icons={{
              success: <CheckCircle className="size-4" />,
              error: <Ban className="size-4" />,
              loading: <Loader2 className="size-4 animate-spin" />,
              info: <Info className="size-4" />,
              warning: <TriangleAlert className="size-4" />,
            }}
            position="top-right"
          />
        </ThemeProvider>
        <GoogleAdsense pId="1896579303376104"/>
      </body>
    </html>
  );
}
