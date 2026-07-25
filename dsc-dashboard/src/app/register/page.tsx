"use client";

import { useState } from "react";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Field,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  PersonAdd20Regular,
  CheckmarkCircle20Regular,
  Shield20Regular,
} from "@fluentui/react-icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

const useStyles = makeStyles({
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "16px",
  },
  container: {
    width: "100%",
    maxWidth: "400px",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  logoImg: {
    height: "40px",
    width: "40px",
    borderRadius: tokens.borderRadiusXLarge,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  successCenter: {
    padding: "32px 16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  iconCircle: {
    borderRadius: "9999px",
    padding: "16px",
    display: "inline-flex",
    marginBottom: "16px",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
  },
  link: {
    color: tokens.colorBrandForeground1,
    textDecoration: "none",
    fontWeight: tokens.fontWeightMedium,
    ":hover": { textDecoration: "underline" },
  },
});

export default function RegisterPage() {
  const styles = useStyles();
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
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <img src="/logo.svg" alt="AI DSC Dashboard" className={styles.logoImg} />
          <div>
            <Text size={500} weight="bold" block>AI DSC Dashboard</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Configuration Management</Text>
          </div>
        </div>

        {success ? (
          <Card>
            <CardContent>
              <div className={styles.successCenter}>
                {success.isFirstUser ? (
                  <>
                    <div className={styles.iconCircle} style={{ backgroundColor: "#18241C" }}>
                      <Shield20Regular style={{ fontSize: 32, color: "#7ECC9A" }} />
                    </div>
                    <Text size={500} weight="bold" block style={{ marginBottom: 8 }}>Admin Account Created</Text>
                    <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginBottom: 24 }} block>{success.message}</Text>
                    <Link href="/login"><Button appearance="primary">Sign In Now</Button></Link>
                  </>
                ) : (
                  <>
                    <div className={styles.iconCircle} style={{ backgroundColor: "#221830" }}>
                      <CheckmarkCircle20Regular style={{ fontSize: 32, color: "#B89ADA" }} />
                    </div>
                    <Text size={500} weight="bold" block style={{ marginBottom: 8 }}>Account Created</Text>
                    <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginBottom: 24 }} block>{success.message}</Text>
                    <Link href="/login"><Button appearance="outline">Back to Sign In</Button></Link>
                  </>
                )}
              </div>
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
              <form onSubmit={handleSubmit} className={styles.form}>
                <Field label="Full Name" required>
                  <Input placeholder="Jane Smith" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} appearance="filled-darker" />
                </Field>
                <Field label="Email" required>
                  <Input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} appearance="filled-darker" />
                </Field>
                <Field label="Password" required>
                  <Input type="password" placeholder="Min 10 chars, upper+lower+number+special" value={password} onChange={(e) => setPassword((e.target as HTMLInputElement).value)} appearance="filled-darker" />
                </Field>
                <Field label="Confirm Password" required>
                  <Input type="password" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm((e.target as HTMLInputElement).value)} appearance="filled-darker" />
                </Field>

                {error && (
                  <MessageBar intent="error">
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                )}

                <Button appearance="primary" type="submit" disabled={loading} icon={<PersonAdd20Regular />} style={{ width: "100%" }}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>

              <div className={styles.footer}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  Already have an account?{" "}
                  <Link href="/login" className={styles.link}>Sign in</Link>
                </Text>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
