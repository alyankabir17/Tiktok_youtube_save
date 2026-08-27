import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRegister,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Seo } from "@/components/seo/Seo";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const register = useRegister();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!accept) {
      setErr("Please accept the terms to continue.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    try {
      await register.mutateAsync({
        data: { email, password, username: username || undefined },
      });
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      toast.success("Account created. Welcome to VideoSave.");
      navigate("/");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not create account.";
      setErr(msg);
    }
  };

  return (
    <AuthShell
      title="Create your free account"
      subtitle="Higher download limits, a private history, and zero spam. Promise."
    >
      <Seo title="Create account — VideoSave" description="Create a free VideoSave account." />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="username">Username <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" placeholder="username" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" placeholder="At least 6 characters" />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={accept} onCheckedChange={(v) => setAccept(v === true)} className="mt-0.5" />
          <span>I agree to use VideoSave responsibly and only download content I have permission to use.</span>
        </label>
        {err && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {err}
          </div>
        )}
        <Button
          type="submit"
          disabled={register.isPending}
          className="w-full h-11 bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30"
        >
          {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
