"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ isFirstUser: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 10) { setError("Password must be at least 10 characters"); return; }
    if (!/[a-z]/.test(password)) { setError("Password must contain a lowercase letter"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password must contain an uppercase letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(password)) { setError("Password must contain a special character"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess({ isFirstUser: data.isFirstUser, message: data.message });
      } else {
        setError(data.error || "Registration failed");
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
          <img src="/logo.svg" alt="AI DSC Dashboard" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-xl font-bold text-dsc-text">AI DSC Dashboard</h1>
            <p className="text-xs text-dsc-text-secondary">Configuration Management</p>
          </div>
        </div>

        {success ? (
          <Card>
            <CardContent className="py-8 text-center">
              {success.isFirstUser ? (
                <>
                  <div className="rounded-full bg-dsc-green-50 p-4 inline-block mb-4"><Shield className="h-8 w-8 text-dsc-green" /></div>
                  <h3 className="text-lg font-bold text-dsc-text mb-2">Admin Account Created</h3>
                  <p className="text-sm text-dsc-text-secondary mb-6">{success.message}</p>
                  <Link href="/login"><Button>Sign In Now</Button></Link>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-dsc-blue-50 p-4 inline-block mb-4"><CheckCircle2 className="h-8 w-8 text-dsc-blue" /></div>
                  <h3 className="text-lg font-bold text-dsc-text mb-2">Account Created</h3>
                  <p className="text-sm text-dsc-text-secondary mb-6">{success.message}</p>
                  <Link href="/login"><Button variant="outline">Back to Sign In</Button></Link>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>
                The first account becomes the root admin. Subsequent accounts require admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="name" label="Full Name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                <Input id="email" label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                <Input id="password" label="Password" type="password" placeholder="Min 10 chars, upper+lower+number+special" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
                <Input id="confirm" label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-sm text-dsc-red">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  <UserPlus className="h-4 w-4" />{loading ? "Creating..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-dsc-text-secondary">
                Already have an account?{" "}
                <Link href="/login" className="text-dsc-blue hover:underline font-medium">Sign in</Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


