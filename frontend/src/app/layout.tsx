import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Defence Research Search Engine - IIT Jodhpur Tech Park",
  description:
    "Search through professor research work at IIT Jodhpur Tech Park for defence-related research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-chat-bg text-chat-text antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
