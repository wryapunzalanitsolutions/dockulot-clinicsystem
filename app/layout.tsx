import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/src/components/layout/RoleProvider";

export const metadata: Metadata = {
  title: "Healthcare & Doctor Creator System",
  description: "Clinic, patient portal, online consultation, POS, inventory, and doctor creator platform",
  icons: {
    icon: "/images/favicon.png?v=2",
    apple: "/images/favicon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
