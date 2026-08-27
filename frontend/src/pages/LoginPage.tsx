import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogin,
  getGetCurrentUserQueryKey,
  getListHistoryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Seo } from "@/components/seo/Seo";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const login = useLogin();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await login.mutateAsync({ data: { email, password } });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
      toast.success("Welcome back.");
      navigate("/history");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Invalid email or password.";
      setErr(msg);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep your download history and unlock higher limits."
    >
      <Seo title="Sign in — VideoSave" description="Sign in to your VideoSave account." />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="••••••••"
          />
        </div>
        {err && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {err}
          </div>
        )}
        <Button
          type="submit"
          disabled={login.isPending}
          className="w-full h-11 bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30"
        >
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/auth/register" className="text-primary font-medium hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
