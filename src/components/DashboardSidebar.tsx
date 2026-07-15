import { 
  LayoutDashboard, 
  BarChart2, 
  Bot, 
  Settings, 
  User, 
  LogOut,
  ChevronRight,
  Sparkles,
  Database,
  GitBranch,
  Plug,
  Clock,
  Webhook,
  Building2
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

interface DashboardSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const DashboardSidebar = ({ isExpanded, onToggle }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { id: 'agents', icon: Bot, label: 'Agents', href: '/agents' },
    { id: 'vectors', icon: Database, label: 'Vectors', href: '/vectors' },
    { id: 'workflows', icon: Sparkles, label: 'Workflows', href: '/workflows' },
    { id: 'pipelines', icon: GitBranch, label: 'Pipelines', href: '/pipelines' },
    { id: 'connectors', icon: Plug, label: 'Connectors', href: '/connectors' },
    { id: 'schedules', icon: Clock, label: 'Schedules', href: '/schedules' },
    { id: 'webhooks', icon: Webhook, label: 'Webhooks', href: '/webhooks' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics', href: '/analytics' },
    { id: 'organizations', icon: Building2, label: 'Organizations', href: '/organizations' },
    { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const activeNav = navItems.find(item => 
    location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  )?.id || 'dashboard';

  return (
    <aside 
      className="fixed left-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        top: '4rem', // below the 64px topbar
        height: 'calc(100vh - 4rem)',
        width: isExpanded ? '240px' : '64px',
      }}
    >
      <div 
        className="h-full w-full flex flex-col"
        style={{
          backgroundColor: 'hsl(var(--sidebar-background))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
          boxShadow: '2px 0 24px -8px rgba(0, 0, 0, 0.08)',
          zoom: 0.85,
        }}
      >
      {/* Premium Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto border-t border-sidebar-border/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <Link
              key={item.id}
              to={item.href}
              className={`
                group relative flex items-center rounded-xl transition-all duration-200
                ${isExpanded ? 'px-3 py-2.5' : 'justify-center py-2.5'}
                ${isActive 
                  ? 'bg-gradient-to-r from-primary/10 via-primary/8 to-transparent text-primary shadow-sm shadow-primary/5' 
                  : 'text-sidebar-text-secondary hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }
              `}
              title={!isExpanded ? item.label : undefined}
            >
              {/* Premium Active Indicator - Left Border */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary via-primary/90 to-primary/60 rounded-r-full shadow-sm shadow-primary/30" />
              )}
              
              {/* Icon Container with Premium Styling */}
              <div className={`
                relative flex items-center justify-center
                ${isExpanded ? 'w-10' : 'w-full'}
                transition-all duration-200
              `}>
                <div className={`
                  p-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-transparent text-sidebar-text-secondary group-hover:bg-sidebar-item-hover group-hover:text-sidebar-foreground'
                  }
                `}>
                  <Icon className={`
                    h-5 w-5 transition-all duration-200
                    ${isActive ? 'scale-105' : 'group-hover:scale-105'}
                  `} />
                </div>
              </div>
              
              {/* Label with Premium Typography */}
              {isExpanded && (
                <span className={`
                  ml-3 font-semibold text-sm whitespace-nowrap 
                  animate-in fade-in slide-in-from-left-2 duration-300
                  ${isActive ? 'text-primary' : 'text-sidebar-foreground'}
                `}>
                  {item.label}
                </span>
              )}

              {/* Subtle Arrow Indicator for Active State */}
              {isActive && isExpanded && (
                <ChevronRight className="ml-auto h-4 w-4 text-primary/60 animate-in fade-in slide-in-from-right-2 duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Premium Bottom Section - User Profile */}
      <div className="p-3 border-t border-sidebar-border/50 bg-sidebar-content-bg/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`
              w-full flex items-center rounded-xl transition-all duration-200
              hover:bg-sidebar-accent group
              ${isExpanded ? 'px-2.5 py-2.5' : 'justify-center py-2.5'}
            `}>
              {/* Premium Avatar with Gradient / Image */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl ring-2 ring-white shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName || 'User avatar'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                {/* Online Status Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              </div>
              
              {isExpanded && (
                <div className="ml-3 text-left animate-in fade-in duration-300 overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.firstName || 'User'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs text-sidebar-text-secondary truncate">
                      {user?.gmail || 'user@example.com'}
                    </p>
                  </div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="right" 
            align="end" 
            className="w-64 ml-2 bg-popover border border-sidebar-border shadow-xl"
          >
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center ring-2 ring-sidebar-border overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName || 'User avatar'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-text-secondary truncate">
                    {user?.gmail || 'user@example.com'}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer px-4 py-2.5"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
