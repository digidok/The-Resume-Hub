import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
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
  title: "Resume Hub",
  description: "Build, share, and improve your resume — and apply to real jobs.",
  openGraph: {
    title: "Resume Hub",
    description: "Build, share, and improve your resume — and apply to real jobs.",
    url: "https://www.resumehub.co.za",
    siteName: "Resume Hub",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="mx-auto flex min-h-full w-full max-w-[11in] flex-col bg-white shadow-xl shadow-slate-900/5">
          <MotionProvider>{children}</MotionProvider>
        </div>
      </body>
    </html>
  );
}
