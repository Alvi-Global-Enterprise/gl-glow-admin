'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { StoreMembership } from '@/types/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  LogOut, 
  Sparkles, 
  RefreshCw,
  Building2
} from 'lucide-react';
import { getRoleBadgeColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SelectStorePage() {
  const router = useRouter();
  const { staff, stores, activeStore, canAccessAllStores, isHydrated, hydrate, refreshMe, setActiveStore, logout, isLoading } = useAdminStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.replace('/login');
    }
  }, [isHydrated, router]);

  const handleLaunchStore = (store: StoreMembership) => {
    setActiveStore(store);
    toast.success(`Entering ${store.store_name}...`);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7efe5]/40 via-[#ffffff] to-[#faf9f6] p-6 lg:p-12 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-8 border-b border-neutral-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#d5a667] to-[#ffc475] flex items-center justify-center text-white shadow-md shadow-[#c69b61]/20">
            <Sparkles className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-neutral-900 font-[family-name:var(--font-display)]">
              GL GLOW
            </h1>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-[#c69b61]">
              Multi-Store Workspace Switcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshMe()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#c69b61]')} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl w-full mx-auto my-8 flex-1">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#c69b61]">
                Authorized Store Workspaces
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
                Select a store to manage
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Logged in as <strong className="text-neutral-800">{staff?.full_name || staff?.email}</strong>. Choose an authorized store tenant below to launch its scoped admin portal.
              </p>
            </div>

            {canAccessAllStores && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold self-start">
                <ShieldCheck className="w-4 h-4 text-[#c69b61]" />
                <span>Platform Super Admin: Universal Store Access Enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Cards Grid */}
        {stores.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-800">No Store Memberships Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-6">
              Your staff account does not currently have active memberships assigned to any store tenant. Please contact the platform administrator.
            </p>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Back to Login
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const isSelected = activeStore?.store_code === store.store_code;
              const roleColors = getRoleBadgeColor(store.role);

              return (
                <div
                  key={store.store_id}
                  onClick={() => handleLaunchStore(store)}
                  className={cn(
                    'group relative rounded-3xl p-6 bg-white border transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-[#c69b61]/15 hover:-translate-y-1',
                    isSelected
                      ? 'border-[#c69b61] ring-2 ring-[#ffc475]/40 shadow-lg shadow-[#c69b61]/10'
                      : 'border-neutral-200/80 hover:border-[#d5a667]'
                  )}
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f7efe5] to-neutral-50 border border-[#d5a667]/30 flex items-center justify-center text-[#c69b61] group-hover:scale-105 transition-transform">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase', roleColors.bg, roleColors.text, roleColors.border)}>
                          {store.role.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 font-medium">
                          ID: #{store.store_id}
                        </span>
                      </div>
                    </div>

                    {/* Store Title */}
                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-[#c69b61] transition-colors leading-snug">
                      {store.store_name}
                    </h3>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-mono bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-lg border border-neutral-200">
                        {store.store_code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#f7efe5] text-[#8c652f] px-2.5 py-1 rounded-lg border border-[#d5a667]/30">
                        <Coins className="w-3 h-3 text-[#c69b61]" />
                        {store.default_currency}
                      </span>
                      {store.is_active && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Launch button */}
                  <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600 group-hover:text-neutral-900">
                      {isSelected ? 'Currently Selected' : 'Launch Workspace'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-[#c69b61] group-hover:text-white flex items-center justify-center text-neutral-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto pt-6 border-t border-neutral-200/60 text-center">
        <p className="text-xs text-neutral-400">
          Selected store determines the tenant scope for products, orders, and fulfillment operations.
        </p>
      </div>
    </div>
  );
}
