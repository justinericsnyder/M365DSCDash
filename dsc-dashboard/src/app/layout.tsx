import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI DSC Dashboard — Desired State Configuration Manager",
  description: "Visualize and manage PowerShell DSC v3 configurations, M365 tenant compliance, Copilot agents, and Purview sensitivity labels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 lg:ml-60">
              <Header />
              <main className="p-4 lg:p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
