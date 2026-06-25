import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Dünya Kupası 2026 Tahmin Ligi",
  description: "Arkadaşlarınla kendi Dünya Kupası fantezi ligini kur ve tahmin yapmaya başla!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
