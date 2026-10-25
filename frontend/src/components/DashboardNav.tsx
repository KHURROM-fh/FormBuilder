'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function DashboardNav() {
  const pathname = usePathname();
  const { showToast } = useToast();

  const handleRefresh = () => {
    showToast('Refreshing data...', 'info');
    window.location.reload();
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'All Forms', href: '/dashboard/forms', icon: FileText },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav className="flex items-center gap-1 -mb-px text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 border-b-2 py-4 px-3.5 transition ${
                  isActive
                    ? 'border-blue-600 font-semibold text-blue-600'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 py-2.5">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh dashboard data from backend server"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
