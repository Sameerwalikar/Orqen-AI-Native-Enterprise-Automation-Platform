import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface SidebarNavItemProps {
  icon?: ReactNode | string;
  label: string;
  href?: string;
  active?: boolean;
  nested?: boolean;
  onClick?: () => void;
}

const SidebarNavItem = ({ 
  icon, 
  label, 
  href = '#', 
  active = false,
  nested = false,
  onClick 
}: SidebarNavItemProps) => {
  const location = useLocation();
  const isActive = active || location.pathname === href;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
        transition-all duration-200
        ${nested ? 'pl-8' : ''}
        ${isActive 
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' 
          : 'text-sidebar-foreground hover:bg-sidebar-item-hover'
        }
      `}
      style={{
        color: isActive ? 'hsl(var(--sidebar-foreground))' : 'hsl(var(--sidebar-foreground))',
      }}
    >
      {icon && (
        <span className="flex-shrink-0 text-base leading-none">
          {typeof icon === 'string' ? icon : icon}
        </span>
      )}
      <span className="truncate">{label}</span>
    </a>
  );
};

export default SidebarNavItem;
