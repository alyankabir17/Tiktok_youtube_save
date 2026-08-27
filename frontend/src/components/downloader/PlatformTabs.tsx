import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";

export function PlatformTabs() {
  const [location] = useLocation();
  const tabs = [
    { href: "/", label: "TikTok", color: "#ff0050" },
    { href: "/youtube", label: "YouTube", color: "#ff0000" },
    { href: "/instagram", label: "Instagram", color: "#E1306C" },
    { href: "/vimeo", label: "Vimeo", color: "#1ab7ea" },
    { href: "/tiktok", match: ["/", "/tiktok"], label: "TikTok", color: "#ff0050" },
    { href: "/youtube", match: ["/youtube"], label: "YouTube", color: "#ff0000" },
    { href: "/instagram", match: ["/instagram"], label: "Instagram", color: "#E1306C" },
    { href: "/vimeo", match: ["/vimeo"], label: "Vimeo", color: "#1ab7ea" },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-md">
      {tabs.map((tab) => {
        const active = location === tab.href;
        const active = tab.match.includes(location);
        return (
          <Link key={tab.href} href={tab.href}>
            <span className="relative inline-flex items-center px-5 py-2 text-sm font-medium cursor-pointer">
              {active && (
                <motion.div
                  layoutId="platform-tab-bg"
                  className="absolute inset-0 rounded-full"
                  style={{ background: tab.color }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${active ? "text-white" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
