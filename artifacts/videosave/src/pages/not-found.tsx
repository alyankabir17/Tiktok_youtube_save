import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">Error 404</p>
        <h1 className="mt-3 font-display text-7xl md:text-8xl font-bold tracking-tight bg-gradient-to-br from-primary to-fuchsia-500 bg-clip-text text-transparent">
          Lost link.
        </h1>
        <p className="mt-4 text-muted-foreground">
          This URL doesn't lead anywhere we recognize. Try the homepage instead.
        </p>
        <Link href="/" className="inline-block mt-6">
          <Button className="bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30">
            Back to VideoSave
          </Button>
        </Link>
      </div>
    </div>
  );
}
