import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "口腔投放决策辅助系统",
  description: "口腔医院内部广告投放经营数据后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
