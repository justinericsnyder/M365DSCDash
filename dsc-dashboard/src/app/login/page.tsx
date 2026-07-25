"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import { PersonArrowRight20Regular, Warning20Regular } from "@fluentui/react-icons";
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
  footer: {
    marginTop: "16px",
    textAlign: "center",
  },
  link: {
    color: tokens.colorBrandForeground1,
    textDecoration: "none",
    fontWeight: tokens.fontWeightMedium,
    ":hover": {
      textDecoration: "underline",
    },
  },
});

export default function LoginPage() {
  const router = useRouter();
  const styles = useStyles();
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
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoSection}>
          <img src="/logo.svg" alt="AI DSC Dashboard" className={styles.logoImg} />
          <div>
            <Text size={500} weight="bold" block>AI DSC Dashboard</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Configuration Management</Text>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              <Field label="Email" required>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  appearance="filled-darker"
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                  appearance="filled-darker"
                />
              </Field>

              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              {pendingApproval && (
                <MessageBar intent="warning">
                  <MessageBarBody>
                    Your account is pending admin approval. You&apos;ll be able to log in once approved.
                  </MessageBarBody>
                </MessageBar>
              )}

              <Button appearance="primary" type="submit" disabled={loading} icon={<PersonArrowRight20Regular />} style={{ width: "100%" }}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className={styles.footer}>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                Don&apos;t have an account?{" "}
                <Link href="/register" className={styles.link}>Create one</Link>
              </Text>
              <br />
              <Link href="/" style={{ marginTop: 8, display: "inline-block" }}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Continue as guest (demo data)</Text>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
