import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  jsonLd?: object | object[];
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function Seo({ title, description, canonical, ogImage, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (ogImage) {
      setMeta("og:image", ogImage, "property");
      setMeta("twitter:image", ogImage);
    }
    if (canonical) setLink("canonical", canonical);

    const items = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const scripts: HTMLScriptElement[] = [];
    items.forEach((data) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.text = JSON.stringify(data);
      s.dataset["seo"] = "true";
      document.head.appendChild(s);
      scripts.push(s);
    });

    return () => {
      scripts.forEach((s) => s.remove());
    };
  }, [title, description, canonical, ogImage, jsonLd]);

  return null;
}
