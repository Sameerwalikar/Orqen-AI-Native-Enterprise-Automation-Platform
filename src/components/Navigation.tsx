import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isScrolled } = useScroll(50);

  const navItems = [
    { label: "Blogs", href: "#blogs" },
    { label: "Case Studies", href: "#case-studies" },
    { label: "Careers", href: "#careers" },
    { label: "Team", href: "#team" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out",
        isScrolled
          ? "bg-background/70 dark:bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-b border-border/40 shadow-lg shadow-black/[0.03] dark:shadow-black/20"
          : "bg-transparent backdrop-blur-0 border-b border-transparent"
      )}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-500",
            isScrolled ? "h-16" : "h-20"
          )}
        >
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 group">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 flex-shrink-0"></div>
              <span className="text-xl font-bold font-serif tracking-tight text-foreground">
                MultiOps
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  "text-foreground hover:text-primary",
                  "relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button with Image */}
          <div className="hidden md:flex items-center">
            <a
              href="https://cal.com/natty-boy-xmgs67/secret"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="default"
                size="default"
                className="group relative overflow-hidden bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 bg-[length:200%_100%] rounded-lg font-medium text-sm pl-4 pr-3 h-9 shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[length:100%_100%] hover:shadow-xl hover:shadow-black/15 flex items-center gap-2"
              >
                <span className="text-white">Talk to Founders</span>
                <img
                  src="/nara.jpg"
                  alt="Nara"
                  className="h-6 w-6 rounded-full border border-white/20 object-cover"
                />
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors duration-200",
              isScrolled ? "hover:bg-secondary/50" : "hover:bg-background/50"
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in border-t border-border/20">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-foreground hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 pt-2">
                <a
                  href="https://cal.com/natty-boy-xmgs67/secret"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="default"
                    className="group relative overflow-hidden bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 bg-[length:200%_100%] w-full rounded-lg font-medium text-sm h-9 flex items-center justify-center gap-2 pl-4 pr-3 shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[length:100%_100%] hover:shadow-xl hover:shadow-black/15"
                  >
                    <span className="text-white">Talk to Founders</span>
                    <img
                      src="/nara.jpg"
                      alt="Nara"
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
