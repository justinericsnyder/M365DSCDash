"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Blocks, LogIn, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPendingApproval(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/");
        router.refresh();
      } else if (data.pendingApproval) {
        setPendingApproval(true);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dsc-bg p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B3A5C] to-[#B89ADA]">
            <Blocks className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-dsc-text">AI DSC Dashboard</h1>
            <p className="text-xs text-dsc-text-secondary">Configuration Management</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email" label="Email" type="email" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" required
              />
              <Input
                id="password" label="Password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required
              />

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-sm text-dsc-red">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
              )}

              {pendingApproval && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-dsc-yellow-50 border border-dsc-yellow/20 text-sm text-dsc-yellow">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Your account is pending admin approval. You&apos;ll be able to log in once approved.
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4" />{loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-dsc-text-secondary">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-dsc-blue hover:underline font-medium">Create one</Link>
            </div>
            <div className="mt-2 text-center">
              <Link href="/" className="text-xs text-dsc-text-secondary hover:underline">Continue as guest (demo data)</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


