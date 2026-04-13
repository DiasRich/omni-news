import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mirakt — новостной портал",
    template: "%s · Mirakt",
  },
  description:
    "Актуальные новости: технологии, экономика, мир и Россия. Mirakt News.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
