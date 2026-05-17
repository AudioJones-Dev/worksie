import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worksie",
  description: "Mobile-first configurable operations platform for blue-collar businesses"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
