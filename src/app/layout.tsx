import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageLoadProvider } from "@/contexts/PageLoadContext";
import { ForbiddenProvider } from "@/contexts/ForbiddenContext";
import { ActiveSessionProvider } from "@/contexts/ActiveSessionContext";
import { NetworkErrorProvider } from "@/contexts/NetworkErrorContext";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { Footer } from "@/components/footer";
import { TopProgressBar } from "@/components/ui/top-progress-bar";

//Analytics
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CourseFlow",
  description: "Your academic rhythm, perfectly timed",
  icons: {
    shortcut: '/favicon.svg',
  },
  openGraph: {
    locale: "en_US",
    title: "CourseFlow",
    siteName: "CourseFlow",
    description: "Your academic rhythm, perfectly timed",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <PageLoadProvider>
              <ForbiddenProvider>
              <ActiveSessionProvider>
              <NetworkErrorProvider>
              <TopProgressBar />
              <div className="flex flex-col min-h-screen">
              {children}
              <Footer />
            </div>
            <Toaster />
            <Analytics />
              </NetworkErrorProvider>
              </ActiveSessionProvider>
              </ForbiddenProvider>
            </PageLoadProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
