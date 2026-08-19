import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "運費系統",
  description: "和陞 運費/帳務管理系統",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
