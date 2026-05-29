import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Package Intelligence — React Native & Expo Dependency Insights",
  description:
    "Analyze React Native and Expo dependencies for health, compatibility, bundle impact, and actionable recommendations.",
  keywords: [
    "React Native",
    "Expo",
    "package.json",
    "dependency analysis",
    "bundle size",
    "new architecture",
    "package health",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
