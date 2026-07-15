import { ReactNode, useState } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  searchable?: boolean;
  addable?: boolean;
}

const SidebarSection = ({ 
  title, 
  children, 
  defaultExpanded = false,
  searchable = false,
  addable = false 
}: SidebarSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-3 py-2 group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider flex-1"
          style={{ color: 'hsl(var(--sidebar-text-secondary))' }}
        >
          <span>{title}</span>
          <ChevronDown 
            className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {searchable && (
            <button 
              className="p-1 hover:bg-sidebar-accent rounded transition-colors"
              aria-label="Search"
            >
              <Search className="h-3 w-3" style={{ color: 'hsl(var(--sidebar-text-secondary))' }} />
            </button>
          )}
          {addable && (
            <button 
              className="p-1 hover:bg-sidebar-accent rounded transition-colors"
              aria-label="Add item"
            >
              <Plus className="h-3 w-3" style={{ color: 'hsl(var(--sidebar-text-secondary))' }} />
            </button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
