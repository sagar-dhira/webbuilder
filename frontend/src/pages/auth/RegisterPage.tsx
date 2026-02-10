import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { logInfo } from "@/lib/logger";
import styles from "./RegisterPage.module.scss";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logInfo("page_view", "Register page viewed");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logInfo("auth_register_submit", "User submitted registration form");
    setLoading(true);
    const res = await register(email, password, name || undefined);
    setLoading(false);
    if (res.success) {
      toast.success("Account created!");
    } else {
      toast.error(res.msg || "Registration failed");
    }
  };

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Sign up to start building your sites</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <p className={styles.footer}>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
