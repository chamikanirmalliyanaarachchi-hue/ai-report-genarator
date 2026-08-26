import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ModalProvider } from "@/components/ModalProvider";
import { AppProvider } from "@/components/AppProvider";

// Load the Inter font from Google Fonts and expose it as a CSS variable
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Report Generator — Intelligent Data & Report Generator",
  description:
    "AI Report Generator turns PDFs, CSVs, and spreadsheets into professional, data-rich reports with charts, analysis, and actionable insights.",
  keywords: [
    "AI Report Generator",
    "data report generator",
    "PDF to report",
    "CSV analysis",
    "business insights",
    "AI charts",
  ],
  authors: [{ name: "AI Report Generator" }],
  applicationName: "AI Report Generator",
  icons: {
    icon: "/favicon.svg?v=3",
    shortcut: "/favicon.svg?v=3",
    apple: "/favicon.svg?v=3",
  },
  openGraph: {
    title: "AI Report Generator — Intelligent Data & Report Generator",
    description:
      "Turn PDF or CSV files into professional business reports with AI.",
    type: "website",
    siteName: "AI Report Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Report Generator — Intelligent Data & Report Generator",
    description:
      "Turn PDF or CSV files into professional business reports with AI.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ModalProvider>
              <AppProvider>{children}</AppProvider>
            </ModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
