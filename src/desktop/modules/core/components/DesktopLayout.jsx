import React, { memo, useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DesktopLayout = memo(function DesktopLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden h-10 w-10 flex items-center justify-center rounded-md bg-zinc-900 text-zinc-50 shadow-lg hover:bg-zinc-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 overflow-hidden">
        {/* 👇 THIS IS THE KEY CHANGE */}
        <Outlet />
      </div>
    </div>
  );
});

export default DesktopLayout;
