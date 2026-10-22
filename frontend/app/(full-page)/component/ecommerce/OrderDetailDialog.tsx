'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import {
  Package,
  User,
  MapPin,
  Clock,
  AlertCircle,
  Truck,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

import {
  EcommerceOrder,
  EcommerceOrderItem,
  OrderStatus,
  PaymentStatus,
} from '@/types/ecommerce';

import { ecommerceService } from '@/app/api/ecommerce/ecommerceService';
import {
  formatRupiah,
  extractErrorMessage,
} from '@/app/api/ecommerce/client';

import { OrderStatusTimeline } from './OrderStatusTimeline';

interface OrderDetailDialogProps {
  visible: boolean;
  order: EcommerceOrder | null;
  onHide: () => void;
  onOrderUpdated: (updated: EcommerceOrder) => void;
}

// Pilihan status pesanan
const STATUS_OPTIONS: {
  label: string;
  value: OrderStatus;
}[] = [
  { label: 'Menunggu Konfirmasi (Pending)', value: 'pending' },
  { label: 'Dikonfirmasi (Confirmed)', value: 'confirmed' },
  { label: 'Sedang Diproses (Processing)', value: 'processing' },
  { label: 'Sedang Dikirim (Shipped)', value: 'shipped' },
  { label: 'Selesai (Completed)', value: 'completed' },
  { label: 'Dibatalkan (Cancelled)', value: 'cancelled' },
];

// Pilihan status pembayaran
export const PAYMENT_STATUS_OPTIONS: {
  label: string;
  value: PaymentStatus;
}[] = [
  { label: 'Belum Dibayar (Unpaid)', value: 'unpaid' },
  {
    label: 'Menunggu Verifikasi (Waiting)',
    value: 'waiting_verification',
  },
  { label: 'Sudah Dibayar (Paid)', value: 'paid' },
  { label: 'Ditolak (Rejected)', value: 'rejected' },
];

// Warna status pembayaran
export const getPaymentStatusSeverity = (
  status: string
): 'warning' | 'info' | 'success' | 'danger' => {
  switch (status) {
    case 'unpaid':
      return 'warning';

    case 'waiting_verification':
      return 'info';

    case 'paid':
      return 'success';

    case 'rejected':
      return 'danger';

    default:
      return 'info';
  }
};

// Label status pembayaran
export const getPaymentStatusLabel = (status: string): string => {
  switch (status) {
    case 'unpaid':
      return 'Belum Dibayar';

    case 'waiting_verification':
      return 'Menunggu Verifikasi';

    case 'paid':
      return 'Sudah Dibayar';

    case 'rejected':
      return 'Ditolak';

    default:
      return status;
  }
};

// Warna status pesanan
export const getOrderStatusSeverity = (
  status: string
): 'warning' | 'info' | 'success' | 'danger' => {
  switch (status) {
    case 'pending':
      return 'warning';

    case 'confirmed':
    case 'processing':
    case 'shipped':
      return 'info';

    case 'completed':
      return 'success';

    case 'cancelled':
      return 'danger';

    default:
      return 'info';
  }
};

// Label status pesanan
export const getOrderStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Menunggu Konfirmasi';

    case 'confirmed':
      return 'Dikonfirmasi';

    case 'processing':
      return 'Sedang Diproses';

    case 'shipped':
      return 'Sedang Dikirim';

    case 'completed':
      return 'Selesai';

    case 'cancelled':
      return 'Dibatalkan';

    default:
      return status;
  }
};

export const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({
  visible,
  order,
  onHide,
  onOrderUpdated,
}) => {
  // State status pesanan
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>('pending');

  // State catatan admin
  const [adminNotes, setAdminNotes] = useState<string>('');

  // State status pembayaran
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<PaymentStatus>('unpaid');

  // State nomor resi
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // State proses penyimpanan
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isUpdatingPayment, setIsUpdatingPayment] =
    useState<boolean>(false);

  // State pesan
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mengisi form ketika data pesanan berubah
  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setAdminNotes(order.notes || '');
      setSelectedPaymentStatus(order.payment_status || 'unpaid');
      setTrackingNumber(order.tracking_number || '');

      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [order]);

  // Memperbarui status pesanan
  const handleUpdateStatus = async () => {
    if (!order) return;

    // Validasi nomor resi
    if (
      selectedStatus === 'shipped' &&
      !trackingNumber.trim() &&
      !order.tracking_number
    ) {
      setErrorMessage(
        'Nomor resi wajib diisi sebelum pesanan ditandai Dikirim.'
      );
      setSuccessMessage(null);
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await ecommerceService.updateOrderStatus(
        order.id,
        selectedStatus,
        adminNotes,
        undefined,
        selectedStatus === 'shipped'
          ? trackingNumber.trim() || order.tracking_number || undefined
          : undefined
      );

      onOrderUpdated(updated);
      setSuccessMessage('Status pesanan berhasil diperbarui.');
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Memperbarui status pembayaran
  const handleUpdatePaymentStatus = async () => {
    if (!order) return;

    setIsUpdatingPayment(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await ecommerceService.updateOrderStatus(
        order.id,
        undefined,
        undefined,
        selectedPaymentStatus
      );

      onOrderUpdated(updated);
      setSuccessMessage('Status pembayaran berhasil diperbarui.');
    } catch (err: unknown) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Jika data pesanan tidak tersedia, dialog tidak ditampilkan
  if (!order) return null;

  // Header dialog
  const headerElement = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pr-6">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-pink-600" />

        <span className="font-bold text-lg font-mono text-gray-800">
          {order.order_number}
        </span>
      </div>

      <Tag
        value={getOrderStatusLabel(order.status)}
        severity={getOrderStatusSeverity(order.status)}
        className="text-xs px-3 py-1 font-semibold"
      />
    </div>
  );

  return (
    <Dialog
      header={headerElement}
      visible={visible}
      style={{ width: '90vw', maxWidth: '850px' }}
      modal
      onHide={onHide}
      className="p-fluid"
    >
      <div className="space-y-6 pt-2">
        {/* Pesan error */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pesan sukses */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Timeline status pesanan */}
        <OrderStatusTimeline currentStatus={order.status} />

        {/* Informasi pelanggan dan pengiriman */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informasi pelanggan */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-200">
              <User className="w-4 h-4 text-pink-600" />
              <span>Informasi Pelanggan</span>
            </div>

            <div className="text-sm space-y-3 pt-1">
              <div>
                <span className="text-xs text-gray-500 block">
                  Nama Akun
                </span>

                <span className="font-semibold text-gray-800">
                  {order.customer?.name || order.shipping_name || '-'}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block">
                  Email
                </span>

                <span className="text-gray-700">
                  {order.customer?.email || '-'}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block">
                  WhatsApp / Telepon
                </span>

                <span className="text-gray-700 font-mono text-xs">
                  {order.shipping_whatsapp ||
                    order.customer?.phone ||
                    '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Informasi pengiriman */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider pb-1 border-b border-gray-200">
              <MapPin className="w-4 h-4 text-pink-600" />
              <span>Alamat Pengiriman</span>
            </div>

            <div className="text-sm space-y-3 pt-1">
              <div>
                <span className="text-xs text-gray-500 block">
                  Penerima
                </span>

                <span className="font-semibold text-gray-800">
                  {order.shipping_name || '-'}
                </span>

                <span className="block text-xs text-gray-600">
                  {order.shipping_whatsapp || '-'}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block">
                  Alamat Lengkap
                </span>

                <span className="text-gray-700 text-xs leading-relaxed block">
                  {order.shipping_address || '-'}
                  {order.shipping_kecamatan
                    ? `, ${order.shipping_kecamatan}`
                    : ''}
                  {order.shipping_city
                    ? `, ${order.shipping_city}`
                    : ''}
                  {order.shipping_province
                    ? `, ${order.shipping_province}`
                    : ''}
                  {order.shipping_postal_code
                    ? ` ${order.shipping_postal_code}`
                    : ''}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-500 block">
                  Ekspedisi
                </span>

                <span className="font-medium text-gray-700 uppercase">
                  {order.shipping_method || '-'}
                </span>
              </div>

              {order.tracking_number && (
                <div>
                  <span className="text-xs text-gray-500 block">
                    Nomor Resi
                  </span>

                  <span className="font-mono text-xs font-semibold text-gray-800 break-all">
                    {order.tracking_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daftar item pesanan */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <Package className="w-4 h-4 text-pink-600" />

              <span>
                Item Pesanan ({order.items?.length || 0})
              </span>
            </div>

            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />

              {new Date(order.created_at).toLocaleString('id-ID')}
            </span>
          </div>

          <DataTable
            value={order.items || []}
            responsiveLayout="scroll"
            className="p-datatable-sm"
            emptyMessage="Tidak ada item dalam pesanan ini."
          >
            {/* Kolom produk */}
            <Column
              header="Produk"
              body={(item: EcommerceOrderItem) => (
                <div>
                  <span className="font-semibold text-gray-800 block">
                    {item.product_name}
                  </span>

                  {item.variant_name && (
                    <span className="text-xs text-pink-600 font-medium">
                      Varian: {item.variant_name}
                    </span>
                  )}

                  {item.sku && (
                    <span className="text-[11px] text-gray-400 block font-mono">
                      SKU: {item.sku}
                    </span>
                  )}
                </div>
              )}
            />

            {/* Kolom harga */}
            <Column
              header="Harga"
              body={(item: EcommerceOrderItem) => (
                <span className="text-xs font-mono text-gray-700">
                  {formatRupiah(item.unit_price)}
                </span>
              )}
            />

            {/* Kolom jumlah */}
            <Column
              header="Qty"
              field="quantity"
              body={(item: EcommerceOrderItem) => (
                <span className="font-semibold text-xs text-gray-800">
                  × {item.quantity}
                </span>
              )}
              style={{ width: '80px', textAlign: 'center' }}
            />

            {/* Kolom subtotal */}
            <Column
              header="Subtotal"
              body={(item: EcommerceOrderItem) => (
                <span className="text-xs font-bold font-mono text-gray-900">
                  {formatRupiah(item.subtotal)}
                </span>
              )}
              style={{ textAlign: 'right' }}
            />
          </DataTable>

          {/* Ringkasan pembayaran */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col items-end space-y-2 text-sm">
            <div className="flex justify-between w-full sm:w-64 text-xs text-gray-600">
              <span>Subtotal Produk:</span>

              <span className="font-mono">
                {formatRupiah(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between w-full sm:w-64 text-xs text-gray-600">
              <span>Biaya Pengiriman:</span>

              <span className="font-mono">
                {formatRupiah(order.shipping_cost || 0)}
              </span>
            </div>

            <div className="flex justify-between w-full sm:w-64 text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
              <span>Total Pesanan:</span>

              <span className="text-pink-600 font-mono text-base">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Catatan pelanggan */}
        {order.notes && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="font-semibold text-amber-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />

              <span>Catatan Pelanggan:</span>
            </div>

            <p className="text-amber-900 italic whitespace-pre-wrap">
              {order.notes}
            </p>
          </div>
        )}

        {/* Bukti transfer */}
        {order.transfer_proof_url && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-blue-500" />

              <span>Bukti Transfer</span>
            </div>

            <a
              href={order.transfer_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Klik untuk melihat ukuran penuh"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.transfer_proof_url}
                alt="Bukti transfer pelanggan"
                className="max-h-48 max-w-full rounded-lg border border-blue-200 object-contain cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>

            <p className="text-[11px] text-blue-600">
              Klik gambar untuk melihat ukuran penuh.
            </p>
          </div>
        )}

        {/* Catatan admin */}
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
          <label
            htmlFor="admin-order-notes"
            className="text-xs font-bold text-gray-700 uppercase tracking-wider block"
          >
            Catatan Admin
          </label>

          <InputTextarea
            id="admin-order-notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            autoResize
            maxLength={1000}
            placeholder="Tambahkan catatan untuk pesanan ini (opsional)"
            className="w-full text-sm"
          />

          <p className="text-[11px] text-gray-500">
            Catatan akan disimpan ketika status pesanan diperbarui.
          </p>
        </div>

        {/* Ubah status pesanan */}
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Truck className="w-4 h-4 text-pink-600" />

            <span>Ubah Status Pesanan</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                Status Baru
              </label>

              <Dropdown
                value={selectedStatus}
                options={STATUS_OPTIONS}
                onChange={(e) => setSelectedStatus(e.value)}
                optionLabel="label"
                optionValue="value"
                placeholder="Pilih Status"
                className="w-full text-xs"
              />
            </div>

            <div>
              <Button
                type="button"
                label={
                  isUpdating ? 'Menyimpan...' : 'Perbarui Status'
                }
                icon={
                  isUpdating
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-check'
                }
                onClick={handleUpdateStatus}
                disabled={isUpdating || isUpdatingPayment}
                className="w-full bg-pink-600 hover:bg-pink-700 border-none text-xs h-10"
              />
            </div>

            {/* Input nomor resi */}
            {selectedStatus === 'shipped' && (
              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs font-medium text-gray-600 block">
                  Nomor Resi (
                  {(
                    order.courier ||
                    order.shipping_method ||
                    ''
                  ).toUpperCase()}
                  ) <span className="text-red-500">*</span>
                </label>

                <InputText
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Masukkan nomor resi pengiriman"
                  maxLength={100}
                  className="w-full text-xs"
                />

                <p className="text-[11px] text-gray-500">
                  Pastikan nomor resi sudah benar sebelum menyimpan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status pembayaran */}
        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-pink-600" />

              <span>Status Pembayaran</span>
            </div>

            <Tag
              value={getPaymentStatusLabel(
                order.payment_status || 'unpaid'
              )}
              severity={getPaymentStatusSeverity(
                order.payment_status || 'unpaid'
              )}
              className="text-[11px] px-2.5 py-0.5"
            />
          </div>

          {/* Metode pembayaran */}
          {order.payment_method && (
            <div className="text-xs text-gray-500">
              Metode:{' '}
              <span className="font-semibold text-gray-700 uppercase">
                {order.payment_method.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Informasi pembayaran berhasil */}
          {order.payment_status === 'paid' && (
            <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />

              <span className="font-semibold">
                Pembayaran telah diverifikasi oleh admin.
              </span>
            </div>
          )}

          {/* Informasi pembayaran ditolak */}
          {order.payment_status === 'rejected' && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />

              <span className="font-semibold">
                Transfer ditolak. Hubungi pelanggan untuk klarifikasi.
              </span>
            </div>
          )}

          {/* Form perubahan status pembayaran */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-gray-600 block">
                Ubah Status Pembayaran
              </label>

              <Dropdown
                value={selectedPaymentStatus}
                options={PAYMENT_STATUS_OPTIONS}
                onChange={(e) =>
                  setSelectedPaymentStatus(e.value)
                }
                optionLabel="label"
                optionValue="value"
                placeholder="Pilih Status Pembayaran"
                className="w-full text-xs"
              />
            </div>

            <div>
              <Button
                type="button"
                label={
                  isUpdatingPayment
                    ? 'Menyimpan...'
                    : 'Perbarui Pembayaran'
                }
                icon={
                  isUpdatingPayment
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-check'
                }
                onClick={handleUpdatePaymentStatus}
                disabled={isUpdating || isUpdatingPayment}
                className="w-full p-button-outlined p-button-success text-xs h-10"
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};