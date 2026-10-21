'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/store/useAdminStore';
import { Store, ChevronDown, Check, Sparkles, RefreshCw } from 'lucide-react';
import { StoreMembership } from '@/types/admin';
import { getRoleBadgeColor, cn } from '@/lib/utils';
import { toast } from 'sonner';

export const AdminHeader: React.FC<{ title?: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const router = useRouter();
  const { stores, activeStore, setActiveStore, refreshMe, isLoading } = useAdminStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSelectStore = (store: StoreMembership) => {
    setActiveStore(store);
    setDropdownOpen(false);
    toast.success(`Switched active workspace to "${store.store_name}"`);
    // Refresh current page to reload data under new X-Store-Code
    router.refresh();
  };

  const handleManualRefresh = async () => {
    await refreshMe();
    toast.info('Session state synchronized with server.');
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-bold text-neutral-900 tracking-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Sync Button */}
        <button
          onClick={handleManualRefresh}
          disabled={isLoading}
          title="Sync with Backend"
          className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin text-[#c69b61]')} />
        </button>

        {/* Store Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 hover:border-[#d5a667] bg-neutral-50 hover:bg-white text-xs font-semibold text-neutral-800 transition shadow-sm cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-[#c69b61]" />
            <span className="max-w-[140px] truncate">
              {activeStore ? activeStore.store_name : 'Select Store'}
            </span>
            <ChevronDown className={cn('w-3.5 h-3.5 text-neutral-400 transition-transform', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Switch Store Workspace
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {stores.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      No authorized stores found.
                    </div>
                  ) : (
                    stores.map((s) => {
                      const isCurrent = activeStore?.store_code === s.store_code;
                      const roleColors = getRoleBadgeColor(s.role);

                      return (
                        <button
                          key={s.store_id}
                          onClick={() => handleSelectStore(s)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer',
                            isCurrent && 'bg-[#f7efe5]/50'
                          )}
                        >
                          <div className="overflow-hidden pr-2">
                            <p className="text-xs font-bold text-neutral-900 truncate">
                              {s.store_name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-neutral-400">
                                {s.store_code}
                              </span>
                              <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-semibold', roleColors.bg, roleColors.text)}>
                                {s.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#c69b61] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="pt-2 px-3 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push('/select-store');
                    }}
                    className="w-full text-center text-xs font-medium text-[#c69b61] hover:text-[#8c652f] py-1 cursor-pointer"
                  >
                    Manage all workspaces &rarr;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
