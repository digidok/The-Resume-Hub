import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { MotionProvider } from "@/components/motion/motion-provider";
import { WhatsAppFloatButton } from "@/components/whatsapp-float-button";
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
  metadataBase: new URL("https://www.resumehub.co.za"),
  title: "The Resume Document Hub — Single Point of Contact",
  description:
    "One hub for documents, CVs, job matching and business support: executive secretariat, board packs, governance, business documents and career tools.",
  openGraph: {
    title: "The Resume Document Hub — Single Point of Contact",
    description:
      "One hub for documents, CVs, job matching and business support: executive secretariat, board packs, governance, business documents and career tools.",
    url: "https://www.resumehub.co.za",
    siteName: "The Resume Document Hub",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
        <WhatsAppFloatButton />
        <Analytics />
      </body>
    </html>
  );
}
