'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import adminApiClient from '@/lib/adminApiClient';
import { ApiResponse, AdminLoginResponse } from '@/types/admin';
import { useAdminStore } from '@/store/useAdminStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Eye, EyeOff, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email address is required')
    .max(150, 'Email cannot exceed 150 characters'),
  password: Yup.string().required('Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const storeCode = localStorage.getItem('active_store_code');
    if (token) {
      if (storeCode) {
        router.replace('/dashboard');
      } else {
        router.replace('/select-store');
      }
    }
  }, [router]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await adminApiClient.post<ApiResponse<AdminLoginResponse>>(
          '/admin/auth/login',
          {
            email: values.email.trim().toLowerCase(),
            password: values.password,
          }
        );

        if (response.data?.success && response.data?.data) {
          const authData = response.data.data;
          setAuth(authData);

          toast.success(`Welcome back, ${authData.staff.first_name}!`);

          // Branching logic per backend specifications:
          // If staff has more than 1 store or is platform admin, go to /select-store
          if (authData.can_access_all_stores || (authData.stores && authData.stores.length > 1)) {
            router.push('/select-store');
          } else if (authData.stores && authData.stores.length === 1) {
            router.push('/dashboard');
          } else {
            router.push('/select-store');
          }
        } else {
          setServerError('Unexpected response from authentication service.');
        }
      } catch (err: any) {
        console.error('Admin Login Error:', err);
        const errorData = err.response?.data?.error;
        const statusCode = err.response?.status;

        if (statusCode === 429) {
          setServerError(
            errorData?.message || 'Too many failed login attempts. Please wait a minute before retrying.'
          );
        } else if (statusCode === 403) {
          setServerError(
            errorData?.message || 'Your staff account has been deactivated. Please contact platform administration.'
          );
        } else if (statusCode === 401) {
          setServerError(errorData?.message || 'Invalid email or password.');
        } else {
          setServerError(
            errorData?.message || 'Unable to connect to the administration server. Please verify your internet or try again later.'
          );
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f7efe5]/50 via-[#ffffff] to-[#f7efe5]/30 p-4">
      {/* Background ambient gold glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ffc475]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d5a667]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-[#c69b61]/10 border border-[#d5a667]/25 p-8 sm:p-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#d5a667]/25 flex items-center justify-center p-2.5 shadow-md shadow-[#c69b61]/15 mb-4 animate-in zoom-in-75 duration-300">
            <Image
              src="/logo.png"
              alt="GL Glow Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 font-[family-name:var(--font-display)]">
            GL GLOW
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c69b61] mt-0.5">
            Staff Administrative Portal
          </p>
          <p className="text-xs text-neutral-500 mt-2 max-w-xs">
            Enter your administrative credentials to access your store workspaces and manage orders & inventory.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700 font-medium leading-relaxed">
              {serverError}
            </div>
          </div>
        )}

        {/* Formik Form */}
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Staff Email"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="e.g. admin@glglow.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
            />
          </div>

          <div>
            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.password && formik.errors.password
                    ? formik.errors.password
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-8 text-neutral-400 hover:text-neutral-700 focus:outline-none transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full font-bold tracking-wide"
              isLoading={formik.isSubmitting}
            >
              Sign In to Admin Console
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-400">
            Protected by multi-tenant role authorization & Sanctum token security.
          </p>
        </div>
      </div>
    </div>
  );
}
