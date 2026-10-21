'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      const activeStore = localStorage.getItem('active_store_code');

      if (!token) {
        router.replace('/login');
      } else if (!activeStore) {
        router.replace('/select-store');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#faf9f6]">
      <div className="w-12 h-12 rounded-2xl bg-[#f7efe5] flex items-center justify-center text-[#c69b61] shadow-inner mb-3">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Redirecting to Admin Console...
      </p>
    </div>
  );
}
