import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "晴れナビ - その日、晴れる？",
  description: "過去の天気データと最新予報から、指定日の晴れる確率を算出します",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gradient-to-b from-sky-50 to-blue-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
