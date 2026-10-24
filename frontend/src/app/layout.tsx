import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'FormBuilder — Interactive Forms & Chatbot Widget Platform',
  description: 'Create interactive forms, embed chatbot widgets on any website, collect responses and manage submissions through a clean dashboard.',
};

import React, { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        <AuthProvider>
          <ToastProvider>
            <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
              <Navbar />
            </Suspense>
            <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
              <main className="flex-1 bg-white">{children}</main>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
