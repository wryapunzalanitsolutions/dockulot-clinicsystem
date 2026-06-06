import type { Metadata } from "next";
import "./globals.css";
import { RoleProvider } from "@/src/components/layout/RoleProvider";

export const metadata: Metadata = {
  title: "Doc Kulot Clinic",
  description: "Clinic, patient portal, online consultation, POS, inventory, and doctor creator platform",
  icons: {
    icon: "/images/svg-removebg-preview.png?v=3",
    apple: "/images/svg-removebg-preview.png?v=3",
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
