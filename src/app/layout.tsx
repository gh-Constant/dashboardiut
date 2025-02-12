import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ScheduleProvider } from "@/lib/context/ScheduleContext";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IUT Schedule",
  description: "IUT Class Schedule Viewer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ScheduleProvider>
            <div className="relative flex min-h-screen">
              <Navbar />
              <div className="flex-1">
                <main className="relative p-6 lg:p-8">
                  {children}
                </main>
              </div>
            </div>
          </ScheduleProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
