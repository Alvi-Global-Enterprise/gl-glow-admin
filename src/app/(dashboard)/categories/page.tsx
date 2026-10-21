'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import categoryService from '@/lib/categoryService';
import { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/admin';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import {
  FolderTree,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Folder,
  FolderPlus,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ArrowUpDown,
  Tag,
  Copy,
  Check,
} from 'lucide-react';

// Form validation schema
const categorySchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .required('Category name is required'),
  slug: Yup.string()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g., face-masks)')
    .required('Slug is required'),
  description: Yup.string().max(500, 'Description cannot exceed 500 characters').nullable(),
  parent_id: Yup.mixed().nullable(),
  sort_order: Yup.number().integer('Must be an integer').min(0, 'Sort order cannot be negative').default(0),
  is_active: Yup.boolean().default(true),
});

export default function CategoriesPage() {
  const { activeStore } = useAdminStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [parentFilter, setParentFilter] = useState<'all' | 'root' | 'sub'>('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal States
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copied slug state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const storeCode = activeStore?.store_code;

  // Utility to generate URL slug from name
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    if (!storeCode) return;
    setIsLoading(true);

    try {
      const res = await categoryService.listCategories();
      if (res?.success) {
        setCategories(res.data || []);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      toast.error('Unable to fetch categories. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  }, [storeCode]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Formik setup for Create / Edit
  const formik = useFormik({
    initialValues: {
      name: '',
      slug: '',
      description: '',
      parent_id: '' as string | number,
      sort_order: 0,
      is_active: true,
    },
    validationSchema: categorySchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const payload: CreateCategoryPayload = {
          name: values.name.trim(),
          slug: values.slug.trim(),
          description: values.description?.trim() || undefined,
          parent_id: values.parent_id !== '' && values.parent_id !== null ? Number(values.parent_id) : null,
          sort_order: Number(values.sort_order) || 0,
          is_active: Boolean(values.is_active),
        };

        if (editingCategory) {
          // Update category
          const res = await categoryService.updateCategory(editingCategory.id, payload);
          if (res?.success) {
            toast.success(`Category "${values.name}" updated successfully!`);
            setIsFormModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
          } else {
            toast.error(res?.error?.message || 'Failed to update category.');
          }
        } else {
          // Create category
          const res = await categoryService.createCategory(payload);
          if (res?.success) {
            toast.success(`Category "${values.name}" created successfully!`);
            setIsFormModalOpen(false);
            formik.resetForm();
            fetchCategories();
          } else {
            toast.error(res?.error?.message || 'Failed to create category.');
          }
        }
      } catch (err: any) {
        console.error('Error saving category:', err);
        const serverMsg = err.response?.data?.error?.message || err.message || 'Operation failed';
        toast.error(serverMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    formik.resetForm({
      values: {
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        sort_order: 0,
        is_active: true,
      },
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    formik.resetForm({
      values: {
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        parent_id: cat.parent_id ?? '',
        sort_order: cat.sort_order ?? 0,
        is_active: Boolean(cat.is_active),
      },
    });
    setIsFormModalOpen(true);
  };

  // Quick toggle active status
  const handleToggleActive = async (cat: Category) => {
    const newStatus = !cat.is_active;
    try {
      // Optimistic update
      setCategories((prev) =>
        prev.map((item) => (item.id === cat.id ? { ...item, is_active: newStatus } : item))
      );

      const res = await categoryService.toggleActive(cat.id, newStatus);
      if (res?.success) {
        toast.success(`Category ${newStatus ? 'activated' : 'deactivated'}.`);
      } else {
        // Rollback
        fetchCategories();
        toast.error('Failed to update category status.');
      }
    } catch (err: any) {
      console.error('Toggle status error:', err);
      fetchCategories();
      toast.error('Failed to change category status.');
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      const res = await categoryService.deleteCategory(categoryToDelete.id);
      if (res?.success) {
        toast.success(`Category "${categoryToDelete.name}" deleted.`);
        setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
      } else {
        toast.error(res?.error?.message || 'Failed to delete category.');
      }
    } catch (err: any) {
      console.error('Delete category error:', err);
      const msg = err.response?.data?.error?.message || 'Could not delete category.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper map for parent names
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && cat.is_active) ||
        (statusFilter === 'inactive' && !cat.is_active);

      // Parent/Hierarchy
      const matchesParent =
        parentFilter === 'all' ||
        (parentFilter === 'root' && !cat.parent_id) ||
        (parentFilter === 'sub' && !!cat.parent_id);

      return matchesSearch && matchesStatus && matchesParent;
    });
  }, [categories, searchQuery, statusFilter, parentFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.is_active).length;
    const root = categories.filter((c) => !c.parent_id).length;
    const sub = categories.filter((c) => !!c.parent_id).length;
    return { total, active, root, sub };
  }, [categories]);

  // Eligible parent categories (prevent self-selection when editing)
  const eligibleParents = useMemo(() => {
    if (!editingCategory) return categories;
    return categories.filter((c) => c.id !== editingCategory.id);
  }, [categories, editingCategory]);

  const copySlugToClipboard = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.info(`Copied slug "${slug}"`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <AdminHeader
        title="Categories Management"
        subtitle={`Organize store hierarchy, taxonomy, and catalog tags for [${activeStore?.store_name || storeCode || 'Active Store'}]`}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-neutral-100 shadow-sm bg-white hover:border-[#d5a667]/40 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Categories</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1 font-[family-name:var(--font-display)]">
                {metrics.total}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#f7efe5] flex items-center justify-center text-[#c69b61]">
              <FolderTree className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 shadow-sm bg-white hover:border-emerald-200 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Active Categories</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-[family-name:var(--font-display)]">
                {metrics.active}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 shadow-sm bg-white hover:border-[#d5a667]/40 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Root Categories</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1 font-[family-name:var(--font-display)]">
                {metrics.root}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <Folder className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-100 shadow-sm bg-white hover:border-[#d5a667]/40 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Subcategories</p>
              <h3 className="text-2xl font-bold text-neutral-900 mt-1 font-[family-name:var(--font-display)]">
                {metrics.sub}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <Card className="border border-neutral-100 shadow-sm bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, slug or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-[#c69b61] focus:ring-2 focus:ring-[#ffc475]/30 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Controls & Create Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === 'inactive'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Inactive
                </button>
              </div>

              {/* Hierarchy Filter */}
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 outline-none focus:border-[#c69b61] transition cursor-pointer"
              >
                <option value="all">All Hierarchies</option>
                <option value="root">Root Categories Only</option>
                <option value="sub">Subcategories Only</option>
              </select>

              {/* Add Category Button */}
              <Button
                variant="gold"
                onClick={handleOpenCreateModal}
                className="gap-2 shrink-0 font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Categories Table */}
      <Card className="border border-neutral-100 shadow-sm bg-white overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-neutral-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#c69b61]" />
            Catalog Categories ({filteredCategories.length})
          </CardTitle>
          <button
            onClick={() => fetchCategories()}
            disabled={isLoading}
            className="text-xs text-neutral-500 hover:text-[#c69b61] flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-[#f7efe5] flex items-center justify-center text-[#c69b61] animate-spin mb-3">
                <FolderTree className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Loading Categories...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#f7efe5] text-[#c69b61] mx-auto flex items-center justify-center mb-4">
                <FolderTree className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="text-base font-bold text-neutral-900">No categories found</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5">
                {searchQuery || statusFilter !== 'all' || parentFilter !== 'all'
                  ? 'No categories matched your search criteria. Try resetting filters.'
                  : 'Get started by creating the first category for your store catalog.'}
              </p>
              {searchQuery || statusFilter !== 'all' || parentFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setParentFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={handleOpenCreateModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Category
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-6">Name & Slug</th>
                    <th className="py-3 px-6">Hierarchy Level</th>
                    <th className="py-3 px-6 text-center">Sort Order</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredCategories.map((cat) => {
                    const parentCat = cat.parent_id ? categoryMap.get(cat.parent_id) : null;
                    const isSubcategory = !!cat.parent_id;

                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-neutral-50/80 transition-colors group"
                      >
                        {/* Name & Slug */}
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSubcategory
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-[#f7efe5] text-[#c69b61]'
                              }`}
                            >
                              {isSubcategory ? (
                                <Layers className="w-4 h-4" />
                              ) : (
                                <Folder className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-neutral-900 text-sm tracking-tight truncate">
                                {cat.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                  /{cat.slug}
                                </span>
                                <button
                                  onClick={() => copySlugToClipboard(cat.slug)}
                                  className="text-neutral-400 hover:text-neutral-700 transition"
                                  title="Copy slug"
                                >
                                  {copiedSlug === cat.slug ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              {cat.description && (
                                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1 max-w-md">
                                  {cat.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Hierarchy Level */}
                        <td className="py-4 px-6">
                          {isSubcategory ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-400 text-xs">↳</span>
                              <Badge variant="outline" className="text-[11px] bg-blue-50/50 text-blue-700 border-blue-200">
                                {parentCat ? parentCat.name : `Parent ID: ${cat.parent_id}`}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[11px] bg-amber-50/60 text-amber-800 border-amber-200">
                              Root Category
                            </Badge>
                          )}
                        </td>

                        {/* Sort Order */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center justify-center font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700">
                            #{cat.sort_order ?? 0}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                              cat.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cat.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                              }`}
                            />
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCategoryToDelete(cat)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE & EDIT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsFormModalOpen(false);
        }}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        description={
          editingCategory
            ? 'Modify category details, hierarchy and visibility.'
            : 'Fill in the information below to add a new category to your store catalog.'
        }
        maxWidth="lg"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <Input
              label="Category Name *"
              id="category-name"
              placeholder="e.g. Cleansers & Toners"
              name="name"
              value={formik.values.name}
              onChange={(e) => {
                formik.handleChange(e);
                // Auto-generate slug if slug is pristine or was auto-generated
                if (!editingCategory || !formik.values.slug) {
                  formik.setFieldValue('slug', slugify(e.target.value));
                }
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
            />
          </div>

          {/* Slug Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="category-slug"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
              >
                Slug *
              </label>
              <button
                type="button"
                onClick={() => formik.setFieldValue('slug', slugify(formik.values.name))}
                className="text-[11px] font-semibold text-[#c69b61] hover:underline cursor-pointer"
              >
                Regenerate from name
              </button>
            </div>
            <Input
              id="category-slug"
              placeholder="e.g. cleansers-and-toners"
              name="slug"
              value={formik.values.slug}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.slug && formik.errors.slug ? formik.errors.slug : undefined}
              helperText="Unique URL identifier for routing and filters."
            />
          </div>

          {/* Parent Category & Sort Order (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Category Select */}
            <div className="space-y-1.5">
              <label
                htmlFor="category-parent"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600"
              >
                Parent Category
              </label>
              <select
                id="category-parent"
                name="parent_id"
                value={formik.values.parent_id}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 text-sm outline-none focus:border-[#c69b61] focus:ring-2 focus:ring-[#ffc475]/30 transition"
              >
                <option value="">None (Top-Level Root Category)</option>
                {eligibleParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} {parent.parent_id ? ' (Subcategory)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-500">
                Choose a parent to make this a nested subcategory.
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <Input
                label="Sort Order"
                id="category-sort-order"
                type="number"
                min={0}
                name="sort_order"
                value={formik.values.sort_order}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.sort_order && formik.errors.sort_order
                    ? formik.errors.sort_order
                    : undefined
                }
                helperText="Lower numbers appear first (e.g. 0, 1, 2)."
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <Textarea
              label="Description (Optional)"
              id="category-description"
              placeholder="Brief description of this collection or category..."
              rows={3}
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.description && formik.errors.description
                  ? formik.errors.description
                  : undefined
              }
            />
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="category-is-active"
              name="is_active"
              checked={formik.values.is_active}
              onChange={formik.handleChange}
              className="w-4 h-4 rounded border-neutral-300 text-[#c69b61] focus:ring-[#c69b61] cursor-pointer"
            />
            <label htmlFor="category-is-active" className="text-xs font-semibold text-neutral-800 cursor-pointer">
              Active Category (visible on storefront and product selector)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              isLoading={isSubmitting}
              className="font-semibold px-6 shadow-sm"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!categoryToDelete}
        onClose={() => {
          if (!isDeleting) setCategoryToDelete(null);
        }}
        title="Delete Category"
        description="Are you sure you want to permanently delete this category?"
        maxWidth="md"
      >
        {categoryToDelete && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 space-y-1">
                <p className="font-bold">Caution: Destructive Action</p>
                <p>
                  Deleting <strong>&quot;{categoryToDelete.name}&quot;</strong> may affect products associated
                  with this category. Any subcategories pointing to this category will need reassignment.
                </p>
              </div>
            </div>

            <div className="py-2 text-xs text-neutral-600 space-y-1.5 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <p>
                <span className="font-semibold text-neutral-800">Category Name:</span> {categoryToDelete.name}
              </p>
              <p>
                <span className="font-semibold text-neutral-800">Slug:</span> {categoryToDelete.slug}
              </p>
              <p>
                <span className="font-semibold text-neutral-800">Level:</span>{' '}
                {categoryToDelete.parent_id ? 'Nested Subcategory' : 'Top-Level Root Category'}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteCategory}
              >
                Delete Category
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
