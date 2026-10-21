'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Product, Category } from '@/types/admin';
import { formatPrice } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package, 
  Eye, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  ImageIcon,
  FolderTree,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsListPage() {
  const { activeStore } = useAdminStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete modal state
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const storeCode = activeStore?.store_code;

  const fetchProducts = useCallback(async () => {
    if (!storeCode) return;
    setIsLoading(true);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: 12,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await adminApiClient.get<ApiResponse<Product[]>>('/admin/products', {
        params,
      });

      if (res.data?.success) {
        setProducts(res.data.data || []);
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page || 1);
          setTotalCount(res.data.meta.total || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      // If Stage 2 endpoint is not yet seeded on remote, provide graceful fallback
      toast.error('Unable to fetch products. Check if store catalog is initialized.');
    } finally {
      setIsLoading(false);
    }
  }, [storeCode, currentPage, searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load categories for filter
  useEffect(() => {
    async function fetchCategories() {
      if (!storeCode) return;
      try {
        const res = await adminApiClient.get<ApiResponse<Category[]>>('/admin/categories');
        if (res.data?.success) {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, [storeCode]);

  // Quick toggle active status
  const handleToggleActive = async (product: Product) => {
    const updatedStatus = !product.is_active;
    try {
      const res = await adminApiClient.patch(`/admin/products/${product.id}`, {
        is_active: updatedStatus,
      });
      if (res.status === 200) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: updatedStatus } : p))
        );
        toast.success(`Product ${updatedStatus ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) {
      toast.error('Failed to update product status.');
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteProductTarget) return;
    setIsDeleting(true);

    try {
      const res = await adminApiClient.delete(`/admin/products/${deleteProductTarget.id}`);
      if (res.status === 200 || res.data?.success) {
        toast.success(`"${deleteProductTarget.name}" deleted successfully.`);
        setProducts((prev) => prev.filter((p) => p.id !== deleteProductTarget.id));
        setDeleteProductTarget(null);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error?.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Products Catalog"
        subtitle={`Manage inventory, pricing, and media for ${activeStore?.store_name}`}
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#c69b61] focus:ring-2 focus:ring-[#ffc475]/30"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-700 focus:outline-none focus:border-[#c69b61]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-700 focus:outline-none focus:border-[#c69b61]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/categories">
            <Button variant="outline" size="md" className="font-semibold whitespace-nowrap gap-1.5">
              <FolderTree className="w-4 h-4 text-[#c69b61]" />
              Manage Categories
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="gold" size="md" className="font-semibold shadow-md whitespace-nowrap">
              <Plus className="w-4 h-4 mr-1.5" />
              Add New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Products Table Card */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">SKU</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Stock</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Loading catalog items...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-[#f7efe5] text-[#c69b61] flex items-center justify-center mb-3">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800">No products found</h4>
                      <p className="text-xs text-neutral-500 mt-1 mb-4">
                        {searchQuery || selectedCategory || selectedStatus
                          ? 'No products matched your active filters.'
                          : 'Get started by creating your first product for this store.'}
                      </p>
                      <Link href="/products/new">
                        <Button variant="gold" size="sm">
                          <Plus className="w-4 h-4 mr-1" /> Create Product
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.stock_quantity <= 10;
                  const isOutOfStock = product.stock_quantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Product Thumbnail & Name */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="font-bold text-neutral-900 hover:text-[#c69b61] transition"
                            >
                              {product.name}
                            </Link>
                            {product.is_featured && (
                              <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-6 font-mono font-medium text-neutral-600">
                        {product.sku || '—'}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-6 text-neutral-600">
                        {product.category_name || 'General'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-neutral-900">
                          {product.price_formatted ||
                            formatPrice(product.price_minor, activeStore?.default_currency)}
                        </span>
                        {product.compare_at_price_minor && (
                          <span className="text-[11px] text-neutral-400 line-through ml-1.5">
                            {product.compare_at_price_formatted ||
                              formatPrice(product.compare_at_price_minor, activeStore?.default_currency)}
                          </span>
                        )}
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {product.stock_quantity} in stock
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-6">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                            product.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
                          }`}
                        >
                          {product.is_active ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-neutral-500" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/products/${product.id}/edit`}>
                            <button
                              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteProductTarget(product)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing page {currentPage} of {totalPages} ({totalCount} total products)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product?"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Deleting <strong>{deleteProductTarget?.name}</strong> will soft-delete the catalog record to preserve historical order references.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeleteProductTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
