import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sunshine Stars",
  description: "Classroom reward board for teachers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
