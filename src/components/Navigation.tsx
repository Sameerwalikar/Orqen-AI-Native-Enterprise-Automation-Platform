import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isScrolled } = useScroll(50);

  const navItems = [
    { label: "Workflow", href: "#workflow" },
    { label: "Platform", href: "#platform" },
    { label: "Teams", href: "#teams" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        isScrolled
          ? "bg-[#faf9f8]/88 backdrop-blur-xl border-b border-[rgba(27,23,27,.08)]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto max-w-[1240px] px-6 lg:px-[7vw]">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-500",
            isScrolled ? "h-16" : "h-20",
          )}
        >
          <a href="/" className="group flex items-center space-x-2">
            <div className="orqen-logo-mark flex-shrink-0">
              <span />
            </div>
            <span className="text-xl font-bold tracking-[-0.06em] text-[#191719]">orqen</span>
          </a>

          <div className="hidden items-center space-x-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[#403c40] transition-colors duration-200 hover:text-[#191719]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center md:flex">
            <a
              href="https://www.linkedin.com/in/sameer-walikar/"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="default"
                size="default"
                className="group flex h-10 items-center gap-2 rounded-full border border-[rgba(27,23,27,.12)] bg-white/80 pl-4 pr-2 text-sm font-medium text-[#2b282b] shadow-[0_8px_24px_rgba(31,25,29,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(27,23,27,.18)] hover:bg-white"
              >
                <span>Talk to Founders</span>
                <img
                  src="/sameer.jpeg"
                  alt="Sameer"
                  className="h-7 w-7 rounded-full border border-white/80 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Button>
            </a>
          </div>

          <button
            className={cn(
              "rounded-lg p-2 transition-colors duration-200 md:hidden",
              isScrolled ? "hover:bg-black/[0.04]" : "hover:bg-white/50",
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-[#191719]" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="animate-fade-in border-t border-[rgba(27,23,27,.08)] py-4 md:hidden">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#403c40] transition-colors hover:bg-black/[0.03] hover:text-[#191719]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 pt-2">
                <a
                  href="https://www.linkedin.com/in/sameer-walikar/"
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1c1a1d] text-sm font-medium text-white hover:bg-[#2a272b]">
                    Talk to Founders
                    <img
                      src="/sameer.jpeg"
                      alt="Sameer"
                      className="h-6 w-6 rounded-full border border-white/20 object-cover"
                    />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
