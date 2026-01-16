import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Remedy | UX Assembly Demo",
  description: "A medical guidance chatbot with AI-driven modular UI components for structured health responses.",
  keywords: ["healthcare", "chatbot", "medical guidance", "AI", "UX assembly"],
  authors: [{ name: "Late Checkout Agency", url: "https://www.latecheckout.agency" }],
  openGraph: {
    title: "Project Remedy | UX Assembly Demo",
    description: "A medical guidance chatbot with AI-driven modular UI components for structured health responses.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
