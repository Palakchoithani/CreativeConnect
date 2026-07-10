import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteGuard from "@/components/layout/RouteGuard";
import { ThemeProvider } from "@/components/ThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CreativeConnect — Professional Network for Creatives",
    template: "%s | CreativeConnect",
  },
  description: "Connect with top creative professionals, discover portfolios, find jobs, collaborate on projects, and grow your creative career on CreativeConnect.",
  keywords: ["creative portfolio", "design jobs", "creative network", "UI/UX", "graphic design", "collaboration", "mentorship"],
  openGraph: {
    title: "CreativeConnect",
    description: "Professional networking platform for creatives.",
    type: "website",
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
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-background text-foreground overflow-y-auto">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AuthProvider>
              <ToastProvider>
                <RouteGuard>{children}</RouteGuard>
              </ToastProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
