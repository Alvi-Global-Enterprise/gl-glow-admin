'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MediaUploader } from '@/components/media/MediaUploader';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Category, Product } from '@/types/admin';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ProductSchema = Yup.object().shape({
  name: Yup.string().required('Product name is required').max(200),
  sku: Yup.string().required('SKU is required').max(100),
  category_id: Yup.number().nullable(),
  description: Yup.string(),
  price: Yup.number().required('Price is required').min(0),
  compare_at_price: Yup.number().nullable().min(0),
  stock_quantity: Yup.number().required('Stock quantity is required').min(0).integer(),
  is_active: Yup.boolean(),
  is_featured: Yup.boolean(),
  image_url: Yup.string().url('Must be a valid URL').nullable(),
});

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { activeStore } = useAdminStore();

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

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
        const priceMinor = Math.round(parseFloat(values.price as string) * 100);
        const compareAtMinor = values.compare_at_price
          ? Math.round(parseFloat(values.compare_at_price as string) * 100)
          : null;

        const payload: Record<string, any> = {
          name: values.name.trim(),
          slug: values.slug.trim(),
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
        }

        const res = await adminApiClient.put<ApiResponse<Product>>(`/admin/products/${productId}`, payload);

        if (res.status === 200 || res.data?.success) {
          toast.success(`Product "${values.name}" updated successfully!`);
          router.push('/products');
        }
      } catch (err: any) {
        console.error('Update product error:', err);
        const msg = err.response?.data?.error?.message || 'Failed to update product.';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const storeCode = activeStore?.store_code;

  // Load product & categories
  useEffect(() => {
    async function initData() {
      if (!storeCode || !productId) return;
      setIsLoadingProduct(true);
      try {
        const [categoriesRes, productRes] = await Promise.allSettled([
          adminApiClient.get<ApiResponse<Category[]>>('/admin/categories'),
          adminApiClient.get<ApiResponse<Product>>(`/admin/products/${productId}`),
        ]);

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data?.success) {
          setCategories(categoriesRes.value.data.data || []);
        }

        if (productRes.status === 'fulfilled' && productRes.value.data?.success) {
          const p = productRes.value.data.data;
          formik.setValues({
            name: p.name || '',
            slug: p.slug || '',
            sku: p.sku || '',
            category_id: p.category_id ? String(p.category_id) : '',
            description: p.description || '',
            price: p.price_minor ? (p.price_minor / 100).toFixed(2) : '',
            compare_at_price: p.compare_at_price_minor ? (p.compare_at_price_minor / 100).toFixed(2) : '',
            stock_quantity: p.stock_quantity ?? 0,
            is_active: p.is_active ?? true,
            is_featured: p.is_featured ?? false,
            image_url: p.image_url || '',
          });
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        toast.error('Unable to fetch product details.');
      } finally {
        setIsLoadingProduct(false);
      }
    }
    initData();
  }, [productId, storeCode]);

  if (isLoadingProduct) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#c69b61] animate-spin mb-3" />
        <p className="text-xs font-semibold text-neutral-500">Loading product information...</p>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Edit Product #{productId}
            </h1>
            <p className="text-xs text-neutral-500">
              Workspace: <strong className="text-neutral-800">{activeStore?.store_name}</strong>
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
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Product Name *"
                id="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product Slug"
                  id="slug"
                  value={formik.values.slug}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <Input
                  label="SKU *"
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
                id="description"
                rows={5}
                value={formik.values.description}
                onChange={formik.handleChange}
              />
            </CardContent>
          </Card>

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
                  id="price"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.price && formik.errors.price ? formik.errors.price : undefined}
                />
                <Input
                  label={`Compare-at Price (${activeStore?.default_currency || 'USD'})`}
                  type="number"
                  step="0.01"
                  id="compare_at_price"
                  value={formik.values.compare_at_price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>

              <Input
                label="Stock Quantity *"
                type="number"
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MediaUploader
                value={formik.values.image_url}
                onChange={(url) => formik.setFieldValue('image_url', url)}
                folder="products"
                label="Product Image (AWS S3)"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility & Status</CardTitle>
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
                  <span className="text-[11px] text-neutral-500">Visible on storefront</span>
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
                  <span className="text-[11px] text-neutral-500">Show in featured collections</span>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
