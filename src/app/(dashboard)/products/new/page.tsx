'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MediaUploader } from '@/components/media/MediaUploader';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Category, Product } from '@/types/admin';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const ProductSchema = Yup.object().shape({
  name: Yup.string().required('Product name is required').max(200),
  sku: Yup.string().required('SKU is required').max(100),
  category_id: Yup.number().nullable(),
  description: Yup.string(),
  price: Yup.number()
    .required('Price is required')
    .min(0, 'Price must be 0 or higher'),
  compare_at_price: Yup.number().nullable().min(0, 'Compare-at price must be 0 or higher'),
  stock_quantity: Yup.number()
    .required('Stock quantity is required')
    .min(0, 'Stock cannot be negative')
    .integer('Must be an integer'),
  is_active: Yup.boolean(),
  is_featured: Yup.boolean(),
  image_url: Yup.string().url('Must be a valid URL').nullable(),
});

export default function CreateProductPage() {
  const router = useRouter();
  const { activeStore } = useAdminStore();
  const [categories, setCategories] = useState<Category[]>([]);

  const storeCode = activeStore?.store_code;

  useEffect(() => {
    async function loadCategories() {
      if (!storeCode) return;
      try {
        const res = await adminApiClient.get<ApiResponse<Category[]>>('/admin/categories');
        if (res.data?.success) {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, [storeCode]);

  const formik = useFormik({
    initialValues: {
      name: '',
      slug: '',
      sku: '',
      category_id: '',
      description: '',
      price: '',
      compare_at_price: '',
      stock_quantity: 0,
      is_active: true,
      is_featured: false,
      image_url: '',
    },
    validationSchema: ProductSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Convert dollar values to minor currency units (cents)
        const priceMinor = Math.round(parseFloat(values.price as string) * 100);
        const compareAtMinor = values.compare_at_price
          ? Math.round(parseFloat(values.compare_at_price as string) * 100)
          : null;

        const payload: Record<string, any> = {
          name: values.name.trim(),
          slug: values.slug.trim() || values.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sku: values.sku.trim(),
          description: values.description.trim(),
          price_minor: priceMinor,
          stock_quantity: Number(values.stock_quantity),
          is_active: Boolean(values.is_active),
          is_featured: Boolean(values.is_featured),
        };

        if (values.category_id) {
          payload.category_id = Number(values.category_id);
        }
        if (compareAtMinor) {
          payload.compare_at_price_minor = compareAtMinor;
        }
        if (values.image_url) {
          payload.image_url = values.image_url;
          payload.images = [values.image_url];
        }

        const res = await adminApiClient.post<ApiResponse<Product>>('/admin/products', payload);

        if (res.status === 201 || res.data?.success) {
          toast.success(`Product "${values.name}" created successfully!`);
          router.push('/products');
        }
      } catch (err: any) {
        console.error('Create product error:', err);
        const msg = err.response?.data?.error?.message || 'Failed to create product.';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <button className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Create New Product</h1>
            <p className="text-xs text-neutral-500">
              Scoped to store: <strong className="text-neutral-800">{activeStore?.store_name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products">
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="button"
            variant="gold"
            size="md"
            className="font-bold"
            isLoading={formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save Product
          </Button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product Name *"
                placeholder="e.g. Botanical Radiance Serum"
                id="name"
                value={formik.values.name}
                onChange={(e) => {
                  formik.handleChange(e);
                  if (!formik.values.slug) {
                    formik.setFieldValue(
                      'slug',
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    );
                  }
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product Slug"
                  placeholder="e.g. botanical-radiance-serum"
                  id="slug"
                  value={formik.values.slug}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <Input
                  label="SKU (Stock Keeping Unit) *"
                  placeholder="e.g. GL-SRM-001"
                  id="sku"
                  value={formik.values.sku}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.sku && formik.errors.sku ? formik.errors.sku : undefined}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Category
                </label>
                <select
                  id="category_id"
                  value={formik.values.category_id}
                  onChange={formik.handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:border-[#c69b61]"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Description"
                placeholder="Write a compelling luxury description of the product and its botanical benefits..."
                id="description"
                rows={5}
                value={formik.values.description}
                onChange={formik.handleChange}
              />
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Regular Price (${activeStore?.default_currency || 'USD'}) *`}
                  type="number"
                  step="0.01"
                  placeholder="48.00"
                  id="price"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.price && formik.errors.price ? formik.errors.price : undefined}
                />
                <Input
                  label={`Compare-at / Strike-through Price (${activeStore?.default_currency || 'USD'})`}
                  type="number"
                  step="0.01"
                  placeholder="60.00"
                  id="compare_at_price"
                  value={formik.values.compare_at_price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <Input
                label="Stock Quantity *"
                type="number"
                placeholder="50"
                id="stock_quantity"
                value={formik.values.stock_quantity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.stock_quantity && formik.errors.stock_quantity
                    ? formik.errors.stock_quantity
                    : undefined
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: S3 Media & Flags */}
        <div className="space-y-6">
          {/* AWS S3 Media Uploader */}
          <Card>
            <CardHeader>
              <CardTitle>Product Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader
                value={formik.values.image_url}
                onChange={(url) => formik.setFieldValue('image_url', url)}
                folder="products"
                label="Main Product Image"
              />
            </CardContent>
          </Card>

          {/* Catalog Visibility & Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formik.values.is_active}
                  onChange={formik.handleChange}
                  className="w-4 h-4 text-[#c69b61] rounded border-neutral-300 focus:ring-[#ffc475]"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-800 block">Active in Store</span>
                  <span className="text-[11px] text-neutral-500">Visible on customer storefront</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#f7efe5]/40 border border-[#d5a667]/30 cursor-pointer">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formik.values.is_featured}
                  onChange={formik.handleChange}
                  className="w-4 h-4 text-[#c69b61] rounded border-neutral-300 focus:ring-[#ffc475]"
                />
                <div>
                  <span className="text-xs font-bold text-[#8c652f] block">Featured Product</span>
                  <span className="text-[11px] text-neutral-500">Highlight in top store collections</span>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
