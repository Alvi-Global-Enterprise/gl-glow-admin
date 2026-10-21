'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Order, Product } from '@/types/admin';
import { formatPrice, formatDate, getOrderStatusBadge } from '@/lib/utils';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  Store, 
  Clock, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { staff, activeStore } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storeCode = activeStore?.store_code;

  useEffect(() => {
    async function fetchDashboardData() {
      if (!storeCode) return;
      setIsLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.allSettled([
          adminApiClient.get<ApiResponse<Order[]>>('/admin/orders', { params: { per_page: 5 } }),
          adminApiClient.get<ApiResponse<Product[]>>('/admin/products', { params: { per_page: 10 } }),
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.success) {
          setOrders(ordersRes.value.data.data || []);
        }
        if (productsRes.status === 'fulfilled' && productsRes.value.data?.success) {
          setProducts(productsRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [storeCode]);

  // Metric computations
  const totalRevenueMinor = orders.reduce((acc, o) => acc + (o.total_minor || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const lowStockProducts = products.filter((p) => p.stock_quantity <= 10);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Store Overview"
        subtitle={`Real-time dashboard for ${activeStore?.store_name || 'selected store'}`}
      />

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-[#3d2f21] p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#d5a667]/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-[#ffc475] mb-3">
              <Store className="w-3.5 h-3.5" />
              <span>Workspace: {activeStore?.store_name} ({activeStore?.store_code})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
              Welcome back, {staff?.first_name || 'Admin'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
              All inventory, order processing, and media assets are currently scoped to this store. You can manage products or fulfill customer orders below.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/products/new">
              <Button variant="gold" size="md" className="font-semibold shadow-lg">
                <Plus className="w-4 h-4 mr-1.5" />
                Add New Product
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                View Orders Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-[#d5a667]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Store Orders
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">
              {isLoading ? '—' : orders.length}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
              <span className="text-emerald-600 font-semibold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> Active
              </span>
              <span>Across current queue</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#d5a667]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Pending Orders
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">
              {isLoading ? '—' : pendingOrdersCount}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700">
              <span>Requires fulfillment dispatch</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#d5a667]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Catalog Items
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#f7efe5] text-[#c69b61] flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">
              {isLoading ? '—' : products.length}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
              <span>Products in active store</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-[#d5a667]/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Low Stock Items
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-neutral-900 tracking-tight">
              {isLoading ? '—' : lowStockProducts.length}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600">
              <span>Under 10 units threshold</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Quick Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col justify-between">
            <div>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Latest customer orders for {activeStore?.store_name}
                  </p>
                </div>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="text-xs text-[#c69b61] hover:text-[#8c652f]">
                    View all &rarr;
                  </Button>
                </Link>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-6">Order ID</th>
                      <th className="py-3 px-6">Customer</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Total</th>
                      <th className="py-3 px-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400">
                          Loading store orders...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400">
                          No orders recorded for this store yet.
                        </td>
                      </tr>
                    ) : (
                      orders.slice(0, 5).map((order) => {
                        const statusBadge = getOrderStatusBadge(order.status);
                        return (
                          <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-neutral-800">
                              <Link href="/orders" className="hover:text-[#c69b61]">
                                {order.order_number}
                              </Link>
                            </td>
                            <td className="py-3.5 px-6 text-neutral-600">
                              {order.customer_email || order.customer?.email || 'Guest Customer'}
                            </td>
                            <td className="py-3.5 px-6">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                                <span className="capitalize">{order.status}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-6 font-bold text-neutral-900">
                              {order.total_formatted || formatPrice(order.total_minor, order.currency || activeStore?.default_currency)}
                            </td>
                            <td className="py-3.5 px-6 text-right text-neutral-400 font-mono text-[11px]">
                              {formatDate(order.created_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Low Stock Alerts & Quick Actions (1 Col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Stock Alerts</span>
                </CardTitle>
                <p className="text-xs text-neutral-500 mt-0.5">Critical inventory levels</p>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs text-[#c69b61]">
                  Manage
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-600 font-medium flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <span>All product inventories are well-stocked.</span>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100"
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-bold text-neutral-800 truncate">{p.name}</p>
                      <p className="text-[10px] font-mono text-neutral-400">SKU: {p.sku}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                        p.stock_quantity === 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.stock_quantity} left
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Store Info Card */}
          <Card className="bg-gradient-to-br from-[#f7efe5]/70 to-[#ffffff] border-[#d5a667]/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#d5a667]/40 flex items-center justify-center text-[#c69b61] shadow-sm">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">{activeStore?.store_name}</h4>
                  <p className="text-xs text-neutral-500 font-mono">Tenant Code: {activeStore?.store_code}</p>
                </div>
              </div>
              <div className="text-xs text-neutral-600 space-y-1.5 border-t border-neutral-200/50 pt-3">
                <div className="flex justify-between">
                  <span>Role Authorization:</span>
                  <strong className="text-neutral-800 uppercase">{activeStore?.role.replace('_', ' ')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Default Currency:</span>
                  <strong className="text-neutral-800 font-mono">{activeStore?.default_currency}</strong>
                </div>
              </div>
              <Link href="/select-store" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Switch to Another Workspace
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
