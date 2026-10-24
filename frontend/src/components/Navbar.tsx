'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FormInput, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Features', href: '/features' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 transition hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <FormInput className="h-4 w-4" />
          </div>
          <span className="tracking-tight">
            Form<span className="text-blue-600">Builder</span>
          </span>
        </Link>

        {/* Dedicated Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition ${
                  isActive
                    ? 'text-blue-600 font-semibold bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {user && (
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                pathname === '/dashboard'
                  ? 'text-blue-600 font-semibold bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}
        </nav>

        {/* Auth CTA Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:flex flex-col text-right hover:opacity-80 transition"
              >
                <span className="text-sm font-medium text-slate-900">{user.name}</span>
                <span className="text-xs text-slate-500">{user.email}</span>
              </Link>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200">
                {user.name ? user.name[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
