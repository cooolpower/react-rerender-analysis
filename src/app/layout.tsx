import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "React Performance Devtool",
  description:
    "Analyze React component renders and API performance in real-time",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
