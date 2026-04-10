import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSC Dashboard — Desired State Configuration Manager",
  description: "Visualize and manage PowerShell DSC v3 configurations, nodes, and drift events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            className: "text-sm",
            style: { borderRadius: "10px", background: "#fff", color: "#1A202C" },
          }}
        />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-60">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
