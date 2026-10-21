'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAdminStore } from '@/store/useAdminStore';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, Order, OrderStatus, PaymentStatus } from '@/types/admin';
import { formatPrice, formatDate, getOrderStatusBadge, cn } from '@/lib/utils';
import { 
  Search, 
  ShoppingCart, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  PackageCheck,
  RefreshCw,
  ExternalLink,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

const FulfillmentSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .required('Status is required'),
  tracking_number: Yup.string().when('status', {
    is: 'shipped',
    then: (schema) => schema.required('Tracking number is required when order is marked shipped'),
    otherwise: (schema) => schema.nullable(),
  }),
  carrier: Yup.string().when('status', {
    is: 'shipped',
    then: (schema) => schema.required('Shipping carrier (e.g. FedEx, DHL, TCS) is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  notes: Yup.string().nullable(),
});

export default function OrdersPage() {
  const { activeStore } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Selected Order for Detail / Fulfillment Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const storeCode = activeStore?.store_code;

  const fetchOrders = useCallback(async () => {
    if (!storeCode) return;
    setIsLoading(true);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: 15,
      };
      if (activeTab !== 'all') params.status = activeTab;
      if (paymentFilter) params.payment_status = paymentFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminApiClient.get<ApiResponse<Order[]>>('/admin/orders', {
        params,
      });

      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page || 1);
          setTotalOrders(res.data.meta.total || 0);
        }
      }
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      toast.error('Unable to fetch orders queue.');
    } finally {
      setIsLoading(false);
    }
  }, [storeCode, activeTab, paymentFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Open modal & fetch comprehensive order detail if needed
  const handleOpenFulfillment = async (order: Order) => {
    setSelectedOrder(order);
    fulfillmentFormik.setValues({
      status: order.status,
      tracking_number: order.tracking_number || '',
      carrier: order.carrier || '',
      notes: order.fulfillment_notes || '',
    });

    try {
      setIsLoadingDetail(true);
      const res = await adminApiClient.get<ApiResponse<Order>>(`/admin/orders/${order.order_number}`);
      if (res.data?.success && res.data?.data) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load order detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Formik for Fulfillment Status Modal
  const fulfillmentFormik = useFormik({
    initialValues: {
      status: 'processing',
      tracking_number: '',
      carrier: '',
      notes: '',
    },
    validationSchema: FulfillmentSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!selectedOrder) return;

      try {
        const payload: Record<string, any> = {
          status: values.status,
          tracking_number: values.tracking_number?.trim() || null,
          carrier: values.carrier?.trim() || null,
          notes: values.notes?.trim() || null,
        };

        const res = await adminApiClient.patch<ApiResponse<any>>(
          `/admin/orders/${selectedOrder.order_number}/status`,
          payload
        );

        if (res.status === 200 || res.data?.success) {
          toast.success(`Order ${selectedOrder.order_number} status updated to "${values.status}"!`);
          
          // Update in local state
          setOrders((prev) =>
            prev.map((o) =>
              o.order_number === selectedOrder.order_number
                ? {
                    ...o,
                    status: values.status as OrderStatus,
                    tracking_number: values.tracking_number || o.tracking_number,
                    carrier: values.carrier || o.carrier,
                  }
                : o
            )
          );
          setSelectedOrder(null);
        }
      } catch (err: any) {
        console.error('Fulfillment update error:', err);
        const msg = err.response?.data?.error?.message || 'Failed to update order status.';
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const statusTabs = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Orders & Fulfillment"
        subtitle={`Order processing queue for ${activeStore?.store_name}`}
      />

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-200">
        {statusTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setCurrentPage(1);
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Secondary Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order number or customer email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#c69b61] focus:ring-2 focus:ring-[#ffc475]/30"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-700 focus:outline-none focus:border-[#c69b61]"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending Payment</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin text-[#c69b61]')} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-6">Order Number</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Payment</th>
                <th className="py-3.5 px-6">Items</th>
                <th className="py-3.5 px-6">Total</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    Loading orders queue...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-[#f7efe5] text-[#c69b61] flex items-center justify-center mb-3">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800">No orders found</h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        {activeTab !== 'all' || searchQuery || paymentFilter
                          ? 'No orders match your selected filters.'
                          : 'There are no customer orders in this store queue yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusBadge = getOrderStatusBadge(order.status);
                  const isPaid = order.payment_status === 'paid';

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order Number */}
                      <td className="py-3.5 px-6 font-mono font-bold text-neutral-900">
                        {order.order_number}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-neutral-800">
                          {order.customer?.name || order.customer_email || 'Guest Customer'}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          {order.customer_email || order.customer?.email}
                        </p>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.bg} ${statusBadge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.payment_status.toUpperCase()}
                        </span>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-6 text-neutral-600 font-medium">
                        {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-6 font-bold text-neutral-900">
                        {order.total_formatted ||
                          formatPrice(order.total_minor, order.currency || activeStore?.default_currency)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-6 text-neutral-400 font-mono text-[11px]">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:border-[#c69b61] hover:text-[#8c652f] text-xs font-semibold"
                          onClick={() => handleOpenFulfillment(order)}
                        >
                          <PackageCheck className="w-3.5 h-3.5 mr-1" />
                          Update / Fulfill
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Page {currentPage} of {totalPages} ({totalOrders} total orders)
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

      {/* Fulfillment Status & Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Fulfillment — ${selectedOrder?.order_number}`}
        description="Inspect customer shipping details and update dispatch status"
        maxWidth="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer & Address Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs">
              <div>
                <p className="font-bold text-neutral-800 flex items-center gap-1 mb-1">
                  <Mail className="w-3.5 h-3.5 text-[#c69b61]" /> Customer Details
                </p>
                <p className="font-semibold text-neutral-900">
                  {selectedOrder.customer?.name || 'Customer'}
                </p>
                <p className="text-neutral-500">{selectedOrder.customer_email || selectedOrder.customer?.email}</p>
                {selectedOrder.customer?.phone && (
                  <p className="text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {selectedOrder.customer.phone}
                  </p>
                )}
              </div>

              <div>
                <p className="font-bold text-neutral-800 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#c69b61]" /> Shipping Address
                </p>
                {selectedOrder.shipping_address ? (
                  <p className="text-neutral-600 leading-relaxed">
                    {selectedOrder.shipping_address.address_line1}
                    {selectedOrder.shipping_address.address_line2 && `, ${selectedOrder.shipping_address.address_line2}`}
                    <br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                    {selectedOrder.shipping_address.postal_code}
                    <br />
                    {selectedOrder.shipping_address.country}
                  </p>
                ) : (
                  <p className="text-neutral-400 italic">No physical shipping address provided.</p>
                )}
              </div>
            </div>

            {/* Line Items Preview if available */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className="border border-neutral-100 rounded-2xl p-4 bg-white">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Ordered Items ({selectedOrder.items.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-50 last:border-none"
                    >
                      <div>
                        <p className="font-bold text-neutral-800">{item.product_name}</p>
                        <p className="text-[10px] font-mono text-neutral-400">
                          SKU: {item.sku} &times; {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        {formatPrice(item.subtotal_minor, selectedOrder.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formik Fulfillment Status Form */}
            <form onSubmit={fulfillmentFormik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Fulfillment Status *
                </label>
                <select
                  id="status"
                  value={fulfillmentFormik.values.status}
                  onChange={fulfillmentFormik.handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-800 font-semibold focus:outline-none focus:border-[#c69b61]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {fulfillmentFormik.touched.status && fulfillmentFormik.errors.status && (
                  <p className="text-xs text-rose-600 mt-1">{fulfillmentFormik.errors.status}</p>
                )}
              </div>

              {/* Show tracking info when marking shipped */}
              {fulfillmentFormik.values.status === 'shipped' && (
                <div className="p-4 rounded-2xl bg-[#f7efe5]/50 border border-[#d5a667]/30 space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Shipping Carrier *"
                      placeholder="e.g. FedEx, DHL, UPS"
                      id="carrier"
                      value={fulfillmentFormik.values.carrier}
                      onChange={fulfillmentFormik.handleChange}
                      onBlur={fulfillmentFormik.handleBlur}
                      error={
                        fulfillmentFormik.touched.carrier && fulfillmentFormik.errors.carrier
                          ? fulfillmentFormik.errors.carrier
                          : undefined
                      }
                    />
                    <Input
                      label="Tracking Number *"
                      placeholder="e.g. TRK987654321US"
                      id="tracking_number"
                      value={fulfillmentFormik.values.tracking_number}
                      onChange={fulfillmentFormik.handleChange}
                      onBlur={fulfillmentFormik.handleBlur}
                      error={
                        fulfillmentFormik.touched.tracking_number &&
                        fulfillmentFormik.errors.tracking_number
                          ? fulfillmentFormik.errors.tracking_number
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              <Textarea
                label="Fulfillment Notes (Optional)"
                placeholder="Internal notes or dispatch comments..."
                id="notes"
                rows={2}
                value={fulfillmentFormik.values.notes}
                onChange={fulfillmentFormik.handleChange}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedOrder(null)}
                  disabled={fulfillmentFormik.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  className="font-bold"
                  isLoading={fulfillmentFormik.isSubmitting}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Save & Update Status
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
