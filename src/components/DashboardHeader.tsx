import { Moon, Sun, Monitor, User, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { authAPI, type User as AuthUser } from '@/lib/api/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

const DashboardHeader = ({ isSidebarExpanded, onToggleSidebar }: DashboardHeaderProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<Pick<AuthUser, 'firstName' | 'gmail' | 'avatarUrl'> | null>(null);

  useEffect(() => {
    setMounted(true);
    const storedUser = authAPI.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const displayTheme = theme === 'system' ? resolvedTheme || 'light' : theme;
  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const CurrentIcon = displayTheme === 'dark' ? Moon : Sun;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Brand / app identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-md shadow-primary/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm sm:text-base font-semibold tracking-tight">
              MultiOps
            </span>
            <span className="text-[11px] text-muted-foreground">
              Premium
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="ml-2 hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border/70 bg-background/60 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-colors"
            title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Right: user + theme */}
        <div className="flex items-center gap-4">
          {/* User avatar display */}
          <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center ring-2 ring-border shadow-md">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName || 'User avatar'}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs font-semibold text-white">
                {user?.firstName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
              </span>
            )}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold leading-tight">
              {user?.firstName || 'User'}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[140px]">
              {user?.gmail || 'Signed in'}
            </span>
          </div>
          </div>
          {/* Theme toggle */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-white/10 dark:hover:bg-white/10 transition-colors"
              title="Theme"
            >
              <CurrentIcon className="h-4 w-4 transition-colors" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;

              return (
                <DropdownMenuItem
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    isActive
                      ? 'bg-white/10 dark:bg-white/10'
                      : 'hover:bg-transparent focus:bg-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm flex-1',
                      isActive ? 'text-primary font-semibold' : 'text-foreground'
                    )}
                  >
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
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

