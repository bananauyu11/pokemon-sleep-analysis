import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import DbInit from "@/components/DbInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ポケスリ分析",
  description:
    "ポケモンスリープの捕獲ポケモンを記録し、サブスキルや食材配列をメダル・タイプ別に分析するツール",
  appleWebApp: {
    capable: true,
    title: "ポケスリ分析",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f2761",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DbInit />
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-black/5 py-4 text-center text-xs text-black/40">
          データはこの端末のブラウザ内に保存されます(IndexedDB)。バックアップはCSVエクスポートをご利用ください。
        </footer>
      </body>
    </html>
  );
}
