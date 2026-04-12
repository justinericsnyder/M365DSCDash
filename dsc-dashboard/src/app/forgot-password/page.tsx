"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, KeyRound } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    if (newPassword.length < 10) { setError("Password must be at least 10 characters"); return; }
    if (!/[a-z]/.test(newPassword)) { setError("Must contain a lowercase letter"); return; }
    if (!/[A-Z]/.test(newPassword)) { setError("Must contain an uppercase letter"); return; }
    if (!/[0-9]/.test(newPassword)) { setError("Must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(newPassword)) { setError("Must contain a special character"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.error || "Reset failed");
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dsc-bg p-4">
      <div className="w-full max-w-md animate-gravity-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo.svg" alt="AI DSC Dashboard" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-xl font-bold text-dsc-text">AI DSC Dashboard</h1>
            <p className="text-xs text-dsc-text-secondary">Reset Password</p>
          </div>
        </div>

        {success ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-dsc-green mx-auto mb-4" />
              <h3 className="text-lg font-bold text-dsc-text mb-2">Password Reset</h3>
              <p className="text-sm text-dsc-text-secondary mb-6">Your password has been updated. You can now sign in.</p>
              <Link href="/login"><Button>Sign In</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Reset Password</CardTitle>
              <CardDescription>Enter your email and a new password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="email" label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Input id="newPassword" label="New Password" type="password" placeholder="Min 10 chars, upper+lower+number+special" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <Input id="confirm" label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-dsc-red-50 border border-dsc-red/20 text-sm text-dsc-red"><AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}</div>}
                <Button type="submit" className="w-full" disabled={loading}><KeyRound className="h-4 w-4" />{loading ? "Resetting..." : "Reset Password"}</Button>
              </form>
              <div className="mt-4 text-center"><Link href="/login" className="text-xs text-dsc-text-secondary hover:underline">Back to Sign In</Link></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
