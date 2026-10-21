'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isHydrated, hydrate, refreshMe } = useAdminStore();
  const [checking, setChecking] = useState(true);
  const initialRefreshDone = useRef(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    // 1. Check if token exists
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      router.replace('/login');
      return;
    }

    // 2. Check if active store exists (unless they are visiting /select-store)
    const storedStore = localStorage.getItem('active_store_code');
    if (!storedStore && pathname !== '/select-store') {
      router.replace('/select-store');
      return;
    }

    setChecking(false);

    // Initial background session synchronization (runs once per session load, not on every re-render)
    if (!initialRefreshDone.current) {
      initialRefreshDone.current = true;
      refreshMe();
    }
  }, [isHydrated, pathname, router, refreshMe]);

  if (!isHydrated || checking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f7efe5] flex items-center justify-center text-[#c69b61] shadow-inner">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Validating Admin Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#faf9f6]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
