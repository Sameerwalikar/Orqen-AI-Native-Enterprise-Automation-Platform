import { ReactNode, useState, useEffect } from 'react';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

const TOPBAR_HEIGHT_REM = 4; // h-16

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Initialize state from localStorage, default to false (collapsed)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', JSON.stringify(isSidebarExpanded));
  }, [isSidebarExpanded]);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const sidebarWidth = isSidebarExpanded ? 240 : 64;

  return (
    <div className="min-h-screen bg-background">
      {/* Global fixed topbar */}
      <DashboardHeader
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={toggleSidebar}
      />

      {/* Content area below topbar */}
      <div
        className="flex"
        style={{
          paddingTop: `${TOPBAR_HEIGHT_REM}rem`,
        }}
      >
        {/* Sidebar fixed under topbar */}
        <DashboardSidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
        />

        {/* Main Content Wrapper */}
        <div
          className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out"
          style={{
            marginLeft: `${sidebarWidth}px`,
          }}
        >
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
