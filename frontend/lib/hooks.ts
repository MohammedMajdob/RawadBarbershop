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

// Available dates - cached for 2 minutes, revalidates in background
export function useAvailableDates() {
  return useSWR('/availability/dates', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // don't refetch within 60s
    keepPreviousData: true,
  });
}

// Available time slots - cached per date, polls every 5s in background
export function useAvailableSlots(date: string | null) {
  return useSWR(date ? `/availability?date=${date}` : null, fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}

// Hero images - rarely change, cache aggressively
export function useHeroImages() {
  return useSWR('/availability/hero', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 min
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
