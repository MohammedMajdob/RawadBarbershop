'use client';

import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-1b38.up.railway.app/api';

async function fetcher(endpoint: string) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function authFetcher([endpoint, token]: [string, string]) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Available dates - revalidates on focus and every 30s
export function useAvailableDates() {
  return useSWR('/availability/dates', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 30000,
    dedupingInterval: 10000,
    keepPreviousData: true,
  });
}

// Available time slots - polls every 5s
export function useAvailableSlots(date: string | null) {
  return useSWR(date ? `/availability?date=${date}` : null, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    keepPreviousData: false,
  });
}

// Hero images - revalidate on focus
export function useHeroImages() {
  return useSWR('/availability/hero', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 30000, // 30 sec
    keepPreviousData: false,
  });
}

// Site settings (header media, logo, business info)
export function useSiteSettings() {
  return useSWR('/availability/site-settings', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 min
    keepPreviousData: true,
  });
}

// Public product images
export function useProductImages() {
  return useSWR('/availability/products', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 min
    keepPreviousData: true,
  });
}

// Customer bookings
export function useMyBookings(token: string | null) {
  return useSWR(
    token ? ['/booking/my', token] : null,
    authFetcher,
    {
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );
}
