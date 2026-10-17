
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = {
  title: {
    default: "Modera — Better Conversations. Clearer Standards.",
    template: "%s | Modera",
  },
  description:
    "A clearer approach to chat moderation. Explore assessment standards, practice communication skills, and understand the process with Modera.",
  applicationName: "Modera",
  keywords: [
    "Modera",
    "chat moderation",
    "communication skills",
    "moderation assessment",
    "online safety",
    "assessment transparency",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#171914",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
