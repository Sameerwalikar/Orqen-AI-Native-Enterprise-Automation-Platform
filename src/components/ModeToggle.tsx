import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  isExpanded?: boolean;
  className?: string;
}

const ModeToggle = ({ isExpanded = true, className }: ModeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg",
        isExpanded ? "w-full px-3 py-2.5" : "w-10 h-10",
        className
      )}>
        <div className="h-5 w-5 rounded bg-sidebar-accent animate-pulse" />
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  // For display, use resolved theme when system is selected
  const displayTheme = theme === "system" ? resolvedTheme || "light" : theme;
  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const CurrentIcon = displayTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group relative flex items-center rounded-xl transition-all duration-200",
            "text-sidebar-text-secondary hover:text-sidebar-foreground hover:bg-sidebar-accent",
            isExpanded ? "w-full px-3 py-2.5" : "w-10 h-10 justify-center",
            className
          )}
          title={!isExpanded ? "Theme" : undefined}
        >
          {/* Icon Container */}
          <div className={cn(
            "relative flex items-center justify-center transition-all duration-200",
            isExpanded ? "w-10" : "w-full"
          )}>
            <div className="p-2 rounded-lg bg-transparent text-sidebar-text-secondary group-hover:bg-sidebar-item-hover group-hover:text-sidebar-foreground transition-all duration-200">
              <CurrentIcon className="h-5 w-5 transition-all duration-200 group-hover:scale-105" />
            </div>
          </div>

          {/* Label */}
          {isExpanded && (
            <span className="ml-3 font-semibold text-sm whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              Theme
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="end"
        className="w-52 ml-2 bg-popover border border-sidebar-border shadow-xl"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent/50"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium flex-1",
                isActive ? "text-primary font-semibold" : "text-popover-foreground"
              )}>
                {themeOption.label}
              </span>
              {isActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeToggle;

