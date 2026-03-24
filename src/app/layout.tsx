import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OmniNews — новостной портал",
    template: "%s · OmniNews",
  },
  description:
    "Актуальные новости: технологии, экономика, мир и Россия. OmniNews.",
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
