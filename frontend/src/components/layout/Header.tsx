import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogout,
  getGetCurrentUserQueryKey,
  getListHistoryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Download, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const NAV = [
  { href: "/", label: "TikTok" },
  { href: "/youtube", label: "YouTube" },
  { href: "/instagram", label: "Instagram" },
  { href: "/vimeo", label: "Vimeo" },
  { href: "/blog", label: "Blog" },
  { href: "/history", label: "History" },
  { href: "/tiktok", match: ["/", "/tiktok"], label: "TikTok" },
  { href: "/youtube", match: ["/youtube"], label: "YouTube" },
  { href: "/instagram", match: ["/instagram"], label: "Instagram" },
  { href: "/vimeo", match: ["/vimeo"], label: "Vimeo" },
  { href: "/blog", match: ["/blog"], label: "Blog" },
  { href: "/history", match: ["/history"], label: "History" },
];

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { data } = useGetCurrentUser();
  const user = data?.user ?? null;
  const queryClient = useQueryClient();
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
      toast.success("Signed out.");
    } catch {
      toast.error("Could not sign out.");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
            <Download className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">VideoSave</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => {
            const active = location === item.href;
            const active = item.match ? item.match.includes(location) : location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden lg:inline">
                {user.username || user.email.split("@")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30 hover:opacity-90">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden grid h-9 w-9 place-items-center rounded-lg hover:bg-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border/40 flex gap-2">
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1">
                  Sign out
                </Button>
              ) : (
                <>
                  <Link href="/auth/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full bg-gradient-to-r from-primary to-fuchsia-500 text-white">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
