import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(minor: number = 0, currency: string = "USD"): string {
  const amount = (minor / 100).toFixed(2);
  const symbolMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    AED: "AED ",
  };
  const symbol = symbolMap[currency.toUpperCase()] || `${currency} `;
  return `${symbol}${amount}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function getRoleBadgeColor(role: string): { bg: string; text: string; border: string } {
  switch (role) {
    case "store_owner":
      return { bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-300" };
    case "store_manager":
      return { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300" };
    case "catalog_manager":
      return { bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-300" };
    case "fulfillment_agent":
      return { bg: "bg-purple-100", text: "text-purple-900", border: "border-purple-300" };
    case "support_agent":
      return { bg: "bg-slate-100", text: "text-slate-900", border: "border-slate-300" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
  }
}

export function getOrderStatusBadge(status: string): { bg: string; text: string; dot: string } {
  switch (status.toLowerCase()) {
    case "confirmed":
      return { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" };
    case "processing":
      return { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" };
    case "shipped":
      return { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" };
    case "delivered":
      return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "cancelled":
      return { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" };
    case "pending":
    default:
      return { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", dot: "bg-gray-400" };
  }
}
