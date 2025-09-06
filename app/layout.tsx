import "./globals.css";
import React from "react";

export const metadata = {
  title: "Items",
  description: "Items list from Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased p-6">
        <main className="max-w-2xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
