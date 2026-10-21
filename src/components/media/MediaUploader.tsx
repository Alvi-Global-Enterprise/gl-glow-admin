'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, MediaUploadResponse } from '@/types/admin';
import { toast } from 'sonner';

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: 'products' | 'categories' | 'avatars' | 'banners' | 'general';
  label?: string;
  helperText?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  value,
  onChange,
  folder = 'products',
  label = 'Product Image',
  helperText = 'SVG, PNG, JPG or WEBP (Max 10MB). Uploads directly to AWS S3.',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      setIsUploading(true);
      const res = await adminApiClient.post<ApiResponse<MediaUploadResponse>>(
        '/admin/media/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data?.success && res.data?.data?.url) {
        onChange(res.data.data.url);
        toast.success('Media successfully uploaded to AWS S3!');
      } else {
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (err: any) {
      console.error('S3 Media Upload Error:', err);
      const msg = err.response?.data?.error?.message || 'Error uploading file to S3';
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group w-full h-52 rounded-2xl overflow-hidden border border-[#d5a667]/30 bg-neutral-50 shadow-inner">
          <Image
            src={value}
            alt="Uploaded Preview"
            fill
            className="object-contain p-2"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-white/90 text-xs font-medium text-black hover:bg-white shadow transition"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-4 text-center ${
            dragOver
              ? 'border-[#c69b61] bg-[#f7efe5]/40 scale-[1.01]'
              : 'border-neutral-200 hover:border-[#d5a667] bg-white hover:bg-[#f7efe5]/10'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#c69b61] animate-spin" />
              <p className="text-xs font-semibold text-neutral-600">Uploading to AWS S3...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#f7efe5] flex items-center justify-center text-[#c69b61] shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
};
