import { useMemo } from "react";

interface Props {
  markdown: string;
}

interface Heading {
  level: number;
  text: string;
  slug: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function TableOfContents({ markdown }: Props) {
  const headings = useMemo<Heading[]>(() => {
    const out: Heading[] = [];
    const lines = markdown.split("\n");
    let inFence = false;
    for (const line of lines) {
      if (line.startsWith("```")) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      const m = /^(#{2,3})\s+(.*)$/.exec(line.trim());
      if (m) {
        const level = m[1]!.length;
        const text = m[2]!.trim();
        out.push({ level, text, slug: slugify(text) });
      }
    }
    return out;
  }, [markdown]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">On this page</p>
      <ul className="space-y-2 text-sm">
        {headings.map((h) => (
          <li key={h.slug} style={{ paddingLeft: (h.level - 2) * 12 }}>
            <a
              href={`#${h.slug}`}
              className="text-muted-foreground hover:text-primary transition-colors line-clamp-2"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
