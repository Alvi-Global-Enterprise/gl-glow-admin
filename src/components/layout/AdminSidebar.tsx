'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Store, 
  LogOut, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { cn, getRoleBadgeColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { staff, activeStore, logout } = useAdminStore();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Products',
      href: '/products',
      icon: Package,
    },
    {
      title: 'Categories',
      href: '/categories',
      icon: FolderTree,
    },
    {
      title: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Switch Store',
      href: '/select-store',
      icon: Store,
    },
  ];

  const roleColors = activeStore?.role ? getRoleBadgeColor(activeStore.role) : null;

  return (
    <aside className="w-64 bg-white border-r border-neutral-100 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div>
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#d5a667]/25 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="GL Glow Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-900 block leading-tight font-[family-name:var(--font-display)]">
                GL GLOW
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c69b61]">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Current Store Context Badge */}
        {activeStore && (
          <div className="mx-4 my-4 p-3.5 rounded-2xl bg-gradient-to-br from-[#f7efe5]/80 to-[#ffffff] border border-[#d5a667]/25 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
                Active Workspace
              </span>
              <span className="text-[10px] font-mono text-[#c69b61] font-semibold">
                {activeStore.default_currency}
              </span>
            </div>
            <p className="font-bold text-sm text-neutral-900 truncate" title={activeStore.store_name}>
              {activeStore.store_name}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-mono text-neutral-500 bg-white/80 px-1.5 py-0.5 rounded border border-neutral-200 truncate">
                {activeStore.store_code}
              </span>
              {roleColors && (
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', roleColors.bg, roleColors.text, roleColors.border)}>
                  {activeStore.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-[#ffc475]' : 'text-neutral-400 group-hover:text-neutral-700'
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#ffc475]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Staff User Footer */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#f7efe5] text-[#8c652f] flex items-center justify-center font-bold text-xs shrink-0 border border-[#d5a667]/40">
              {staff?.first_name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-neutral-800 truncate">
                {staff?.full_name || staff?.email || 'Staff Admin'}
              </p>
              <div className="flex items-center gap-1">
                {staff?.is_platform_admin ? (
                  <span className="text-[9px] font-bold text-[#c69b61] flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> Platform Admin
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-400 truncate">{staff?.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
