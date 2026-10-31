import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  metadataBase: new URL("https://mosan-ai-web.vercel.app"),

  title: "Mosan AI | AI Prompt Generator",

  description:
    "Create better AI prompts in seconds with Mosan AI. Generate detailed prompts for images, videos, stories, advertisements, and social media.",

  applicationName: "Mosan AI",

  keywords: [
    "Mosan AI",
    "AI prompt generator",
    "AI image prompt",
    "AI video prompt",
    "AI story prompt",
  ],

  openGraph: {
    type: "website",
    url: "https://mosan-ai-web.vercel.app/",
    siteName: "Mosan AI",
    title: "Mosan AI | AI Prompt Generator",
    description:
      "Create better AI prompts in seconds with Mosan AI.",
  },
verification: {
  google: "Hd87QwWfH8Ask5ueVgUsPsoUev5hlDe7pfh0EeD1QUw",
},
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
